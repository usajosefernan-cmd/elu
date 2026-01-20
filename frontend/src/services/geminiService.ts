

import { getSupabaseClient, supabaseUrl, supabaseAnonKey } from './authService';
import { LuxConfig, SemanticAnalysis, ArchivedVariation } from "../types";
import { getReadableTimestamp } from '../utils/timestamps';

export const MASTER_PRESET_LIBRARY = [
    // ... (Keep existing library if needed, or rely on shared logic) ...
];

export const compressAndResizeImage = async (file: File): Promise<{ blob: Blob, aspectRatio: number }> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const aspectRatio = width / height;

            // RESTORED: 8192px (8K) Limit for Ultra High Fidelity Analysis
            const MAX_DIMENSION = 8192;

            if (width > height) {
                if (width > MAX_DIMENSION) {
                    height *= MAX_DIMENSION / width;
                    width = MAX_DIMENSION;
                }
            } else {
                if (height > MAX_DIMENSION) {
                    width *= MAX_DIMENSION / height;
                    height = MAX_DIMENSION;
                }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error("Could not get canvas context"));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            // Optimización JPEG al 80% (Universal Compatibility)
            canvas.toBlob((blob) => {
                if (blob) resolve({ blob, aspectRatio });
                else reject(new Error("Compression failed"));
            }, 'image/jpeg', 0.80);
        };

        img.onerror = (err) => {
            reject(new Error("Failed to load image for optimization"));
        };

        img.src = url;
    });
};

export const uploadImageToStorage = async (imageBlob: Blob, userId: string): Promise<string> => {
    const supabase = getSupabaseClient();
    const fileName = `${userId}/${getReadableTimestamp()}_optimized.jpg`;

    const { data, error } = await supabase.storage
        .from('lux-storage')
        .upload(fileName, imageBlob, {
            contentType: 'image/jpeg',
            upsert: true // Cambio: permitir sobrescribir para evitar conflictos
        });

    if (error) throw new Error(`Upload Failed: ${error.message}`);

    const { data: publicUrlData } = supabase.storage
        .from('lux-storage')
        .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
};

// Helper for Fetch with Retry logic
const fetchWithAuthRetry = async (url: string, body: any, userToken?: string): Promise<Response> => {
    // 1. Try with provided User Token (if any)
    let headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken || supabaseAnonKey}`
    };

    let response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    });

    // 2. If 401 (Unauthorized/Invalid JWT), Retry with Anon Key (Guest Mode)
    // This prevents the app from blocking users with stale sessions
    if (response.status === 401 && userToken) {
        console.warn("User token rejected (401). Retrying request as Guest (Anon Key)...");
        headers['Authorization'] = `Bearer ${supabaseAnonKey}`;
        response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });
    }

    return response;
};

// NEW: Phase 1 Analysis Call
export const analyzeImage = async (imageUrl: string): Promise<SemanticAnalysis> => {
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetchWithAuthRetry(
        `${supabaseUrl}/functions/v1/vision-analysis`,
        { imageUrl },
        session?.access_token
    );

    if (!response.ok) {
        const errText = await response.text();
        console.error("Vision API Error:", errText);
        throw new Error(`Vision Analysis Failed: ${errText}`);
    }
    return await response.json();
};

// NEW: Master Sculptor Call (Velvet Rope)
export const generateMaster = async (
    variationId: string,
    settings: any = {},
    refinePrompt?: string,
    guestContext?: { originalUrl: string, previewUrl: string, prompt: string, styleId: string }
): Promise<ArchivedVariation> => {
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    const targetUrl = `${supabaseUrl}/functions/v1/master-sculptor`;
    console.log(`[GeminiService] Calling Master Sculptor: ${targetUrl}`);

    const response = await fetchWithAuthRetry(
        targetUrl,
        { variationId, settings, refinePrompt, guestContext },
        session?.access_token
    );

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Master Sculptor Failed: ${errText}`);
    }

    const data = await response.json();
    return data.variation;
};

export const generatePreviewGrid = async (
    imageUrl: string,
    settings: LuxConfig,
    precomputedAnalysis: SemanticAnalysis | null,
    onStreamUpdate: (event:
        | { type: 'queue'; position: number; message?: string }
        | { type: 'info'; message: string }
        | { type: 'session_start'; data: { generationId: string } }
        | { type: 'variation'; data: any }
        | { type: 'done' }
        | { type: 'error'; message: string }
        | { type: 'variation_error'; id: string; error: string }
    ) => void
): Promise<void> => {

    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    console.log("Connecting to Neural Core...");

    let response: Response;
    try {
        response = await fetchWithAuthRetry(
            `${supabaseUrl}/functions/v1/preview-generator`,
            { imageUrl, settings, precomputedAnalysis },
            token
        );
    } catch (e: any) {
        console.error("Initial Fetch Error:", e);
        throw new Error("No se pudo conectar con el servidor. Verifique su conexión.");
    }

    if (!response.ok) {
        const errText = await response.text();
        console.error("Core Failure Response:", errText);

        // Since we already retried with Anon Key, a 401 here is a hard failure (e.g. invalid anon key)
        if (response.status === 401) {
            throw new Error("Acceso denegado. Por favor contacte soporte.");
        }

        throw new Error(`Core Failure (${response.status}): ${errText || response.statusText}`);
    }

    if (!response.body) throw new Error("No response body from Neural Core");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let receivedDone = false;

    try {
        // Watchdog for stalled streams
        const STREAM_TIMEOUT_MS = 30000; // 30s silence limit

        while (true) {
            // Race between reading the next chunk and a timeout
            const readPromise = reader.read();
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("Timeout: No data received from Neural Core for 30s")), STREAM_TIMEOUT_MS)
            );

            const { value, done } = await Promise.race([readPromise, timeoutPromise]);

            if (value) {
                const chunk = decoder.decode(value, { stream: !done });
                buffer += chunk;
            }

            if (done) {
                if (buffer.trim()) {
                    const lines = buffer.split('\n');
                    for (const line of lines) {
                        // ... existing parsing logic ...
                        if (line.trim()) {
                            try {
                                const event = JSON.parse(line);
                                if (event.type === 'ping') continue;
                                if (event.type === 'done') receivedDone = true;
                                onStreamUpdate(event);
                            } catch (e) { console.warn("Final chunk parse error", e); }
                        }
                    }
                }
                break;
            }

            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const event = JSON.parse(line);
                        if (event.type === 'ping') continue;
                        if (event.type === 'done') receivedDone = true;
                        onStreamUpdate(event);
                    } catch (e) {
                        console.warn("Stream parse error:", e);
                    }
                }
            }
        }
    } catch (e: any) {
        const msg = e.message?.toLowerCase() || "";
        const isNetworkError = msg.includes("network error") || msg.includes("connection closed");

        if (isNetworkError) {
            console.warn("Stream Reader Warning (Network Interruption):", e);
        } else {
            console.error("Stream Reader Error:", e);
        }

        if (!receivedDone) {
            if (isNetworkError) {
                throw new Error("Conexión interrumpida con el laboratorio. Por favor, reintente.");
            }
            throw new Error(`Stream Interrupted: ${e.message}`);
        }
    } finally {
        reader.releaseLock();
    }

    if (!receivedDone) {
        throw new Error("La conexión se cerró inesperadamente. El servidor puede estar sobrecargado.");
    }
};
