import { getSupabaseClient, supabaseAnonKey } from './authService';
import { LuxConfig, SemanticAnalysis, ArchivedVariation } from "../types";
import { getReadableTimestamp } from '../utils/timestamps';

// --- IMAGE UTILS ---
export const compressAndResizeImage = async (file: File): Promise<{ blob: Blob, aspectRatio: number }> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            const canvas = document.createElement('canvas');
            const MAX_DIMENSION = 8192;
            let { width, height } = img;
            if (width > height && width > MAX_DIMENSION) {
                height *= MAX_DIMENSION / width; width = MAX_DIMENSION;
            } else if (height > MAX_DIMENSION) {
                width *= MAX_DIMENSION / height; height = MAX_DIMENSION;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
                if (blob) resolve({ blob, aspectRatio: width/height });
                else reject(new Error("Compression failed"));
            }, 'image/jpeg', 0.80);
        };
        img.onerror = reject;
        img.src = url;
    });
};

export const uploadImageToStorage = async (imageBlob: Blob, userId: string): Promise<string> => {
    const supabase = getSupabaseClient();
    const fileName = `${userId}/${Date.now()}.jpg`;

    const { error } = await supabase.storage
        .from('lux-storage')
        .upload(fileName, imageBlob, { contentType: 'image/jpeg', upsert: false });

    if (error) {
        // IMPORTANT: Do NOT fallback to base64 (it freezes UI and mixes flows).
        // Instead, show a clear error so bucket/policies can be fixed.
        throw new Error(`Storage upload failed: ${error.message}`);
    }

    const { data: publicUrl } = supabase.storage.from('lux-storage').getPublicUrl(fileName);
    return publicUrl.publicUrl;
};

// --- API CLIENT ---
const API_BASE = '/api/process'; // Proxied to Python Backend

export const analyzeImage = async (imageUrl: string): Promise<SemanticAnalysis> => {
    const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl })
    });
    if (!response.ok) throw new Error("Vision Analysis Failed");
    const data = await response.json();
    return data.analysis;
};

export const generateMaster = async (
    variationId: string,
    settings: any = {},
    refinePrompt?: string,
    guestContext?: any
): Promise<ArchivedVariation> => {
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id || 'guest';

    // Construct prompt from settings/context
    const promptContext = refinePrompt || `Settings: ${JSON.stringify(settings)}`;
    const imageUrl = guestContext?.originalUrl;

    const response = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId,
            input: { content: promptContext, imageUrl }
        })
    });

    if (!response.ok) throw new Error("Generation Failed");
    const data = await response.json();
    
    // Map backend response to ArchivedVariation type
    return {
        id: variationId,
        url: data.output.image || imageUrl, // Use generated image or fallback
        prompt: data.output.text,
        styleId: 'custom',
        timestamp: Date.now(),
        settings: settings
    };
};

export const generatePreviewGrid = async (
    imageUrl: string,
    settings: LuxConfig,
    analysis: SemanticAnalysis | null,
    onStreamUpdate: (event: any) => void
): Promise<void> => {
    // Simulate Streaming for Compatibility with Repo UI
    onStreamUpdate({ type: 'session_start', data: { generationId: 'sim-1' } });
    onStreamUpdate({ type: 'info', message: 'Connecting to Gemini 3 Pro...' });

    try {
        // reuse generateMaster logic
        const result = await generateMaster('preview-1', settings, undefined, { originalUrl: imageUrl });
        
        onStreamUpdate({ 
            type: 'variation', 
            data: { 
                id: 'var-1', 
                url: result.url, 
                prompt: result.prompt,
                styleId: 'preview' 
            } 
        });
        onStreamUpdate({ type: 'done' });
    } catch (e: any) {
        onStreamUpdate({ type: 'error', message: e.message });
    }
};
