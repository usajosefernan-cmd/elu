import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// --- 1. DEFINICIÓN DE TIPOS (INTERFACES) ---

// Frontend Config (Reflejando src/types.ts para inputs)
export interface LuxConfigInput {
  photoScaler?: {
    definition?: number;       // Maps to DB 'acutancia'
    noise_reduction?: number; 
    lens_fix?: number;
  };
  lightScaler?: {
    tone_recovery?: number;    // Maps to DB 'sombras'
    color_science?: number;
    lighting_style?: string;   // Maps to DB 'lighting_style' slug
    identity_weight?: number;  // Maps to DB 'identity'
  };
  styleScaler?: {
    reality_inject?: number;   // Maps to DB 'detalle'
    guidance_scale?: number;   // Maps to DB 'guidance_scale' override
  };
}

// Vision Intelligence (Proveniente de Gemini EdgeVision)
export interface ForensicBlueprint {
  classification: { 
    primary: string;         // 'HUMAN', 'FOOD', etc.
    sub_category: string 
  };
  technical_audit: { 
    signal: string;          // 'Underexposed', 'Perfect', etc.
    distortion: string;      // 'Barrel', 'Pincushion'
  };
  materiality_map: {
    semantic_segments: Array<{
      label: string;         // 'SKIN', 'SILK', 'METAL'
      detected_attribute?: string;
    }>;
  };
}

export interface PromptBuilderResult {
  positive_prompt: string;
  negative_prompt: string;
  settings: {
    guidance_scale: number;
    steps?: number;
    strength?: number;
  };
  telemetry: {
    applied_rules: string[];
    effective_sliders: any;
    vision_interventions: string[];
  };
}

// --- 2. LOGICA PRINCIPAL DE ENSAMBLAJE ---

export async function buildDeepThinkPrompt(
  supabase: SupabaseClient,
  userConfig: LuxConfigInput,
  visionBlueprint?: ForensicBlueprint
): Promise<PromptBuilderResult> {

  // 2.1 MAPPING LAYER (Frontend English -> DB Spanish Keys)
  // Normalizamos los inputs del usuario a un estado base
  const rawSliders = {
    acutancia: userConfig.photoScaler?.definition || 5,
    sombras: userConfig.lightScaler?.tone_recovery || 5,
    detalle: userConfig.styleScaler?.reality_inject || 5,
    lighting_style: userConfig.lightScaler?.lighting_style || 'natural',
    identity: userConfig.lightScaler?.identity_weight || 0,
  };

  // 2.2 VISION OVERRIDES (El "Copiloto")
  // Calculamos los 'Effective Sliders' basados en el diagnóstico
  const { effectiveSliders, interventions } = await resolveVisionOverrides(
    supabase, 
    rawSliders, 
    visionBlueprint
  );

  // 2.3 PARALLEL FETCH (La consulta al cerebro SQL)
  // Ejecutamos las queries optimizadas en paralelo
  const [photoscaler, lightscaler, stylescaler, globalConfig, materials] = await Promise.all([
    
    // A. Photoscaler (Estructura)
    fetchRule(supabase, 'photoscaler_prompt_rules', 'acutancia', effectiveSliders.acutancia),
    
    // B. Lightscaler (Luz - Sombras + Estilo)
    fetchLightSystem(supabase, effectiveSliders),
    
    // C. Stylescaler (Arte)
    fetchRule(supabase, 'stylescaler_prompt_rules', 'detalle', effectiveSliders.detalle),
    
    // D. Global Config (Siempre)
    supabase.from('global_prompt_config')
      .select('prompt_text')
      .eq('config_key', 'v15_master_negative')
      .single(),

    // E. Materiales (Semántica)
    fetchMaterials(supabase, visionBlueprint)
  ]);

  // 2.4 ASSEMBLY LINE (Concatenación v15 Protocol)
  const promptStack: string[] = [];
  const appliedRules: string[] = [];

  // [LAYER 1] STRUCTURE
  if (photoscaler) {
    promptStack.push(photoscaler.base_prompt); // Header + Mission
    if (photoscaler.geometric_correction) promptStack.push(photoscaler.geometric_correction);
    if (photoscaler.detail_hallucination) promptStack.push(photoscaler.detail_hallucination);
    appliedRules.push(`Photo: ${photoscaler.intensity_label || 'Manual'}`);
  }

  // [LAYER 2] PHYSICS & LIGHT
  if (lightscaler) {
    promptStack.push(lightscaler.base_prompt); 
    promptStack.push(lightscaler.color_science_grading || lightscaler.color_science_prompt);
    promptStack.push(lightscaler.white_balance_logic || lightscaler.white_balance_prompt);
    
    // Inyectar Estilo Específico (si existe)
    if (lightscaler.style_data) {
      promptStack.push(lightscaler.style_data.protocol_header);
      promptStack.push(lightscaler.style_data.light_source_physics);
      appliedRules.push(`Style: ${lightscaler.style_data.style_slug}`);
    }
  }

  // [LAYER 3] ART & TEXTURE
  if (stylescaler) {
    promptStack.push(stylescaler.base_prompt || stylescaler.art_direction_header);
    promptStack.push(stylescaler.texture_quality_prompt);
    promptStack.push(stylescaler.anamorphic_optics_prompt);
  }

  // [LAYER 4] SEMANTIC MATERIALS
  if (materials && materials.length > 0) {
    const matPrompts = materials.map(m => m.physics_logic_prompt).join(" ");
    promptStack.push(`$$[MATERIAL PHYSICS INJECTION]: ${matPrompts}$$`);
    appliedRules.push(`Materials: ${materials.length} active`);
  }

  // [LAYER 5] OUTPUT SPECS
  // (Assuming global config for specs also exists or is part of master negative query, 
  // currently we only fetched negative. Let's add specs if needed, for now standard.)
  promptStack.push("OUTPUT SPECS: Native 4K, Photorealistic RAW.");

  // 2.5 CLEANUP
  const positivePrompt = promptStack
    .map(p => p?.trim())
    .filter(p => p && p.length > 0)
    .join("\n\n");

  return {
    positive_prompt: positivePrompt,
    negative_prompt: globalConfig.data?.prompt_text || "",
    settings: {
      guidance_scale: stylescaler?.guidance_scale || 7.5,
      steps: 30 // Default standard
    },
    telemetry: {
      applied_rules: appliedRules,
      effective_sliders: effectiveSliders,
      vision_interventions: interventions
    }
  };
}

