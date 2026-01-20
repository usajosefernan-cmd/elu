import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const LAOZHANG_API_KEY = Deno.env.get("LAOZHANG_API_KEY");
        if (!LAOZHANG_API_KEY) {
            throw new Error("LAOZHANG_API_KEY not configured in secrets");
        }

        // Try multiple keys for Gemini (Orchestrator)
        const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_API_KEY");
        if (!GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY (Google AI Studio) not configured in secrets");
        }

        let { imageData, tileUrl, contextData, neighborTop, neighborLeft, imageMime, contextMime, tileInfo, storageFolder } = await req.json();

        // Support for Storage URL (User Request: "sube a storage a un temp")
        if (tileUrl && !imageData) {
            console.log(`[LuxScaler] Fetching tile from URL: ${tileUrl}`);
            const imgResp = await fetch(tileUrl);
            if (!imgResp.ok) throw new Error(`Failed to fetch tileUrl: ${imgResp.statusText}`);
            const arrBuf = await imgResp.arrayBuffer();
            // Convert to base64
            const uint8Array = new Uint8Array(arrBuf);
            let binaryString = "";
            const chunkSize = 8192;
            for (let i = 0; i < uint8Array.length; i += chunkSize) {
                const chunk = uint8Array.subarray(i, i + chunkSize);
                binaryString += String.fromCharCode.apply(null, Array.from(chunk));
            }
            imageData = btoa(binaryString);
        }

        if (!imageData || !tileInfo) {
            throw new Error("imageData (or tileUrl) and tileInfo are required");
        }

        const { row, col, gridCols, gridRows, edgeInfo } = tileInfo;

        // 1. ORCHESTRATION: Call Gemini Flash to generate the forensic prompt
        // We use gemini-1.5-flash for speed and cost effectiveness
        console.log(`[LuxScaler] Orchestrating Tile (${row},${col}) of Grid ${gridCols}x${gridRows}...`);

        let orchPrompt = `SYSTEM: You are the Orchestrator of a Super-Resolution Tiling Engine.
CONTEXT: We are upscaling a large image by splitting it into tiles. This is tile (${row}, ${col}).
OBJECTIVE: Generate a detailed prompt for an Image Generator to upscale THIS SPECIFIC TILE CROP to 4K resolution.

CRITICAL INSTRUCTION:
1. The output image MUST BE STITCHABLE back into the main image.
2. It must have PERFECT coherence with the Global Context (Style, Grain, Lighting).
3. It must match the Neighbor Tiles seamlessly (invisible seams).
4. DO NOT treat this as a standalone image. It is a PART of a whole.
5. If the crop cuts a face/object in half, generate ONLY that half perfectly aligned. Do NOT complete the face inside the tile.

OUTPUT FORMAT:
Start with "[STITCHABLE TILE UPSCALING]" and describe the texture, lighting, and exact content seen in the target crop, emphasizing how it connects to the context.`;

        // ORCHESTRATION WITH FALLBACK
        let generatedPrompt = "";
        try {
            const parts = [{ text: orchPrompt }];
            // Use specific contextMime if provided, else fallback to imageMime or png
            if (contextData) parts.push({ inline_data: { mime_type: contextMime || imageMime || "image/png", data: contextData } });
            // Neighbors are generated tiles, so they should match imageMime (target tile format)
            if (neighborTop) parts.push({ inline_data: { mime_type: imageMime || "image/png", data: neighborTop } });
            if (neighborLeft) parts.push({ inline_data: { mime_type: imageMime || "image/png", data: neighborLeft } });

            parts.push({ inline_data: { mime_type: imageMime || "image/png", data: imageData } }); // TARGET is always last for focus

            const orchestratorResponse = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts }]
                    })
                }
            );

            if (!orchestratorResponse.ok) {
                const err = await orchestratorResponse.text();
                console.warn("Orchestrator API Warning (Soft Fail):", err);
            } else {
                const orchResult = await orchestratorResponse.json();
                generatedPrompt = orchResult.candidates?.[0]?.content?.parts?.[0]?.text || "";
            }
        } catch (e) {
            console.warn("Orchestrator Network Error (Soft Fail):", e);
        }

        if (!generatedPrompt) {
            console.log("⚠️ Orchestrator failed. Using FALLBACK prompt.");
            generatedPrompt = `[TILE RECONSTRUCTION - DIRECT UPSCALING]
Estás recibiendo un RECORTE EXACTO (Tile ${row},${col}).

TU TAREA:
1. Upscale a 4096x4096 de ESTE fragmento.
2. Mantener fidelidad absoluta a la referencia visual.
3. Asegurar continuidad de bordes (${edgeInfo}).
4. NO inventar contenido fuera del marco.`;
        }

        console.log(`[LuxScaler] Generated Prompt (${generatedPrompt.length} chars)`);

        // 2. GENERATION: Call LaoZhang (Nanobananapro) with the generated prompt
        // CORRECTED STRATEGY: Interleave Text Labels with Images to avoid confusion

        const generationParts: any[] = [];

        // 1. Instructions / Prompt Header
        generationParts.push({ text: "SYSTEM INSTRUCTION: You are a forensic image restorer. Use the REFERENCE and NEIGHBOR images solely for style, lighting and alignment context. Your TASK is to upscale the TARGET CROP specifically.\n\n" + generatedPrompt });

        // 2. Context Image (Global Reference)
        if (contextData) {
            generationParts.push({ text: "\n=== GLOBAL REFERENCE IMAGE (STYLE CONTEXT) ===\n" });
            generationParts.push({
                inline_data: {
                    mime_type: imageMime || "image/png",
                    data: contextData,
                },
            });
        }

        // 3. Neighbor Context (For Stitching Alignment)
        if (neighborTop) {
            generationParts.push({ text: "\n=== NEIGHBOR ABOVE (USE FOR TOP EDGE ALIGNMENT) ===\n" });
            generationParts.push({
                inline_data: {
                    mime_type: "image/png",
                    data: neighborTop,
                },
            });
        }
        if (neighborLeft) {
            generationParts.push({ text: "\n=== NEIGHBOR LEFT (USE FOR LEFT EDGE ALIGNMENT) ===\n" });
            generationParts.push({
                inline_data: {
                    mime_type: "image/png",
                    data: neighborLeft,
                },
            });
        }

        // 4. Target Image (The Crop to Upscale)
        generationParts.push({ text: "\n=== TARGET CROP (INPUT TO UPSCALE) - GENERATE HIGH RES VERSION OF THIS ===\n" });
        generationParts.push({
            inline_data: {
                mime_type: imageMime || "image/png",
                data: imageData,
            },
        });

        console.log(`[LuxScaler] Sending structured payload: Context=${!!contextData}, Neighbors=(Top:${!!neighborTop}, Left:${!!neighborLeft}), Target=Yes`);

        const response = await fetch(
            "https://api.laozhang.ai/v1beta/models/gemini-3-pro-image-preview:generateContent",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${LAOZHANG_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: generationParts,
                        },
                    ],
                    generationConfig: {
                        responseModalities: ["IMAGE"],
                        imageConfig: { aspectRatio: "1:1", imageSize: "4K" },
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`LaoZhang API Error: ${response.status} - ${errorText}`);
            throw new Error(`LaoZhang API Error: ${response.status}`);
        }

        const result = await response.json();
        const tileData = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        if (!tileData) {
            throw new Error("No image data in LaoZhang response");
        }

        console.log(`[LuxScaler] Successfully generated tile (${row},${col})`);

        // 3. PERSISTENCE: Save to Supabase Storage (User Request: "registro par controlar")
        let storageUrl = null;
        try {
            const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
            const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

            if (supabaseUrl && supabaseKey) {
                const supabase = createClient(supabaseUrl, supabaseKey);

                // Decode base64 
                const binaryString = atob(tileData);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }

                // Path: {storageFolder}/RESULTADO_{row}_{col}.png
                const targetFolder = storageFolder || 'upscaler/legacy';
                const fileName = `${targetFolder}/RESULTADO_${row}_${col}.png`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('lux-storage')
                    .upload(fileName, bytes, { contentType: 'image/png', upsert: true });

                if (!uploadError && uploadData) {
                    const { data: { publicUrl } } = supabase.storage.from('lux-storage').getPublicUrl(fileName);
                    storageUrl = publicUrl;
                    console.log(`[LuxScaler] Image saved to storage: ${fileName}`);
                } else {
                    console.error("Storage Upload Error:", uploadError);
                }
            }
        } catch (e) {
            console.error("Storage Error:", e);
        }

        return new Response(
            JSON.stringify({ success: true, tileData, generatedPrompt, storageUrl }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error: any) {
        console.error(`[LuxScaler] Error: ${error.message}`);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
