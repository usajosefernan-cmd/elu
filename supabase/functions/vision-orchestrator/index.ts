import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Utilidad: esperar ms
const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    try {
        // Parse body carefully
        let body;
        try {
            body = await req.json();
        } catch (e) {
            throw new Error("Invalid JSON body");
        }

        const { uploadId, userId, biopsyUrls } = body;

        // 1. Leer perfil del usuario y tier_config
        const { data: profile } = await supabase
            .from("profiles")
            .select("tier, token_balance")
            .eq("id", userId)
            .single();

        const tierCode = (profile?.tier || "AUTO").toUpperCase();

        const { data: tierRow } = await supabase
            .from("tier_config")
            .select("*")
            .eq("tier_code", tierCode)
            .single();

        // Fallback seguro
        const canRefine = !!tierRow?.can_refine;
        const canUpscale8k = !!tierRow?.can_upscale_8k;
        const batchSizeLimit = tierRow?.batch_size_limit ?? 1;

        // 2. Cargar definiciones de Taxonomía & Diagnóstico desde DB
        const [taxResult, diagResult] = await Promise.all([
            supabase.from("taxonomy_definitions").select("*"),
            supabase.from("diagnosis_definitions").select("*"),
        ]);

        const taxonomyList = taxResult.data || [];
        const diagnosisList = diagResult.data || [];

        // 3. Construir contexto dinámico para Gemini (igual que vision-analysis, pero data-driven)
        const taxonomyContext = taxonomyList
            .map((t: any) => `- CODE: ${t.code} (${t.category_name}) >> VISUAL CUES: ${t.visual_description}`)
            .join("\n");

        const diagnosisContext = diagnosisList
            .map((d: any) => `- CODE: ${d.code} (${d.diagnosis_name}) >> DEFECT TRAITS: ${d.visual_description}`)
            .join("\n");

        const systemPrompt = `
### SYSTEM IDENTITY & MISSION
You are the **Lead Visual Forensics Director** for "LuxScaler", a high-end AI engine capable of turning low-quality inputs into **Cinematic Blockbuster Productions**.

**YOUR GOAL:** You are the first step in a pipeline. You do NOT generate images. You **audit** the raw input pixels to tell the "Reconstruction Engine" exactly what needs to be fixed.

**REFERENCE DATA (YOUR BIBLE):**

1. TAXONOMY (What is the subject?):
${taxonomyContext}

2. DIAGNOSIS (What is broken?):
${diagnosisContext}

Return strictly this JSON (no markdown):
{
  "cat_code": "CATxx",
  "detected_defects": ["INxx"],
  "has_text_or_logo": boolean,
  "severity_score": 1-10,
  "visual_summary": "One sentence description of the subject and lighting.",
  "reasoning": "Explain why you chose this CAT and these defects."
}`;

        // 4. Llamar a Gemini Vision con la biopsia (usamos thumbnail por defecto)
        const imageBase64 = biopsyUrls?.thumbnail_base64 || "";

        const geminiResp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: systemPrompt },
                                { inline_data: { mime_type: "image/jpeg", data: imageBase64 } },
                            ],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.0,
                        responseMimeType: "application/json",
                    },
                }),
            }
        );

        const geminiData = await geminiResp.json();

        let analysis: any;
        try {
            const rawText = geminiData.candidates[0].content.parts[0].text;
            analysis = JSON.parse(rawText.replace(/```json|```/g, "").trim());
        } catch (e: any) {
            throw new Error("AI Vision Failed: " + (e.message || JSON.stringify(geminiData)));
        }

        // 5. Motor de mezcla data-driven: aplicar taxonomía + diagnosis sobre sliders
        let finalSliders: Record<string, any> = {};

        const catRule = taxonomyList.find((t: any) => t.code === analysis.cat_code);
        if (catRule?.slider_config) {
            finalSliders = { ...finalSliders, ...catRule.slider_config };
        }

        if (analysis.detected_defects?.length) {
            analysis.detected_defects.forEach((defectCode: string) => {
                const diagRule = diagnosisList.find((d: any) => d.code === defectCode);
                if (diagRule?.slider_config) {
                    finalSliders = { ...finalSliders, ...diagRule.slider_config };
                }
            });
        }

        if (analysis.severity_score > 7) {
            finalSliders["force_reimagine"] = true;
            finalSliders["p6"] = "FORCE";
        }

        if (analysis.has_text_or_logo) {
            finalSliders["ocr_lock"] = true;
            finalSliders["l6"] = "FORCE";
        }

        // 6. Guardar análisis en DB
        await supabase.from("analysis_results").upsert({
            upload_id: uploadId,
            cat_code: analysis.cat_code,
            detected_defects: analysis.detected_defects,
            ocr_data: analysis.ocr_data || null,
            visual_summary: analysis.visual_summary,
            severity_score: analysis.severity_score,
            auto_settings: finalSliders,
        });

        // 7. Orquestación según Tier (Batch vs Pausa)
        if (tierCode === "AUTO") {
            // AUTO: autopilot, lanzamos batch de previews usando user_upload_workflows
            const { data: workflow } = await supabase
                .from("user_upload_workflows")
                .select("batch_config, is_async_enabled, max_previews")
                .eq("user_id", userId)
                .single();

            const batchConfig: any[] = workflow?.batch_config || [
                { type: "AUTO", variant: "FORENSIC" },
            ];

            const maxAllowed = workflow?.max_previews ?? 3;
            const effectiveBatch = batchConfig.slice(0, Math.min(batchConfig.length, maxAllowed, batchSizeLimit));

            const jobs: Promise<Response>[] = [];

            for (let index = 0; index < effectiveBatch.length; index++) {
                const item = effectiveBatch[index];

                let specificSettings = { ...finalSliders };
                let tempOverride = 0.4;
                let seedOverride = Math.floor(Math.random() * 1_000_000);

                if (item.type === "PRESET") {
                    const { data: preset } = await supabase
                        .from("user_presets")
                        .select("*")
                        .eq("id", item.preset_id)
                        .single();

                    if (preset) {
                        specificSettings = preset.sliders_config || specificSettings;
                        tempOverride = preset.nano_params?.strength ?? tempOverride;
                        item.presetData = preset;
                    }
                } else if (item.type === "AUTO") {
                    if (item.variant === "FORENSIC") tempOverride = 0.1;
                    else if (item.variant === "CREATIVE") tempOverride = 0.8;
                    else tempOverride = 0.4 + index * 0.1;
                }

                const compilerRes = await fetch(
                    `${SUPABASE_URL}/functions/v1/prompt-compiler`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
                        },
                        body: JSON.stringify({
                            visionResult: analysis,
                            sliderConfig: specificSettings,
                            savedPreset: { seed: seedOverride, temperature: tempOverride },
                            userMode: "auto",
                        }),
                    }
                );

                const { compiled_prompt, generation_config } = await compilerRes.json();

                const genDispatch = fetch(
                    `${SUPABASE_URL}/functions/v1/generate-image`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
                        },
                        body: JSON.stringify({
                            prompt: compiled_prompt,
                            config: generation_config,
                            uploadId,
                            imageBase64: biopsyUrls?.center_base64 || imageBase64,
                            variationIndex: index,
                            preset: item.presetData || null,
                        }),
                    }
                );

                jobs.push(genDispatch);

                if (index < effectiveBatch.length - 1) await wait(1500);
            }

            // await Promise.all(jobs); // Don't wait, fire and forget for async batch

            return new Response(
                JSON.stringify({
                    status: "BATCH_PROCESSING",
                    count: effectiveBatch.length,
                    analysis,
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        } else {
            // USER / PRO / PRO_LUX -> Pausa para revisión manual
            return new Response(
                JSON.stringify({
                    status: "REVIEW_REQUIRED",
                    analysis,
                    final_prescription: finalSliders,
                    can_refine: canRefine,
                    can_upscale_8k: canUpscale8k,
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }
    } catch (error: any) {
        console.error("vision-orchestrator error", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: corsHeaders,
        });
    }
});
