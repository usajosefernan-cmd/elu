# LUXSCALER: ANEXO DE PRESETS Y SMART ANCHORS

Este módulo habilita la funcionalidad de "Guardar Estilo" y reutilizar fondos/iluminación (Smart Anchors).

## 1. ACTUALIZACIÓN SQL (Ejecutar después del Archivo 1)

SQL

```
-- Actualización de la tabla user_presets para soportar Smart Anchors
ALTER TABLE user_presets 
ADD COLUMN IF NOT EXISTS nano_params JSONB,          -- Guarda strength, guidance, sampler, seed
ADD COLUMN IF NOT EXISTS anchor_preferences JSONB,   -- { "background": true, "lighting": true }
ADD COLUMN IF NOT EXISTS reference_image_url TEXT,   -- URL de la imagen limpia usada como ancla
ADD COLUMN IF NOT EXISTS prompt_text TEXT;           -- Backup del prompt compilado
```

## 2. LÓGICA DE UI: MODAL DE GUARDADO

Cuando el usuario da click a "Guardar Preset", mostrar este formulario:

**Título:** 💾 Guardar Receta Visual **Subtítulo:** *¡Esta generación ha quedado genial! ¿Qué es lo que más te gusta para guardarlo?*

**Campos:**

1. **Nombre:** `[ Input Texto ]` (Ej: Restaurante Lujoso)

2. **Checkboxes de Anclaje (Smart Anchors):**
   
   - [ ] **Ambiente / Fondo** *(Guardará esta imagen como referencia del local)*
   
   - [ ] **Iluminación** *(Guardará la configuración de luz dramática)*
   
   - [ ] **Estilo/Vibe** *(Guardará la estética general)*
   
   - *(Nota: Ropa y Pose suelen dejarse desmarcados para permitir flexibilidad)*

**Acción:** Al guardar, envía el JSON a la Edge Function `save-preset`.

## 3. EDGE FUNCTION: `save-preset/index.ts`

TypeScript

```
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
        const { data: publicData } = supabase.storage
            .from('generations_private')
            .getPublicUrl(genData.clean_url); // O usar signedUrl para mayor seguridad interna

        referenceUrl = genData.clean_url; // Guardamos el path interno
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

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
```

## 4. INTEGRACIÓN EN `generate-image`

*Nota: Esto ya está contemplado en el código de la Parte 2, pero aquí se explica la lógica.*

Cuando se usa un preset:

1. Frontend envía `preset: { reference_image_url, anchor_preferences, ... }`.

2. `generate-image` detecta `reference_image_url`.

3. Si `anchor_preferences.background` es true, envía esa URL a la API de Nano Banana como `control_image` o `style_reference`, permitiendo que la nueva foto "herede" el restaurante o la iluminación de la foto guardada.
