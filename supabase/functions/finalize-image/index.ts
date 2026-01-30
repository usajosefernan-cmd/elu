import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const REPLICATE_API_TOKEN = Deno.env.get("REPLICATE_API_TOKEN")!;
const UPSCALER_MODEL = Deno.env.get("UPSCALER_MODEL") || "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73ab8a5eaac8d09a77a52";
const LAOZHANG_API_KEY = Deno.env.get("LAOZHANG_API_KEY")!;

serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    try {
        const { uploadId, userId, targetResolution, userRefinePrompt, userRefineMask } = await req.json();

        // 1. Leer perfil, tier y costos
        const { data: profile } = await supabase
            .from("profiles")
            .select("tier, token_balance")
            .eq("id", userId)
            .single();

        if (!profile) throw new Error("Profile not found");

        const tierCode = (profile.tier || "AUTO").toUpperCase();

        const { data: tierRow } = await supabase
            .from("tier_config")
            .select("*")
            .eq("tier_code", tierCode)
            .single();

        const canUpscale8k = !!tierRow?.can_upscale_8k;
        const baseUnlockCost = tierRow?.unlock_tokens_each ?? 20;
        const upscale8kCost = tierRow?.upscale_8k_cost_tokens ?? 0;

        const wants8k = String(targetResolution || "4K").toUpperCase() === "8K";

        if (wants8k && !canUpscale8k) {
            throw new Error("Tier does not allow 8K Upscale");
        }

        const totalCost = baseUnlockCost + (wants8k ? upscale8kCost : 0);

        if (profile.token_balance < totalCost) {
            throw new Error("Insufficient tokens");
        }

        // 2. Recuperar imagen limpia y OCR
        const { data: genRecord } = await supabase
            .from("generations")
            .select("id, clean_url, prompt_used")
            .eq("upload_id", uploadId)
            .order("created_at", { ascending: true })
            .limit(1)
            .single();

        if (!genRecord) throw new Error("Generation not found");

        const { data: analysisRecord } = await supabase
            .from("analysis_results")
            .select("ocr_data")
            .eq("upload_id", uploadId)
            .single();

        const ocrData = analysisRecord?.ocr_data || [];

        // 3. Descargar imagen limpia desde bucket privado
        const cleanPath = genRecord.clean_url;
        const { data: cleanFile } = await supabase.storage
            .from("generations_private")
            .download(cleanPath);

        if (!cleanFile) throw new Error("Clean image not found");

        let currentImageBytes = new Uint8Array(await cleanFile.arrayBuffer());

        // 4. Cola de tareas de edición (Refine opcional + OCR Fix)
        type EditTask = {
            prompt: string;
            mask?: string | null;
            mask_box?: number[] | null;
            strength: number;
            surface_material?: string;
            text?: string;
            box_2d?: number[];
        };

        const editTasks: EditTask[] = [];

        if (userRefinePrompt) {
            editTasks.push({
                prompt: userRefinePrompt,
                mask: userRefineMask || null,
                strength: 0.65,
            });
        }

        if (Array.isArray(ocrData) && ocrData.length > 0) {
            for (const item of ocrData) {
                editTasks.push({
                    prompt: `Render the text "${item.text}" clearly on ${item.surface_material || "the surface"}. High resolution typography.`,
                    mask_box: item.box_2d || item.box || null,
                    strength: 0.95,
                    text: item.text,
                    surface_material: item.surface_material,
                    box_2d: item.box_2d || item.box,
                });
            }
        }

        for (const task of editTasks) {
            // Mock LaoZhang if no Key
            if (!LAOZHANG_API_KEY) {
                console.log("Mocking LaoZhang Edit for", task.prompt);
                // currentImageBytes remains unchanged
            } else {
                currentImageBytes = await callLaozhangEdit(currentImageBytes, task);
            }
        }

        // 5. Upscale 4K/8K con Replicate
        // Mock Replicate if no Token
        if (!REPLICATE_API_TOKEN) {
            console.log("Mocking Replicate Upscale to", wants8k ? "8K" : "4K");
            // currentImageBytes remains unchanged
        } else {
            if (wants8k) {
                currentImageBytes = await callReplicateUpscaler(currentImageBytes, "8K");
            } else {
                currentImageBytes = await callReplicateUpscaler(currentImageBytes, "4K");
            }
        }

        // 6. Guardar imagen final en bucket público y actualizar DB
        const finalFileName = `${uploadId}/final_${Date.now()}_${wants8k ? "8k" : "4k"}.jpg`;
        await supabase.storage
            .from("generations_public")
            .upload(finalFileName, currentImageBytes, { contentType: "image/jpeg" });

        const finalPublicUrl = supabase.storage
            .from("generations_public")
            .getPublicUrl(finalFileName).data.publicUrl;

        await supabase
            .from("generations")
            .update({
                final_url: finalFileName,
                is_preview: false,
                tokens_spent: totalCost,
            })
            .eq("id", genRecord.id);

        await supabase
            .from("profiles")
            .update({ token_balance: profile.token_balance - totalCost })
            .eq("id", userId);

        return new Response(
            JSON.stringify({
                success: true,
                final_url: finalPublicUrl,
                tokens_spent: totalCost,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error: any) {
        console.error("finalize-image error", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: corsHeaders,
        });
    }
});

async function callLaozhangEdit(
    imageBytes: Uint8Array,
    task: {
        prompt: string;
        mask?: string | null;
        mask_box?: number[] | null;
        strength: number;
    }
): Promise<Uint8Array> {
    const base64 = btoa(String.fromCharCode(...imageBytes));

    const payload: any = {
        prompt: task.prompt,
        strength: task.strength,
        image_base64: base64,
    };

    if (task.mask) payload.mask_base64 = task.mask;
    if (task.mask_box) payload.mask_box = task.mask_box;

    const res = await fetch(Deno.env.get("LAOZHANG_EDIT_ENDPOINT")!, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("LAOZHANG_API_KEY")}`,
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error("Laozhang edit failed: " + errorText);
    }

    const data = await res.json();
    const outBytes = Uint8Array.from(atob(data.image_base64), (c) => c.charCodeAt(0));
    return outBytes;
}

async function callReplicateUpscaler(
    imageBytes: Uint8Array,
    mode: "4K" | "8K"
): Promise<Uint8Array> {
    const b64 = btoa(String.fromCharCode(...imageBytes));

    const res = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${Deno.env.get("REPLICATE_API_TOKEN")}`,
        },
        body: JSON.stringify({
            version: Deno.env.get("UPSCALER_MODEL"),
            input: {
                image: b64,
                megapixels: mode === "8K" ? 32 : 8,
            },
        }),
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error("Replicate failed: " + errorText);
    }

    const prediction = await res.json();
    const predictionId = prediction.id;

    // Poll for result
    let outputUrl = null;
    for (let i = 0; i < 30; i++) { // Wait up to 60s
        await new Promise(r => setTimeout(r, 2000));
        const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
            headers: { Authorization: `Token ${Deno.env.get("REPLICATE_API_TOKEN")}` }
        });
        const pollData = await pollRes.json();
        if (pollData.status === "succeeded") {
            outputUrl = pollData.output;
            break;
        }
        if (pollData.status === "failed") throw new Error("Replicate prediction failed");
    }

    if (!outputUrl) throw new Error("Replicate timeout");

    // Download result
    const imgRes = await fetch(outputUrl);
    return new Uint8Array(await imgRes.arrayBuffer());
}
