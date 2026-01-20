
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
    ImageMagick,
    initialize,
    MagickGeometry,
    MagickFormat,
} from "https://deno.land/x/imagemagick_deno@0.0.31/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { buildStandardFileName, buildStandardStoragePath } from "../_shared/storage-logic.ts"

await initialize(); // Initialize ImageMagick WASM

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const formData = await req.formData();
        const imageFile = formData.get("image") as File;
        const cropDataStr = formData.get("cropData") as string;
        const targetWidth = parseInt(formData.get("targetWidth") as string || "1920");

        if (!imageFile || !cropDataStr) {
            throw new Error("Missing image or cropData");
        }

        const cropData = JSON.parse(cropDataStr); // { x, y, width, height }
        const arrayBuffer = await imageFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        let finalBuffer: Uint8Array;

        await ImageMagick.read(uint8Array, async (img) => {
            // 1. CROP: Extract the visible area based on frontend calculation
            // The frontend sends the Exact Viewport coordinates relative to the original image
            const geometry = new MagickGeometry(
                cropData.x,
                cropData.y,
                cropData.width,
                cropData.height
            );
            img.crop(geometry);

            // 2. RESIZE: Downscale to target width (e.g. 1920px for Desktop, 800px for Mobile)
            // We keep aspect ratio
            const resizeGeo = new MagickGeometry(targetWidth, 0);
            resizeGeo.ignoreAspectRatio = false;
            img.resize(resizeGeo);

            // 3. SHARPEN: Apply unsharp mask for "Pro Focus" look
            // radius, sigma, amount, threshold
            img.unsharpMask(0.7, 1, 1.5, 0.05);

            // 4. FORMAT: Convert to WebP
            await img.write(MagickFormat.Webp, (data) => {
                finalBuffer = data;
            });
        });

        // 5. UPLOAD to Supabase Storage
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const safeFileName = buildStandardFileName(imageFile.name, 'THUMB', 'optimized', 'v1', 'webp');
        const path = buildStandardStoragePath('admin', 'WEB_ASSETS', 'static', safeFileName);

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from("lux-storage")
            .upload(path, finalBuffer!, {
                contentType: "image/webp",
                upsert: true,
            });

        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage
            .from("lux-storage")
            .getPublicUrl(path);

        return new Response(
            JSON.stringify({
                success: true,
                url: publicUrl.publicUrl,
                details: { width: targetWidth, path }
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
    }
});
