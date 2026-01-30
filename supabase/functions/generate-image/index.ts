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

const NANO_BANANA_ENDPOINT = Deno.env.get("NANO_BANANA_ENDPOINT") || "https://api.replicate.com/v1/predictions"; // Fallback/Placeholder
const NANO_BANANA_API_KEY = Deno.env.get("NANO_BANANA_API_KEY") || "NONE";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      prompt,
      config,
      uploadId,
      imageBase64,
      variationIndex,
      preset,
    } = body;

    // 1. Preparar payload para Nano Banana Pro (con Smart Anchors)
    const nanoParams = preset?.nano_params || config || {};
    const anchorPreferences = preset?.anchor_preferences || {};
    const referenceImageUrl = preset?.reference_image_url || null;

    const apiPayload: any = {
      prompt,
      seed: nanoParams.seed ?? Math.floor(Math.random() * 1_000_000),
      strength: nanoParams.strength ?? 0.65,
      guidance_scale: nanoParams.guidance_scale ?? 7.0,
      sampler: nanoParams.sampler ?? "Euler a",
      input_image_base64: imageBase64,
    };

    // Smart Anchors: si el preset tiene referencia y el usuario activó fondo/lighting/style
    if (referenceImageUrl && (anchorPreferences.background || anchorPreferences.lighting || anchorPreferences.style)) {
      apiPayload.reference_image_url = referenceImageUrl;
      apiPayload.anchor_background = !!anchorPreferences.background;
      apiPayload.anchor_lighting = !!anchorPreferences.lighting;
      apiPayload.anchor_style = !!anchorPreferences.style;
    }

    // Call Mock or Real Endpoint
    // For now, if no API Key, return mock
    let cleanFileName = "";
    let previewPublicUrl = "";

    if (NANO_BANANA_API_KEY === "NONE") {
      // MOCK GENERATION
      console.log("Mocking generation for", uploadId);
      const mockImage = imageBase64; // Return same image for test
      cleanFileName = `${uploadId}/clean_${variationIndex || 0}_${Date.now()}.jpg`;
      // Upload mock
      const cleanBuffer = Uint8Array.from(atob(mockImage), (c) => c.charCodeAt(0));
      await supabase.storage
        .from("generations_private")
        .upload(cleanFileName, cleanBuffer, { contentType: "image/jpeg" });

      const previewFileName = `${uploadId}/preview_${variationIndex || 0}_${Date.now()}.jpg`;
      await supabase.storage
        .from("generations_public")
        .upload(previewFileName, cleanBuffer, { contentType: "image/jpeg" });

      previewPublicUrl = supabase.storage
        .from("generations_public")
        .getPublicUrl(previewFileName).data.publicUrl;

    } else {
      const nanoRes = await fetch(NANO_BANANA_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${NANO_BANANA_API_KEY}`,
        },
        body: JSON.stringify(apiPayload),
      });

      if (!nanoRes.ok) {
        const errorText = await nanoRes.text();
        throw new Error("Nano Banana failed: " + errorText);
      }

      const nanoData = await nanoRes.json();
      // Assuming response has image_base64
      const cleanBuffer = Uint8Array.from(atob(nanoData.image_base64), (c) => c.charCodeAt(0));

      cleanFileName = `${uploadId}/clean_${variationIndex || 0}_${Date.now()}.jpg`;
      await supabase.storage
        .from("generations_private")
        .upload(cleanFileName, cleanBuffer, { contentType: "image/jpeg" });

      const watermarkedBuffer = await applyWatermark(cleanBuffer.buffer);

      const previewFileName = `${uploadId}/preview_${variationIndex || 0}_${Date.now()}.jpg`;
      await supabase.storage
        .from("generations_public")
        .upload(previewFileName, watermarkedBuffer, { contentType: "image/jpeg" });

      previewPublicUrl = supabase.storage
        .from("generations_public")
        .getPublicUrl(previewFileName).data.publicUrl;
    }

    await supabase.from("generations").insert({
      upload_id: uploadId,
      prompt_used: prompt,
      config_used: {
        seed: apiPayload.seed,
        strength: apiPayload.strength,
        guidance: apiPayload.guidance_scale,
        preset_id: preset?.id || null,
      },
      clean_url: cleanFileName,
      watermarked_url: previewPublicUrl,
      is_preview: true,
      tokens_spent: 0,
    });

    return new Response(
      JSON.stringify({ success: true, url: previewPublicUrl, clean_path: cleanFileName }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("generate-image error", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});

// Watermark helper (simplificado)
async function applyWatermark(imageBuffer: ArrayBuffer): Promise<Uint8Array> {
  try {
    // Aquí podrías usar ImageScript o similar. De momento, recodificamos tal cual.
    return new Uint8Array(imageBuffer);
  } catch (e) {
    console.warn("Watermark failed, returning original", e);
    return new Uint8Array(imageBuffer);
  }
}
