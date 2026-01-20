// LuxScaler v28 - Vision Analysis Edge Function
// Analyzes uploaded images with Gemini 2.5 Flash Vision
// Returns semantic anchors and suggested slider settings

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VisionAnalysisResult {
  success: boolean;
  analysis?: {
    technical_score: number;
    semantic_anchors: string[];
    suggested_settings: Record<string, number>;
    detected_issues: string[];
    recommended_profile: "auto" | "user" | "pro" | "prolux";
  };
  thumbnail_used: boolean;
  tokens_consumed: number;
  error?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { imageUrl, imageBase64, userId } = await req.json();

    if (!imageUrl && !imageBase64) {
      return new Response(
        JSON.stringify({ success: false, error: "No image provided" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Initialize Gemini with API key from secrets
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
    if (!GOOGLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "API key not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" });

    // Prepare image data
    let imagePart;
    if (imageBase64) {
      // Direct base64
      const base64Data = imageBase64.includes(",") 
        ? imageBase64.split(",")[1] 
        : imageBase64;
      imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg",
        },
      };
    } else {
      // Fetch from URL and convert to base64
      const imageResponse = await fetch(imageUrl);
      const imageBlob = await imageResponse.blob();
      const arrayBuffer = await imageBlob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      imagePart = {
        inlineData: {
          data: base64,
          mimeType: imageResponse.headers.get("content-type") || "image/jpeg",
        },
      };
    }

    // Vision Analysis Prompt (v28 Protocol)
    const analysisPrompt = `[LUXSCALER v28 VISION ANALYSIS PROTOCOL]

Analiza esta imagen fotográfica con precisión de estudio profesional.

DEVUELVE UN JSON EXACTO con este formato:

{
  "technical_score": <0-10, calidad técnica general>,
  "semantic_anchors": [<lista de 3-5 elementos importantes a PRESERVAR, ej: "wooden table texture", "scar on left cheek", "wedding ring">],
  "detected_issues": [<lista de problemas detectados, ej: "motion blur on hands", "underexposed shadows", "lens distortion">],
  "suggested_settings": {
    "limpieza_artefactos": <0-10>,
    "grano_filmico": <0-10>,
    "optica_nitidez": <0-10>,
    "geometria_distorsion": <0-10>,
    "reencuadre_ia": <0-10>,
    "desenfoque_movimiento": <0-10>,
    "detalle_texturas": <0-10>,
    "restauracion_danos": <0-10>,
    "geometria_perspectiva": <0-10>,
    "vibracion_saturacion": <0-10>,
    "paleta_tonos": <0-10>,
    "dramatismo_contraste": <0-10>,
    "estilo_render": <0-10>,
    "antiguedad_aged_look": <0-10>,
    "retoque_piel": <0-10>,
    "dramatismo_vigneta": <0-10>,
    "suavidad_bokeh": <0-10>,
    "caracter_procesa": <0-10>,
    "brillo_exposicion": <0-10>,
    "luz_relleno": <0-10>,
    "profundidad_sombras": <0-10>,
    "iluminacion_dramatica": <0-10>,
    "tonalidad_color": <0-10>,
    "enfasis_ojos": <0-10>,
    "profundidad_dof": <0-10>,
    "luces_especulares": <0-10>,
    "balance_luminoso": <0-10>
  },
  "recommended_profile": <"auto" si calidad > 7, "user" si 5-7, "pro" si 3-5, "prolux" si < 3>
}

IMPORTANTE:
- Solo sugiere valores > 0 para sliders que REALMENTE necesiten intervención
- Si la imagen está perfecta, la mayoría de valores serán 0
- semantic_anchors son elementos que NO deben modificarse (Identity Lock)
- detected_issues son problemas que SÍ deben corregirse

Devuelve SOLO el JSON válido, sin markdown ni explicaciones.`;

    // Call Gemini 2.5 Flash Vision
    const result = await model.generateContent([analysisPrompt, imagePart]);
    const responseText = result.response.text();

    // Parse JSON response
    let analysisData;
    try {
      // Clean response if wrapped in markdown
      let cleanText = responseText;
      if (cleanText.includes("```json")) {
        cleanText = cleanText.split("```json")[1].split("```")[0];
      } else if (cleanText.includes("```")) {
        cleanText = cleanText.split("```")[1].split("```")[0];
      }
      analysisData = JSON.parse(cleanText.trim());
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      // Fallback response
      analysisData = {
        technical_score: 5,
        semantic_anchors: ["detected subject"],
        detected_issues: ["analysis_incomplete"],
        suggested_settings: {},
        recommended_profile: "auto",
      };
    }

    // Get token usage if available
    const tokensConsumed = result.response.usageMetadata?.totalTokenCount || 500;

    // Log to Supabase (optional - for analytics)
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (supabaseUrl && supabaseKey && userId) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from("analytics_events").insert({
        user_id: userId,
        event_type: "vision_analysis",
        event_data: {
          technical_score: analysisData.technical_score,
          issues_count: analysisData.detected_issues?.length || 0,
          tokens_consumed: tokensConsumed,
        },
      }).catch(console.error);
    }

    const response: VisionAnalysisResult = {
      success: true,
      analysis: analysisData,
      thumbnail_used: false, // Full image analyzed (can implement proxy later)
      tokens_consumed: tokensConsumed,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Vision Analysis Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Vision analysis failed" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
