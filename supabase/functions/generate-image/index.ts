// LuxScaler v28 - Image Generation Edge Function
// Generates enhanced images using Gemini 3 Pro Image

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Model selection by user mode
const MODEL_BY_MODE: Record<string, string> = {
  auto: "gemini-2.0-flash-exp", // Fast preview
  user: "gemini-2.0-flash-exp",
  pro: "gemini-2.0-flash-exp", // Will be gemini-3-pro when available
  prolux: "gemini-2.0-flash-exp", // + Code Execution for PROLUX
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { 
      imageUrl, 
      imageBase64, 
      compiledPrompt, 
      userMode = "auto",
      userId,
      jobId,
      outputType = "preview_watermark" // preview_watermark, preview_clean, master_4k, master_8k
    } = await req.json();

    if (!imageUrl && !imageBase64) {
      return new Response(
        JSON.stringify({ success: false, error: "No image provided" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!compiledPrompt) {
      return new Response(
        JSON.stringify({ success: false, error: "No compiled prompt provided" }),
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

    // Initialize Supabase for job tracking
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update job status to PROCESSING
    if (jobId) {
      await supabase
        .from("processing_jobs")
        .update({ status: "processing", started_at: new Date().toISOString() })
        .eq("id", jobId);
    }

    // Select model based on user mode
    const modelName = MODEL_BY_MODE[userMode] || MODEL_BY_MODE.auto;
    
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        // For image generation models
        responseModalities: ["TEXT", "IMAGE"],
      },
    });

    // Prepare image part
    let imagePart;
    if (imageBase64) {
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

    // Generate with Gemini
    const result = await model.generateContent([compiledPrompt, imagePart]);
    const response = result.response;

    // Extract generated image if present
    let generatedImageBase64 = null;
    let responseText = "";

    // Check for inline image data in response
    for (const candidate of response.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if (part.text) {
          responseText += part.text;
        }
        if (part.inlineData) {
          generatedImageBase64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }

    // Calculate tokens used
    const tokensUsed = response.usageMetadata?.totalTokenCount || 1000;

    // Determine token cost based on output type
    const TOKEN_COSTS: Record<string, number> = {
      preview_watermark: 10,
      preview_clean: 15,
      master_4k: 50,
      master_8k: 100,
    };
    const tokenCost = TOKEN_COSTS[outputType] || 10;

    // Deduct tokens from user (if authenticated)
    if (userId && userMode !== "prolux") { // PROLUX has unlimited
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("tokens_balance, user_mode")
        .eq("id", userId)
        .single();

      if (profile && profile.user_mode !== "prolux") {
        const newBalance = Math.max(0, (profile.tokens_balance || 0) - tokenCost);
        await supabase
          .from("user_profiles")
          .update({ tokens_balance: newBalance })
          .eq("id", userId);
      }
    }

    // Update job status to COMPLETED
    if (jobId) {
      await supabase
        .from("processing_jobs")
        .update({ 
          status: "completed", 
          completed_at: new Date().toISOString(),
          tokens_spent: tokenCost,
          output_type: outputType,
        })
        .eq("id", jobId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        output: {
          text: responseText,
          image: generatedImageBase64,
          hasWatermark: outputType === "preview_watermark",
        },
        metadata: {
          model_used: modelName,
          tokens_consumed: tokensUsed,
          tokens_charged: tokenCost,
          output_type: outputType,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Image Generation Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
