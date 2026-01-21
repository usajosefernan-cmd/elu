// LuxScaler v28 - Vision Analysis Edge Function (Deno Compatible)
// Analyzes uploaded images with Gemini 2.5 Flash Vision

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
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
  tokens_consumed: number;
  error?: string;
}

serve(async (req: Request) => {
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

    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
    if (!GOOGLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "API key not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Prepare image for Gemini API
    let imageData: string;
    let mimeType = "image/jpeg";

    if (imageBase64) {
      imageData = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
    } else {
      const imageResponse = await fetch(imageUrl);
      const imageBlob = await imageResponse.blob();
      const arrayBuffer = await imageBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      imageData = btoa(String.fromCharCode(...uint8Array));
      mimeType = imageResponse.headers.get("content-type") || "image/jpeg";
    }

    // Vision Analysis Prompt
    const analysisPrompt = `[LUXSCALER v28 VISION ANALYSIS]
Analyze this photo with professional studio precision.

Return ONLY valid JSON:
{
  "technical_score": <0-10>,
  "semantic_anchors": ["element to preserve", ...],
  "detected_issues": ["issue to fix", ...],
  "suggested_settings": {
    "limpieza_artefactos": <0-10>,
    "enfoque": <0-10>,
    "contraste": <0-10>,
    "saturacion": <0-10>,
    "exposicion": <0-10>
  },
  "recommended_profile": "auto"|"user"|"pro"|"prolux"
}`;

    // Call Gemini API directly via REST
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: analysisPrompt },
              { inline_data: { mime_type: mimeType, data: imageData } }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse JSON from response
    let analysisData;
    try {
      let cleanText = responseText;
      if (cleanText.includes("```json")) {
        cleanText = cleanText.split("```json")[1].split("```")[0];
      } else if (cleanText.includes("```")) {
        cleanText = cleanText.split("```")[1].split("```")[0];
      }
      analysisData = JSON.parse(cleanText.trim());
    } catch {
      analysisData = {
        technical_score: 5,
        semantic_anchors: ["detected subject"],
        detected_issues: ["analysis_incomplete"],
        suggested_settings: {},
        recommended_profile: "auto",
      };
    }

    const tokensConsumed = geminiData.usageMetadata?.totalTokenCount || 500;

    const response: VisionAnalysisResult = {
      success: true,
      analysis: analysisData,
      tokens_consumed: tokensConsumed,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Vision Analysis Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Vision analysis failed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
