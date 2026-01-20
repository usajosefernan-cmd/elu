// FORENSIC-LAB EDGE FUNCTION v1.0
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"
import { getRotatedApiKey } from "../_shared/key-rotator.ts"

// --- TYPES ---
interface LabPayload {
    action: 'RUN_FORENSIC' | 'UPDATE_PROMPT' | 'GET_PROMPTS';
    image_url?: string; // Input URL
    strategy?: string;  // seedream_forensic, nano_banana, nano_banana_pro
    prompt?: string;     // For update prompt
    userId?: string;    // Passed from frontend or extracted
}

import { buildStandardFileName, buildStandardStoragePath } from "../_shared/storage-logic.ts"

// --- HELPERS REMOVED (USING SHARED LOGIC) ---

// --- MODELS CONFIG ---
const MODELS_MAP: Record<string, any> = {
    'nano_banana': {
        modelId: 'gemini-2.5-flash-image', // Fixed ID
        endpoint: 'https://api.laozhang.ai/v1beta/models/gemini-2.5-flash-image:generateContent',
        label: 'NANOBANANA_FLASH'
    },
    'nano_banana_pro': {
        modelId: 'gemini-3-pro-image-preview', // Fixed ID
        endpoint: 'https://api.laozhang.ai/v1beta/models/gemini-3-pro-image-preview:generateContent',
        label: 'NANOBANANA_PRO_2K'
    },
    'seedream_forensic': {
        modelId: 'seedream-4.0-250828', // Conceptual ID for mapping
        endpoint: 'https://api.laozhang.ai/v1beta/models/gemini-2.5-flash-image:generateContent', // Actual runner is Gemini mimicking SeeDream prompted
        label: 'SEEDREAM_4_0'
    }
};

// --- MAIN SERVE ---
serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const soup = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        const payload: LabPayload = await req.json();
        const { action, userId = 'guest_lab' } = payload;

        // A. UPDATE PROMPT LOGIC
        if (action === 'UPDATE_PROMPT') {
            if (!payload.strategy || !payload.prompt) throw new Error("Missing strategy/prompt");
            const { error } = await soup.from('forensic_prompts').upsert({
                strategy_id: payload.strategy,
                prompt_text: payload.prompt,
                updated_at: new Date().toISOString()
            });
            if (error) throw error;
            return new Response(JSON.stringify({ success: true, message: 'Prompt Updated in Cloud' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // B. GET PROMPTS LOGIC
        if (action === 'GET_PROMPTS') {
            const { data, error } = await soup.from('forensic_prompts').select('*');
            if (error) throw error;
            // Transform array to object map
            const promptMap: Record<string, string> = {};
            data.forEach((r: any) => promptMap[r.strategy_id] = r.prompt_text);
            return new Response(JSON.stringify({ success: true, prompts: promptMap }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // C. RUN FORENSIC LOGIC
        if (action === 'RUN_FORENSIC') {
            const { strategy, image_url } = payload;
            if (!strategy || !image_url) throw new Error("Missing strategy or image_url");

            // 1. Get Prompt from DB
            const { data: pData } = await soup.from('forensic_prompts').select('prompt_text').eq('strategy_id', strategy).single();
            const promptText = pData?.prompt_text || "Restoration required.";

            // 2. Prepare Config
            const config = MODELS_MAP[strategy];
            if (!config) throw new Error(`Unknown strategy: ${strategy}`);

            const runKey = await getRotatedApiKey(soup);
            const apiUrl = `${config.endpoint}?key=${runKey}`;

            // 3. Download Input Image (to get base64)
            const imgResp = await fetch(image_url);
            if (!imgResp.ok) throw new Error("Failed to fetch input image");
            const imgBlob = await imgResp.blob();
            const arrayBuffer = await imgBlob.arrayBuffer();
            const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

            // 4. Construct Payload (LaoZhang Native)
            const geminiPayload = {
                contents: [{
                    parts: [
                        { inline_data: { mime_type: imgBlob.type || 'image/png', data: base64Image } },
                        { text: promptText }
                    ]
                }],
                generationConfig: {
                    // IMPORTANT: Do NOT send aspectRatio for 2K Pro to avoid crop
                    responseModalities: ["IMAGE"],
                    imageConfig: config.modelId.includes('pro') ? { imageSize: "2K" } : undefined
                }
            };

            // 5. Call API
            console.log(`[FORENSIC] Running ${strategy} via ${config.modelId}...`);
            const apiResp = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(geminiPayload)
            });

            if (!apiResp.ok) {
                const errTxt = await apiResp.text();
                throw new Error(`Partner API Error: ${apiResp.status} - ${errTxt}`);
            }

            const apiData = await apiResp.json();
            // Extract Image
            const candidate = apiData.candidates?.[0];
            const inlineData = candidate?.content?.parts?.find((p: any) => p.inline_data || p.inlineData)?.inline_data || candidate?.content?.parts?.find((p: any) => p.inline_data || p.inlineData)?.inlineData;

            if (!inlineData?.data) throw new Error("No image data in response");

            // 6. Decode & Save to Storage
            const resBytes = Uint8Array.from(atob(inlineData.data), c => c.charCodeAt(0));

            const dateNow = new Date().getTime();
            const safeFileName = buildStandardFileName(image_url, 'PREVIEW_1K', `gen_${strategy}`, 'v1', 'png');
            const storagePath = buildStandardStoragePath(userId, 'LAB_FORENSIC', `session_${dateNow}`, safeFileName);

            const { error: uploadError } = await soup.storage.from('lux-storage').upload(storagePath, resBytes, { contentType: 'image/png', upsert: true });
            if (uploadError) throw uploadError;

            const { data: publicUrlData } = soup.storage.from('lux-storage').getPublicUrl(storagePath);

            // 7. Log Result
            await soup.from('forensic_results').insert({
                id: crypto.randomUUID(),
                strategy: strategy,
                image_path: image_url, // Input
                result_url: publicUrlData.publicUrl,
                status: 'completed',
                logs: `Cloud Execution via ${config.modelId}. Prompt: ${promptText.substring(0, 50)}...`
            });

            return new Response(JSON.stringify({
                success: true,
                path: publicUrlData.publicUrl, // Return public URL for frontend to display
                strategy: strategy
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        throw new Error("Invalid Action");

    } catch (error: any) {
        console.error("Forensic Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
})