// --- 3. HELPER FUNCTIONS ---

async function resolveVisionOverrides(
  supabase: SupabaseClient, 
  currentSliders: any, 
  blueprint?: ForensicBlueprint
) {
  const effective = { ...currentSliders };
  const interventions: string[] = [];

  if (!blueprint) return { effectiveSliders: effective, interventions };

  // Mapear claves de Vision (JSON) a columnas DB
  // Blueprint keys: classification.primary, technical_audit.signal, etc.
  
  // Buscar todas las reglas activas
  const { data: rules } = await supabase
    .from('vision_trigger_overrides')
    .select('*')
    .eq('is_active', true)
    .order('override_priority', { ascending: false });

  if (!rules) return { effectiveSliders: effective, interventions };

  for (const rule of rules) {
    // Check Match
    let isMatch = false;
    
    // Logic for traversing the deep JSON object
    if (rule.json_category === 'technical_audit' && rule.json_key === 'signal') {
      if (blueprint.technical_audit?.signal === rule.json_value_match) isMatch = true;
    }
    else if (rule.json_category === 'technical_audit' && rule.json_key === 'distortion') {
      if (blueprint.technical_audit?.distortion === rule.json_value_match) isMatch = true;
    }
    // ... Add more matchers as needed

    if (isMatch) {
      // Execute Action
      if (rule.action_type === 'SET_SLIDER_MIN') {
        const targetSlider = mapTableToSlider(rule.target_table); // 'photoscaler' -> 'acutancia'
        if (targetSlider && effective[targetSlider] < rule.forced_slider_value) {
          effective[targetSlider] = rule.forced_slider_value;
          interventions.push(`${rule.description} (Forced ${targetSlider} to ${rule.forced_slider_value})`);
        }
      }
    }
  }

  return { effectiveSliders: effective, interventions };
}

function mapTableToSlider(tableName: string): string | null {
  if (tableName === 'photoscaler_prompt_rules') return 'acutancia';
  if (tableName === 'lightscaler_prompt_rules') return 'sombras';
  if (tableName === 'stylescaler_prompt_rules') return 'detalle';
  return null;
}

async function fetchRule(supabase: SupabaseClient, table: string, col: string, val: number) {
  const { data } = await supabase.from(table)
    .select('*')
    .eq('slider_name', col)
    .lte('slider_value_min', val)
    .gte('slider_value_max', val)
    .single();
  return data;
}

async function fetchLightSystem(supabase: SupabaseClient, sliders: any) {
  // A. Fetch Base Logic (Sombras)
  const base = await fetchRule(supabase, 'lightscaler_prompt_rules', 'sombras', sliders.sombras);
  
  // B. Fetch Style (si está seleccionado)
  let styleData = null;
  if (sliders.lighting_style && sliders.lighting_style !== 'natural') {
    const { data } = await supabase.from('lightscaler_prompt_rules')
      .select('*')
      .eq('slider_name', 'lighting_style')
      .eq('style_slug', sliders.lighting_style)
      .single();
    styleData = data;
  }

  return { ...base, style_data: styleData };
}

async function fetchMaterials(supabase: SupabaseClient, blueprint?: ForensicBlueprint) {
  if (!blueprint?.materiality_map?.semantic_segments) return [];
  
  const tags = blueprint.materiality_map.semantic_segments.map(s => s.label);
  if (tags.length === 0) return [];

  const { data } = await supabase
    .from('semantic_material_rules')
    .select('*')
    .in('material_tag', tags)
    .eq('is_active', true);
    
  return data || [];
}
