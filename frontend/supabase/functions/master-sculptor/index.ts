import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { encode, decode as decodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { getRotatedApiKey } from "../_shared/key-rotator.ts"
import { buildStandardFileName, buildStandardStoragePath } from "../_shared/storage-logic.ts"
import { calculateGeminiCost } from "../_shared/lux-logic.ts"

declare const Deno: any;

/**
 * MASTER SCULPTOR v19.1 - SIMPLIFICADO
 * Arquitectura: 1 PASO DIRECTO con Nano Banana Pro
 * Input: Imagen Original + Preview como referencia
 * Output: 4K Masterizado
 */

function getClosestAspectRatio(w: number, h: number): string {
    const ratio = w / h;
    const ratios: Record<string, number> = {
        "1:1": 1,
        "4:3": 4 / 3,
        "3:4": 3 / 4,
        "9:16": 9 / 16,
        "16:9": 16 / 9
    };
    return Object.keys(ratios).reduce((a, b) => Math.abs(ratios[a] - ratio) < Math.abs(ratios[b] - ratio) ? a : b);
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const { variationId, settings, guestContext } = await req.json()

        const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

        // --- AUTH ---
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('Unauthorized: Auth Header Missing');

        const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
        if (!user) throw new Error('Unauthorized: Invalid Session');

        // --- DATA FETCH ---
        let originalImagePath = "";
        let previewPath = "";
        let styleId = "";
        let previewPrompt = "";
        let generationId = "";

        // Strategy A: DB Lookup (Preferred)
        if (user) {
            const { data: variation, error: varError } = await supabase
                .from('variations')
                .select(`*, generations(semantic_analysis, original_image_path)`)
                .eq('id', variationId)
                .single();

            if (variation) {
                originalImagePath = variation.generations?.original_image_path;
                previewPath = variation.image_path;
                styleId = variation.style_id || 'master';
                previewPrompt = variation.prompt_payload?.prompt || "";
                generationId = variation.generation_id;
            }
        }

        if (!originalImagePath || !previewPath) throw new Error('Source images not found in database');

        console.log(`[Master Sculptor v19.1] User: ${user.id}. Original: ${originalImagePath}`);

        // Fetch ambas imágenes
        const [originalResp, previewResp] = await Promise.all([
            fetch(originalImagePath),
            fetch(previewPath)
        ]);

        if (!originalResp.ok) throw new Error(`Failed to fetch original: ${originalResp.status}`);
        if (!previewResp.ok) throw new Error(`Failed to fetch preview: ${previewResp.status}`);

        const originalBlob = await originalResp.blob();
        const previewBlob = await previewResp.blob();

        const base64Original = encode(await originalBlob.arrayBuffer());
        const base64Preview = encode(await previewBlob.arrayBuffer());

        console.log(`[Master Sculptor v19.1] Starting Direct Generation...`);

        // --- SINGLE STEP: NANO BANANA PRO DIRECT ---
        // styleId is already defined above
        const styleName = styleId; // Simplified fallback

        // Deep Physics Reinforcement (Extract from Preview Prompt)
        let reinforcement = "";
        const opticalBlock = previewPrompt.match(/<OPTICAL_STACK>[\s\S]*?<\/OPTICAL_STACK>/);
        const physicsBlock = previewPrompt.match(/<PHYSICS_LAYER>[\s\S]*?<\/PHYSICS_LAYER>/);

        if (opticalBlock) reinforcement += "\n" + opticalBlock[0];
        if (physicsBlock) reinforcement += "\n" + physicsBlock[0];

        // Construir prompt de masterización
        const masterPrompt = `MASTER SCULPTOR ULTRA-FIDELITY PROTOCOL:
You are receiving TWO images:
1. ORIGINAL: The source photograph (reference for identity, colors, composition)
2. PREVIEW: An AI-enhanced version (reference for style and improvements applied)

YOUR TASK: Generate a FINAL 4K MASTER that:
- Preserves 100% identity/likeness from ORIGINAL
- Applies the style enhancements visible in PREVIEW
- Outputs at maximum resolution (2048x2048 or native 4K)
- Hyper-realistic skin textures, micro-details, catch-lights
- Professional retouching: "${styleName}"

${reinforcement}

CRITICAL: The output must look like a HIGH-END MAGAZINE PHOTO.
Preserve exact facial features, bone structure, and distinguishing marks from ORIGINAL.
Apply the color grading and enhancement style from PREVIEW.`;

        let resultImageB64: string | null = null;
        let attempts = 0;

        while (attempts < 3) {
            try {
                const currentApiKey = await getRotatedApiKey(supabase);
                console.log(`[Master] Attempt ${attempts + 1} with key ...${currentApiKey.slice(-4)}`);

                // Nano Banana Pro via Native REST (Google format)
                const genUrl = `https://api.laozhang.ai/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${currentApiKey}`;

                const payload = {
                    contents: [{
                        parts: [
                            { text: masterPrompt },
                            { inline_data: { mime_type: originalBlob.type || 'image/jpeg', data: base64Original } },
                            { inline_data: { mime_type: previewBlob.type || 'image/png', data: base64Preview } }
                        ]
                    }],
                    generationConfig: {
                        responseModalities: ["IMAGE"],
                        imageConfig: {
                            imageSize: "4K"
                        }
                    }
                };

                console.log(`[Master] Sending to Nano Banana Pro...`);

                const resp = await fetch(genUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!resp.ok) {
                    const errText = await resp.text();
                    console.error(`[Master] API Error: ${errText}`);
                    throw new Error(`API ${resp.status}: ${errText}`);
                }

                const data = await resp.json();
                console.log(`[Master] Response received. Extracting image...`);

                // Extract image from Native Response
                const candidates = data.candidates || [];
                if (!candidates.length) throw new Error('No candidates in response');

                for (const part of candidates[0].content.parts) {
                    const inlineData = part.inlineData || part.inline_data;
                    if (inlineData?.data) {
                        resultImageB64 = inlineData.data;
                        console.log(`[Master] Image extracted successfully`);
                        break;
                    }
                }

                if (!resultImageB64) throw new Error('No image data in response');
                break; // Success

            } catch (e: any) {
                console.error(`[Master] Attempt ${attempts + 1} failed: ${e.message}`);
                attempts++;
                if (attempts >= 3) throw new Error(`Master Failed: ${e.message}`);
                await new Promise(r => setTimeout(r, 2000)); // Wait before retry
            }
        }

        if (!resultImageB64) throw new Error('Failed to generate master image');

        const rawArray = decodeBase64(resultImageB64);

        // Upload Direct (Assuming JPEG/PNG from AI)
        const ext = settings.format === 'PNG' ? 'png' : 'jpeg';
        const mime = settings.format === 'PNG' ? 'image/png' : 'image/jpeg';

        const userIdSafe = user ? user.id : 'guest_masters';
        const resTag = settings.resolution === '8K' ? 'MASTER_8K' : 'MASTER_4K';
        const safeFileName = buildStandardFileName(originalImagePath, resTag, styleId, 'v1', ext);
        const fileName = buildStandardStoragePath(userIdSafe, 'LUX_SCALER', generationId || 'unknown', safeFileName);

        const { error: uploadError } = await supabase.storage
            .from('lux-storage')
            .upload(fileName, rawArray, { contentType: mime });

        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

        const publicUrl = supabase.storage.from('lux-storage').getPublicUrl(fileName).data.publicUrl;
        console.log(`[Master] Uploaded: ${publicUrl}`);

        // Save to DB (Only if User)
        let record = null;
        if (user) {
            const masterSeed = Math.floor(Math.random() * 9999999999);
            const cost = calculateGeminiCost(null, 'GEMINI_PRO_IMAGE');

            const { data: dbRec, error: insertError } = await supabase.from('variations').insert({
                generation_id: generationId,
                type: 'master_4k',
                style_id: styleId,
                image_path: publicUrl,
                seed: masterSeed,
                cost_cogs: cost,
                prompt_payload: {
                    engine: "Master Sculptor v19.1 - Nano Banana Pro Direct",
                    prompt: masterPrompt.substring(0, 500)
                }
            }).select().single();
            record = dbRec;
            if (insertError) { console.error(`[Master] DB Insert Error: ${insertError.message}`); }
        } else {
            // Mock Record for Guest
            record = {
                id: `guest_var_${Date.now()}`,
                image_path: publicUrl,
                style_id: styleId,
                type: 'master_4k'
            };
        }

        console.log(`[Master Sculptor v19.1] ✅ Complete! ID: ${record?.id}`);

        return new Response(JSON.stringify({
            success: true,
            variation: record,
            masterUrl: publicUrl
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    } catch (error: any) {
        console.error("[Master Sculptor Error]", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
})
