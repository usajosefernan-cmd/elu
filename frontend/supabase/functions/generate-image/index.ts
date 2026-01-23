// LuxScaler v40.0 - Generate Image with Seed + Temperature support
// Supabase Edge Function

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { 
      imageUrl, 
      compiledPrompt, 
      prompt_text,  // New: from prompt-compiler
      config,       // New: generation config from prompt-compiler
      userMode = "auto" 
    } = body;

    // Use prompt_text if provided (new flow), otherwise compiledPrompt (legacy)
    const finalPrompt = prompt_text || compiledPrompt;

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ success: false, error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!finalPrompt) {
      return new Response(
        JSON.stringify({ success: false, error: "No prompt provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "GEMINI_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================================
    // GENERATION CONFIG (from prompt-compiler or defaults)
    // ============================================================
    const generationConfig = {
      temperature: config?.temperature ?? 0.1,
      topP: config?.topP ?? 0.95,
      topK: config?.topK ?? 40,
      maxOutputTokens: config?.maxOutputTokens ?? 8192,
      // Seed for reproducibility
      ...(config?.seed && { seed: config.seed })
    };

    const usedSeed = config?.seed ?? Math.floor(Math.random() * 1000000000);

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    // Use the image generation model - CRITICAL: Only this model outputs images
    const modelName = "gemini-2.0-flash-exp-image-generation";

    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: generationConfig,
    });

    // Fetch image and convert to base64
    let imageBase64: string;
    let mimeType: string = "image/jpeg";

    if (imageUrl.startsWith("data:")) {
      const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        imageBase64 = matches[2];
      } else {
        throw new Error("Invalid data URL format");
      }
    } else {
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`);
      }
      const imageBuffer = await imageResponse.arrayBuffer();
      imageBase64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
      
      const contentType = imageResponse.headers.get("content-type");
      if (contentType) {
        mimeType = contentType.split(";")[0].trim();
      }
    }

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType,
      },
    };

    const textPart = {
      text: finalPrompt + "\n\nGenerate an enhanced version of this image following all the instructions above. Output ONLY the enhanced image.",
    };

    // Generate content
    console.log(`[generate-image] Calling Gemini ${modelName} with temp=${generationConfig.temperature}, seed=${usedSeed}...`);
    const result = await model.generateContent([textPart, imagePart]);
    const response = await result.response;
    
    // Extract generated image
    let outputImage: string | null = null;
    let outputText = "";

    if (response.candidates && response.candidates[0]) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.text) {
            outputText += part.text;
          }
          if (part.inlineData) {
            outputImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        output: {
          text: outputText,
          image: outputImage,
          hasWatermark: false,
        },
        // IMPORTANT: Return used seed and temperature for preset saving
        meta: {
          used_seed: usedSeed,
          used_temp: generationConfig.temperature,
          used_topK: generationConfig.topK,
          used_topP: generationConfig.topP,
        },
        metadata: {
          model_used: modelName,
          tokens_consumed: 0,
          tokens_charged: 0,
          output_type: "preview_clean",
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[generate-image] Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Generation failed",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
