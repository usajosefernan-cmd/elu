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

type SliderLevel = "OFF" | "LOW" | "MED" | "HIGH" | "FORCE";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { visionResult, sliderConfig, savedPreset, userMode } = await req.json();

    // 1. Leer definiciones de sliders desde DB (data-driven)
    const { data: slidersDef } = await supabase
      .from("slider_definitions")
      .select("slider_key, pillar, ui_title, ui_description, instruction_off, instruction_low, instruction_med, instruction_high, instruction_force");

    const sliderMap: Record<string, any> = {};
    (slidersDef || []).forEach((s: any) => {
      sliderMap[s.slider_key] = s;
    });

    // 2. Traducir cada slider numérico 0-10 en nivel y texto semántico
    const instructions: string[] = [];

    const resolveLevel = (value: number | string): SliderLevel => {
      if (typeof value === "string") {
        const upper = value.toUpperCase();
        if (["OFF", "LOW", "MED", "HIGH", "FORCE"].includes(upper)) {
          return upper as SliderLevel;
        }
      }
      const v = Number(value);
      if (v <= 0) return "OFF";
      if (v <= 3) return "LOW";
      if (v <= 6) return "MED";
      if (v <= 9) return "HIGH";
      return "FORCE";
    };

    Object.entries(sliderConfig || {}).forEach(([key, value]) => {
      const def = sliderMap[key];
      if (!def) return;

      const level = resolveLevel(value as any);

      let text: string | null = null;
      if (level === "OFF") text = def.instruction_off;
      else if (level === "LOW") text = def.instruction_low;
      else if (level === "MED") text = def.instruction_med;
      else if (level === "HIGH") text = def.instruction_high;
      else if (level === "FORCE") text = def.instruction_force;

      if (text && text.trim().length > 0) {
        instructions.push(`- [${key.toUpperCase()} - ${level}] ${text.trim()}`);
      }
    });

    // 3. Ensamblar prompt maestro (Additive Prompt Assembly)
    const baseSubject = visionResult?.visual_summary ||
      "High-end cinematic reconstruction of the uploaded scene.";

    const diagnosticsSummary = visionResult?.reasoning || "";

    const slidersBlock = instructions.join("\n");

    const compiledPrompt = `
You are an advanced image generation engine (Nano Banana Pro) working for LuxScaler.
Your mission is to transform imperfect input photos into high-end cinematic productions.

SUBJECT SUMMARY:
${baseSubject}

TECHNICAL DIAGNOSTICS:
${diagnosticsSummary}

RECONSTRUCTION DIRECTIVES (SLIDERS):
${slidersBlock}

Follow the slider directives precisely while preserving the core identity, composition and subject.
`;

    // 4. Config de generación (derivada de savedPreset o defaults)
    const temperature = savedPreset?.temperature ?? 0.4;
    const seed = savedPreset?.seed ?? Math.floor(Math.random() * 1_000_000);

    const generation_config = {
      seed,
      strength: temperature >= 0.8 ? 0.85 : temperature <= 0.2 ? 0.45 : 0.65,
      guidance_scale: temperature >= 0.8 ? 4.0 : 7.0,
      sampler: "Euler a",
    };

    return new Response(
      JSON.stringify({ compiled_prompt: compiledPrompt, generation_config }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("prompt-compiler error", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
