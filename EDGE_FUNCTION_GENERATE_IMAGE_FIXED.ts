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
    
    console.log("[generate-image] Request received", { uploadId, hasPrompt: !!prompt, imageLength: imageBase64?.length });
    
    if (!prompt || !imageBase64) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing prompt or imageBase64" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Usar LaoZhang Nano Banana Pro (Google Native Format)
    const LAOZHANG_KEY = Deno.env.get("LAOZHANG_API_KEY")!;
    const ENDPOINT = "https://api.laozhang.ai/v1beta/models/gemini-3-pro-image-preview:generateContent";
    
    console.log("[generate-image] Calling LaoZhang API...");
    
    const laozhangResponse = await fetch(ENDPOINT, {
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
      console.error("[generate-image] LaoZhang error:", errorText);
      throw new Error(`LaoZhang API error (${laozhangResponse.status}): ${errorText.substring(0, 200)}`);
    }
    
    const laozhangData = await laozhangResponse.json();
    
    // Extraer imagen del response
    const imageData = laozhangData.candidates?.[0]?.content?.parts?.[0]?.inline_data?.data;
    
    if (!imageData) {
      console.error("[generate-image] No image in response:", JSON.stringify(laozhangData).substring(0, 200));
      throw new Error("No image data in LaoZhang response");
    }
    
    console.log("[generate-image] Image generated successfully, saving to DB...");
    
    // Guardar en generations table
    const { data: genData, error: genError } = await supabase
      .from("generations")
      .insert({
        upload_id: uploadId,
        prompt_used: prompt.substring(0, 1000),
        config_used: config || {},
        watermarked_url: imageData,
        is_preview: true,
        tokens_spent: 0
      })
      .select()
      .single();
    
    if (genError) {
      console.error("[generate-image] DB save error:", genError);
      throw new Error(`Failed to save: ${genError.message}`);
    }
    
    console.log("[generate-image] ✅ Saved to generations table, ID:", genData.id);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        image_base64: imageData,
        imageBase64: imageData,
        generation_id: genData.id,
        url: `data:image/jpeg;base64,${imageData}`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error: any) {
    console.error("[generate-image] ERROR:", error.message);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: error.stack
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
