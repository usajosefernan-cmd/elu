// LuxScaler v28 - Prompt Compiler Edge Function
// Compiles slider values into Gemini-ready prompts using Supabase semantic mappings

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SliderConfig {
  photoscaler?: { sliders: Array<{ name: string; value: number }> };
  stylescaler?: { sliders: Array<{ name: string; value: number }> };
  lightscaler?: { sliders: Array<{ name: string; value: number }> };
}

interface VetoRule {
  name: string;
  trigger: (sliders: Record<string, number>) => boolean;
  actions: Array<{ slider: string; force: number; reason: string }>;
}

// Veto Rules (Logic Layer)
const VETO_RULES: VetoRule[] = [
  {
    name: "Paradoja Forense",
    trigger: (s) => s.limpieza_artefactos === 10,
    actions: [
      { slider: "grano_filmico", force: 0, reason: "Limpieza FORCE elimina grano" },
      { slider: "optica_nitidez", force: 10, reason: "Limpieza FORCE fuerza máxima nitidez" },
    ],
  },
  {
    name: "Tiranía del Drama",
    trigger: (s) => s.dramatismo_contraste === 10,
    actions: [
      { slider: "luz_relleno", force: 0, reason: "Drama FORCE no permite fill light" },
    ],
  },
  {
    name: "Paradoja Geométrica",
    trigger: (s) => s.geometria_distorsion === 10 && s.reencuadre_ia === 10,
    actions: [
      { slider: "reencuadre_ia", force: 0, reason: "Prioridad: corrección de distorsión" },
    ],
  },
];

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { config, visionAnalysis, userMode = "auto" } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch semantic mappings from Supabase
    const { data: mappings, error: mappingsError } = await supabase
      .from("slider_semantic_mappings")
      .select("*");

    if (mappingsError) {
      throw new Error(`Failed to load mappings: ${mappingsError.message}`);
    }

    // Create lookup map
    const mappingLookup: Record<string, any> = {};
    for (const m of mappings || []) {
      mappingLookup[m.slider_name] = m;
    }

    // 2. Flatten slider values from config
    const sliderValues: Record<string, number> = {};
    const pillars = ["photoscaler", "stylescaler", "lightscaler"];
    
    for (const pillar of pillars) {
      const pillarData = config?.[pillar];
      if (pillarData?.sliders) {
        for (const slider of pillarData.sliders) {
          sliderValues[slider.name] = slider.value || 0;
        }
      }
    }

    // 3. Apply Veto Rules
    const vetosApplied: string[] = [];
    for (const rule of VETO_RULES) {
      if (rule.trigger(sliderValues)) {
        for (const action of rule.actions) {
          sliderValues[action.slider] = action.force;
          vetosApplied.push(`${rule.name}: ${action.reason}`);
        }
      }
    }

    // 4. Translate sliders to instructions
    const getIntensityLevel = (value: number): string => {
      if (value === 0) return "off";
      if (value <= 3) return "low";
      if (value <= 6) return "med";
      if (value <= 9) return "high";
      return "force";
    };

    const getInstruction = (sliderName: string, value: number): string => {
      const mapping = mappingLookup[sliderName];
      if (!mapping) return "";
      
      const level = getIntensityLevel(value);
      const instructionKey = `instruction_${level}`;
      return mapping[instructionKey] || "";
    };

    // 5. Build pillar blocks
    const photoscalerInstructions: string[] = [];
    const stylescalerInstructions: string[] = [];
    const lightscalerInstructions: string[] = [];

    for (const [sliderName, value] of Object.entries(sliderValues)) {
      if (value === 0) continue;
      
      const instruction = getInstruction(sliderName, value);
      if (!instruction) continue;

      const mapping = mappingLookup[sliderName];
      const pillar = mapping?.pillar_name || "";

      if (pillar === "photoscaler") {
        photoscalerInstructions.push(`- ${instruction}`);
      } else if (pillar === "stylescaler") {
        stylescalerInstructions.push(`- ${instruction}`);
      } else if (pillar === "lightscaler") {
        lightscalerInstructions.push(`- ${instruction}`);
      }
    }

    // 6. Identity Lock logic
    const geometryActive = (sliderValues.geometria_distorsion || 0) > 0 || 
                          (sliderValues.reencuadre_ia || 0) > 0 ||
                          (sliderValues.geometria_perspectiva || 0) > 0;

    const identityBlock = geometryActive
      ? "ALLOW structural changes for geometry correction."
      : "CRITICAL: IDENTITY LOCK ACTIVE. DO NOT MOVE PIXELS. Structure must match overlay 100%. Only change texture/lighting.";

    // 7. Vision summary
    let visionText = "No prior vision analysis.";
    if (visionAnalysis) {
      const anchors = visionAnalysis.semantic_anchors?.join(", ") || "";
      const issues = visionAnalysis.detected_issues?.join(", ") || "";
      visionText = `
NARRATIVE ANCHORS (PRESERVE): ${anchors}
DETECTED ISSUES (FIX): ${issues}
TECHNICAL SCORE: ${visionAnalysis.technical_score || "N/A"}/10`;
    }

    // 8. Assemble final prompt
    const compiledPrompt = `
[SYSTEM OVERRIDE: UNIVERSAL FORENSIC RE-SHOOT & OPTICAL SYNTHESIS PROTOCOL v28.0]
[ROLE: REALITY RECONSTRUCTION ENGINE]
[USER MODE: ${userMode.toUpperCase()}]

=== INPUT ANALYSIS ===
${visionText}

=== PHASE 0: STRUCTURAL INTEGRITY (IDENTITY LOCK) ===
${identityBlock}

=== PHASE 1: CORE DIAGNOSIS & RE-SYNTHESIS STRATEGY ===
IF INPUT IS BLURRY/NOISY/DAMAGED -> ACTIVATE "COMPLETE RE-SYNTHESIS".
IGNORE source artifacts. HALLUCINATE high-frequency details from context.
VIRTUAL RE-SHOOT: Simulate 1/8000s shutter (zero motion blur, zero grain).

=== PHASE 2: OPTICS, GEOMETRY & RESTORATION (PHOTOSCALER) ===
${photoscalerInstructions.length > 0 ? photoscalerInstructions.join("\n") : "[AUTO MODE - AI decides]"}

=== PHASE 3: STYLE, CHARACTER & AESTHETIC (STYLESCALER) ===
${stylescalerInstructions.length > 0 ? stylescalerInstructions.join("\n") : "[AUTO MODE - AI decides]"}

=== PHASE 4: LIGHTING, TONE & ATMOSPHERE (LIGHTSCALER) ===
${lightscalerInstructions.length > 0 ? lightscalerInstructions.join("\n") : "[AUTO MODE - AI decides]"}

=== NEGATIVE PROMPT ===
damaged, blurry, noisy, distorted faces, bad anatomy, text, watermarks, jpeg artifacts, shifting eyes, changing facial features, morphing bone structure, different pose, losing semantic anchors.
`.trim();

    return new Response(
      JSON.stringify({
        success: true,
        prompt: compiledPrompt,
        metadata: {
          vetos_applied: vetosApplied,
          active_sliders: Object.entries(sliderValues).filter(([_, v]) => v > 0).length,
          identity_lock: !geometryActive,
          user_mode: userMode,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Prompt Compiler Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
