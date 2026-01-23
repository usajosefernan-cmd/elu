// LuxScaler v40.0 - Generate Image Edge Function
// Uses Gemini API to generate enhanced images

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Get API key from environment
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_API_KEY");

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { imageUrl, compiledPrompt, userMode = "auto" } = body;

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ success: false, error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!compiledPrompt) {
      return new Response(
        JSON.stringify({ success: false, error: "No compiled prompt provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "GEMINI_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    // Select model based on user mode
    const modelName = userMode === "prolux" || userMode === "pro" 
      ? "gemini-2.0-flash-exp" 
      : "gemini-2.0-flash-exp";

    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 1,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      },
    });

    // Fetch image and convert to base64
    let imageBase64: string;
    let mimeType: string = "image/jpeg";

    if (imageUrl.startsWith("data:")) {
      // Already base64
      const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        imageBase64 = matches[2];
      } else {
        throw new Error("Invalid data URL format");
      }
    } else {
      // Fetch from URL
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`);
      }
      const imageBuffer = await imageResponse.arrayBuffer();
      imageBase64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
      
      // Detect mime type from content-type header
      const contentType = imageResponse.headers.get("content-type");
      if (contentType) {
        mimeType = contentType.split(";")[0].trim();
      }
    }

    // Build the prompt with image
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType,
      },
    };

    const textPart = {
      text: compiledPrompt + "\n\nGenerate an enhanced version of this image following all the instructions above. Output ONLY the enhanced image.",
    };

    // Generate content
    console.log(`[generate-image] Calling Gemini ${modelName}...`);
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
