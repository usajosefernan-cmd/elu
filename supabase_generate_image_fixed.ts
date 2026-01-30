
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { prompt, config, uploadId, imageBase64, variationIndex, preset } = await req.json();
    
    console.log("Received request:", { uploadId, hasPrompt: !!prompt, hasImage: !!imageBase64 });
    
    if (!prompt || !imageBase64) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing prompt or imageBase64" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Llamar LaoZhang Nano Banana Pro (formato Google Native)
    const LAOZHANG_KEY = Deno.env.get("LAOZHANG_API_KEY")!;
    const LAOZHANG_ENDPOINT = "https://api.laozhang.ai/v1beta/models/gemini-3-pro-image-preview:generateContent";
    
    console.log("Calling LaoZhang API...");
    
    const laozhangResponse = await fetch(LAOZHANG_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LAOZHANG_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: "image/jpeg", data: imageBase64 }}
          ]
        }],
        generationConfig: {
          responseModalities: ["IMAGE"],
          imageConfig: {
            imageSize: "4K"
          }
        }
      })
    });
    
    if (!laozhangResponse.ok) {
      const errorText = await laozhangResponse.text();
      throw new Error(`LaoZhang API error: ${errorText}`);
    }
    
    const laozhangData = await laozhangResponse.json();
    
    // Extraer imagen
    const imageData = laozhangData.candidates?.[0]?.content?.parts?.[0]?.inline_data?.data;
    
    if (!imageData) {
      throw new Error("No image in LaoZhang response");
    }
    
    console.log("Image generated, saving to database...");
    
    // Guardar en generations table
    const { data: genData, error: genError } = await supabase
      .from("generations")
      .insert({
        upload_id: uploadId,
        prompt_used: prompt.substring(0, 1000),
        config_used: config,
        watermarked_url: imageData,  // base64
        is_preview: true,
        tokens_spent: 0
      })
      .select()
      .single();
    
    if (genError) {
      console.error("DB save error:", genError);
      throw new Error(`Failed to save to DB: ${genError.message}`);
    }
    
    console.log("✅ Saved to generations table");
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        image_base64: imageData,
        generation_id: genData.id,
        url: `data:image/jpeg;base64,${imageData}`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error: any) {
    console.error("generate-image error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        hint: "Check LAOZHANG_API_KEY and network connectivity"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
