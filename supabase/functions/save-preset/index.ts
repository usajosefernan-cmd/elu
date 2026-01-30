import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const {
            userId,
            uploadId,
            presetName,
            userAnchors,          // { background: true, lighting: true... }
            currentSliders        // { p1: 5, s3: 10... }
        } = await req.json();

        // 1. RECUPERAR DATOS DE LA GENERACIÓN ORIGINAL
        const { data: genData, error } = await supabase
            .from('generations')
            .select('prompt_used, config_used, clean_url')
            .eq('upload_id', uploadId)
            .single();

        if (error || !genData) throw new Error("Generation not found");

        const seed = genData.config_used?.seed || Math.floor(Math.random() * 1000000);

        // 2. DETECTOR DE INTENCIÓN (Forense vs. Creativo)
        // Si hay sliders creativos altos, guardamos parámetros "atrevidos"
        const creativeTriggers = [
            currentSliders.s3 || 0, // Ropa
            currentSliders.s5 || 0, // Fondo
            currentSliders.s8 || 0, // Color Cine
            currentSliders.l1 || 0  // Luz Key
        ];

        const isCreativeMode = creativeTriggers.some(val => val > 5);

        const nanoParams = {
            strength: isCreativeMode ? 0.85 : 0.45,
            guidance_scale: isCreativeMode ? 4.0 : 7.5,
            sampler: "Euler a",
            seed: seed
        };

        // 3. LÓGICA DE ANCLAJE VISUAL (SMART ANCHORS)
        // Si el usuario ancló Fondo o Iluminación, guardamos la URL para usarla como ControlNet/IP-Adapter
        let referenceUrl = null;

        if (userAnchors.background || userAnchors.style || userAnchors.lighting) {
            // Obtenemos la URL de la imagen limpia (privada)
            // Idealmente, aquí se copiaría a un bucket permanente de "assets"
            referenceUrl = genData.clean_url;
        }

        // 4. INSERTAR EN DB
        const { data: preset, error: insertError } = await supabase
            .from('user_presets')
            .insert({
                user_id: userId,
                name: presetName,
                sliders_config: currentSliders,
                nano_params: nanoParams,
                anchor_preferences: userAnchors,
                reference_image_url: referenceUrl,
                prompt_text: genData.prompt_used,
                is_active: true
            })
            .select()
            .single();

        if (insertError) throw insertError;

        return new Response(JSON.stringify({
            success: true,
            message: "Preset Anchored Successfully",
            presetId: preset.id
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
});
