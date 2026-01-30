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

const LAOZHANG_API_KEY = Deno.env.get("LAOZHANG_API_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const {
      prompt,
      config,
      uploadId,
      imageBase64,
      variationIndex,
      preset,
    } = await req.json();

    console.log("[generate-image] Received:", { uploadId, hasPrompt: !!prompt, imageLength: imageBase64?.length });

    // Preparar payload para LaoZhang Nano Banana Pro
    const nanoParams = preset?.nano_params || config || {};
    const anchorPreferences = preset?.anchor_preferences || {};
    const referenceImageUrl = preset?.reference_image_url || null;

    // Construir parts para LaoZhang
    const parts: any[] = [
      { text: prompt }
    ];

    // Imagen principal
    parts.push({
      inline_data: {
        mime_type: "image/jpeg",
        data: imageBase64
      }
    });

    // Smart Anchors: añadir reference image si está activada
    if (referenceImageUrl && (anchorPreferences.background || anchorPreferences.lighting || anchorPreferences.style)) {
      // Extraer base64 de reference_image_url
      const refBase64 = referenceImageUrl.includes('base64,') 
        ? referenceImageUrl.split('base64,')[1]
        : referenceImageUrl;
      
      parts.push({
        inline_data: {
          mime_type: "image/jpeg",
          data: refBase64
        }
      });
      
      console.log("[generate-image] Smart Anchors active, added reference image");
    }

    // Llamar LaoZhang Nano Banana Pro
    const laozhangEndpoint = "https://api.laozhang.ai/v1beta/models/gemini-3-pro-image-preview:generateContent";
    
    console.log("[generate-image] Calling LaoZhang API...");

    const laozhangRes = await fetch(laozhangEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LAOZHANG_API_KEY}`,
      },
      body: JSON.stringify({
        contents: [{
          parts: parts
        }],
        generationConfig: {
          responseModalities: ["IMAGE"],
          imageConfig: {
            imageSize: "4K"
          }
        }
      }),
    });

    if (!laozhangRes.ok) {
      const errorText = await laozhangRes.text();
      console.error("[generate-image] LaoZhang error:", errorText);
      throw new Error("LaoZhang API failed: " + errorText.substring(0, 200));
    }

    const laozhangData = await laozhangRes.json();

    // Extraer imagen
    const imageData = laozhangData.candidates?.[0]?.content?.parts?.[0]?.inline_data?.data;

    if (!imageData) {
      console.error("[generate-image] No image in response");
      throw new Error("No image data in LaoZhang response");
    }

    console.log("[generate-image] Image generated, size:", imageData.length, "chars");

    // Guardar en generations table
    const { data: genRecord, error: saveError } = await supabase
      .from("generations")
      .insert({
        upload_id: uploadId,
        prompt_used: prompt.substring(0, 1000),
        config_used: {
          seed: nanoParams.seed || config?.seed,
          strength: nanoParams.strength || 0.65,
          guidance: nanoParams.guidance_scale || 7.0,
          preset_id: preset?.id || null,
        },
        watermarked_url: imageData,
        is_preview: true,
        tokens_spent: 0,
      })
      .select()
      .single();

    if (saveError) {
      console.error("[generate-image] DB save error:", saveError);
      throw new Error(`Failed to save to DB: ${saveError.message}`);
    }

    console.log("[generate-image] ✅ Saved to generations table, ID:", genRecord.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        image_base64: imageData,
        imageBase64: imageData,
        generation_id: genRecord.id,
        url: `data:image/jpeg;base64,${imageData}`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[generate-image] ERROR:", error.message);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
