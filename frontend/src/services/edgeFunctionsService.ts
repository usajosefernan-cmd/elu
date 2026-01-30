// LuxScaler v28 - Edge Functions Client
// Centralizes all calls to Supabase Edge Functions
// Falls back to FastAPI backend if Edge Functions are not deployed

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Backend base URL (required for fallback to FastAPI)
// NOTE: In Vite, only VITE_* vars are exposed to the browser.
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface VisionAnalysisResult {
  success: boolean;
  analysis?: {
    technical_score: number;
    semantic_anchors: string[];
    suggested_settings: Record<string, number>;
    detected_issues: string[];
    recommended_profile: 'auto' | 'user' | 'pro' | 'prolux';
  };
  thumbnail_used: boolean;
  tokens_consumed: number;
  error?: string;
}

interface PromptCompilerResult {
  success: boolean;
  prompt?: string;
  metadata?: {
    vetos_applied: string[];
    active_sliders: number;
    force_sliders: number;
    identity_lock: boolean;
    identity_lock_level: string;
    user_mode: string;
    version: string;
    cache_used: boolean;
  };
  debug_info?: {
    vetos_applied: Array<{
      rule_name: string;
      actions: Array<{
        slider_name: string;
        original_value: number;
        forced_value: number;
        reason: string;
      }>;
    }>;
    active_sliders: {
      total_active: number;
      force_sliders: number;
      by_pillar: Record<string, number>;
      translations: Array<{
        slider: string;
        value: number;
        pillar: string;
        instruction_preview: string;
      }>;
    };
    sanitization: {
      redundancies_removed: number;
      empty_sections_removed: string[];
      lines_before: number;
      lines_after: number;
    };
    validation: {
      valid: boolean;
      issues: string[];
      char_count: number;
      line_count: number;
      estimated_tokens: number;
    };
  };
  tokens_estimate?: {
    system_cached: number;
    user_new: number;
    total_from_cache: number;
    total_estimated: number;
  };
  dna_anchor?: {
    detected: boolean;
    strength: string;
  };
  error?: string;
}

interface GenerateImageResult {
  success: boolean;
  output?: {
    text: string;
    image: string | null;
    hasWatermark: boolean;
  };
  metadata?: {
    model_used: string;
    tokens_consumed: number;
    tokens_charged: number;
    output_type: string;
  };
  error?: string;
}

const callEdgeFunction = async <T>(
  functionName: string,
  body: Record<string, any>
): Promise<T> => {
  const canUseSupabaseFn = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

  // Helper: FastAPI fallback (with proper timeout for image generation)
  const callFastApi = async (): Promise<T> => {
    if (!BACKEND_URL) {
      throw new Error('Missing VITE_BACKEND_URL (required for FastAPI fallback).');
    }

    // Map function name -> FastAPI endpoint
    const endpoint =
      functionName === 'vision-analysis'
        ? 'process/analyze'
        : functionName === 'prompt-compiler'
          ? 'process/compile'
          : functionName === 'generate-image'
            ? 'process/generate-image'
            : functionName;

    // Longer timeout for image generation
    const timeoutMs = functionName === 'generate-image' ? 180000 : 60000;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(`${BACKEND_URL}/api/${endpoint}`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }).finally(() => window.clearTimeout(timeoutId));

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${errorText}`);
    }

    return response.json();
  };

  // For image generation and prompt-compiler, go directly to FastAPI (Edge Function deployment pending)
  if (functionName === 'generate-image' || functionName === 'prompt-compiler') {
    console.log(`[EdgeFunctions] Using FastAPI directly for ${functionName}`);
    return callFastApi();
  }

  if (canUseSupabaseFn) {
    try {
      // Use Supabase Edge Functions (increased timeout for Gemini image generation)
      const controller = new AbortController();
      const timeoutMs = 120000; // 120 seconds - Gemini image generation can take 60-90s
      const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(body),
      }).finally(() => window.clearTimeout(timeoutId));

      if (!response.ok) {
        const errorText = await response.text();
        // Only fallback if it's a BOOT_ERROR, not other errors
        if (errorText.includes('BOOT_ERROR')) {
          throw new Error(`Edge Function BOOT_ERROR: ${errorText}`);
        }
        throw new Error(`Edge Function Error: ${errorText}`);
      }

      const result = await response.json();
      console.log(`[EdgeFunctions] ${functionName} responded from Supabase`);
      return result;
    } catch (e) {
      console.warn('[EdgeFunctions] Failed, falling back to FastAPI:', e);
      return callFastApi();
    }
  }

  return callFastApi();
};

// =====================================================
// VISION ANALYSIS (Gemini 2.5 Flash)
// =====================================================
export const analyzeImageWithVision = async (
  imageUrl: string,
  userId?: string
): Promise<VisionAnalysisResult> => {
  // IMPORTANT: Vision must be snappy; skip Edge Functions while BOOT_ERROR persists.
  // Use the stable FastAPI endpoint directly.
  if (!BACKEND_URL) {
    throw new Error('Missing VITE_BACKEND_URL (required for vision).');
  }

  const response = await fetch(`${BACKEND_URL}/api/process/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl, userId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${errorText}`);
  }

  return response.json();
};

export const analyzeImageBase64WithVision = async (
  imageBase64: string,
  userId?: string
): Promise<VisionAnalysisResult> => {
  // Same as analyzeImageWithVision: go directly to FastAPI for speed/stability
  if (!BACKEND_URL) {
    throw new Error('Missing VITE_BACKEND_URL (required for vision).');
  }

  const response = await fetch(`${BACKEND_URL}/api/process/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, userId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${errorText}`);
  }

  return response.json();
};

// =====================================================
// PROMPT COMPILER
// =====================================================
export interface SliderConfig {
  photoscaler?: { sliders: Array<{ name: string; value: number }> };
  stylescaler?: { sliders: Array<{ name: string; value: number }> };
  lightscaler?: { sliders: Array<{ name: string; value: number }> };
}

export const compilePrompt = async (
  config: SliderConfig,
  visionAnalysis?: VisionAnalysisResult['analysis'],
  userMode: string = 'auto'
): Promise<PromptCompilerResult> => {
  return await callEdgeFunction<PromptCompilerResult>('prompt-compiler', {
    config,
    visionAnalysis,
    userMode,
    profileType: userMode.toUpperCase(),
    includeDebug: true,  // Always include debug info for Archives
  });
};

// =====================================================
// IMAGE GENERATION (Gemini 3 Pro)
// =====================================================

// Convert frontend slider format to backend format
const convertSliderConfigToFlat = (config: SliderConfig): Record<string, Record<string, number>> => {
  const result: Record<string, Record<string, number>> = {
    photoscaler: {},
    stylescaler: {},
    lightscaler: {}
  };
  
  if (config.photoscaler?.sliders) {
    for (const slider of config.photoscaler.sliders) {
      result.photoscaler[slider.name] = slider.value;
    }
  }
  if (config.stylescaler?.sliders) {
    for (const slider of config.stylescaler.sliders) {
      result.stylescaler[slider.name] = slider.value;
    }
  }
  if (config.lightscaler?.sliders) {
    for (const slider of config.lightscaler.sliders) {
      result.lightscaler[slider.name] = slider.value;
    }
  }
  
  return result;
};

// New v40: Generate with slider config (FORENSIC/CREATIVE/PRESET modes)
export const generateImageWithSliders = async (
  imageUrl: string,
  sliderConfig: SliderConfig,
  options: {
    userMode?: string;
    userId?: string;
    includeDebug?: boolean;
    mode?: 'FORENSIC' | 'CREATIVE' | 'PRESET' | 'AUTO';
    savedConfig?: { seed: number; temperature: number };
  } = {}
): Promise<GenerateImageResult & { debug?: any; meta?: { used_seed: number; used_temp: number } }> => {
  const flatConfig = convertSliderConfigToFlat(sliderConfig);
  
  // Step 1: Compile prompt using Supabase Edge Function prompt-compiler v40.0
  console.log(`[EdgeFunctions] Calling prompt-compiler v40.0 (mode: ${options.mode || 'AUTO'})...`);
  const promptResult = await callEdgeFunction<{
    success: boolean;
    prompt_text: string;
    config: {
      temperature: number;
      topK: number;
      topP: number;
      maxOutputTokens: number;
      seed: number;
    };
    version: string;
    metadata: {
      template: string;
      mode: string;
      active_sliders: number;
      levels_used: Record<string, string>;
      identity_lock: boolean;
    };
    error?: string;
  }>('prompt-compiler', {
    sliderConfig: flatConfig,
    mode: options.mode || 'AUTO',
    saved_config: options.savedConfig,
  });

  if (!promptResult.success || !promptResult.prompt_text) {
    return {
      success: false,
      error: promptResult.error || 'Prompt compilation failed',
    };
  }

  console.log(`[EdgeFunctions] Prompt compiled: v${promptResult.version}, mode=${promptResult.metadata?.mode}, temp=${promptResult.config?.temperature}, seed=${promptResult.config?.seed}`);

  // Step 2: Generate image with compiled prompt + config (seed + temperature)
  const generateResult = await callEdgeFunction<GenerateImageResult & { meta?: any }>('generate-image', {
    imageUrl,
    prompt_text: promptResult.prompt_text,
    config: promptResult.config,  // Pass seed + temperature config
    userMode: options.userMode || 'auto',
    userId: options.userId,
  });

  // Merge debug info and meta
  return {
    ...generateResult,
    meta: generateResult.meta || {
      used_seed: promptResult.config?.seed,
      used_temp: promptResult.config?.temperature,
    },
    debug: options.includeDebug ? {
      compiled_prompt: promptResult.prompt_text,
      slider_debug: {
        levels_used: promptResult.metadata?.levels_used || {},
        active_sliders: promptResult.metadata?.active_sliders || 0,
        mode: promptResult.metadata?.mode,
      },
      prompt_version: promptResult.version,
      generation_config: promptResult.config,
    } : undefined,
  };
};

// Legacy: Generate with pre-compiled prompt
export const generateEnhancedImage = async (
  imageUrl: string,
  compiledPrompt: string,
  options: {
    userMode?: string;
    userId?: string;
    jobId?: string;
    outputType?: 'preview_watermark' | 'preview_clean' | 'master_4k' | 'master_8k';
  } = {}
): Promise<GenerateImageResult> => {
  return await callEdgeFunction<GenerateImageResult>('generate-image', {
    imageUrl,
    compiledPrompt,
    userMode: options.userMode || 'auto',
    userId: options.userId,
    jobId: options.jobId,
    outputType: options.outputType || 'preview_watermark',
  });
};

// =====================================================
// SAVE PRESET (with Seed + Temperature)
// =====================================================
export const savePreset = async (
  name: string,
  seed: number,
  temperature: number,
  sliders: Record<string, Record<string, number>>,
  options: {
    userId?: string;
    mode?: string;
    thumbnailUrl?: string;
  } = {}
): Promise<{ success: boolean; preset?: any; error?: string }> => {
  return await callEdgeFunction<{ success: boolean; preset?: any; error?: string }>('save-preset', {
    name,
    seed,
    temperature,
    sliders_config: sliders,
    user_id: options.userId,
    mode: options.mode || 'CREATIVE',
    thumbnail_url: options.thumbnailUrl,
  });
};

// =====================================================
// COMPLETE FLOW v40 (Uses Supabase Edge Functions)
// =====================================================
export const processImageComplete = async (
  imageUrl: string,
  config: SliderConfig,
  options: {
    userMode?: string;
    userId?: string;
    outputType?: 'preview_watermark' | 'preview_clean' | 'master_4k' | 'master_8k';
    onVisionComplete?: (result: VisionAnalysisResult) => void;
    onPromptCompiled?: (result: PromptCompilerResult) => void;
    useDirectSliders?: boolean; // NEW: Use Universal Prompt Assembler directly
  } = {}
): Promise<GenerateImageResult & { debug?: any }> => {
  // Step 1: Vision Analysis (optional but recommended)
  const visionResult = await analyzeImageWithVision(imageUrl, options.userId);
  if (!visionResult.success) {
    throw new Error(visionResult.error || 'Vision analysis failed');
  }
  options.onVisionComplete?.(visionResult);

  // Step 2 & 3: Generate Image
  // NEW: If useDirectSliders=true, skip prompt compilation and send sliders directly
  if (options.useDirectSliders !== false) {
    // Use Universal Prompt Assembler v37.0 (recommended)
    const generateResult = await generateImageWithSliders(
      imageUrl,
      config,
      {
        userMode: options.userMode,
        userId: options.userId,
        includeDebug: true, // Always include for Archives
      }
    );
    
    return generateResult;
  }
  
  // Legacy path: Compile prompt first, then generate
  const promptResult = await compilePrompt(
    config,
    visionResult.analysis,
    options.userMode
  );
  if (!promptResult.success) {
    throw new Error(promptResult.error || 'Prompt compilation failed');
  }
  options.onPromptCompiled?.(promptResult);

  const generateResult = await generateEnhancedImage(
    imageUrl,
    promptResult.prompt!,
    {
      userMode: options.userMode,
      userId: options.userId,
      outputType: options.outputType,
    }
  );

  return generateResult;
};


// ============================================================
// 🔥 BATCH PROCESSING - Procesar múltiples fotos con el mismo estilo
// ============================================================
export interface BatchImage {
  url: string;
  id: string;
  file?: File;
}

export interface BatchResult {
  id: string;
  success: boolean;
  image?: string;
  seed?: number;
  error?: string;
}

export interface BatchResponse {
  success: boolean;
  results: BatchResult[];
  batch_info: {
    total: number;
    successful: number;
    failed: number;
    seed_used: number;
    temperature_used: number;
    mode: string;
  };
}

export const batchGenerateImages = async (
  images: BatchImage[],
  sliderConfig: Record<string, Record<string, number>>,
  options: {
    mode?: 'AUTO' | 'FORENSIC' | 'SHOWMAN' | 'PRESET';
    preset_data?: {
      seed: number;
      temperature: number;
      style_lock_prompt?: string;
    };
    sequential?: boolean;
    onProgress?: (completed: number, total: number, currentResult?: BatchResult) => void;
  } = {}
): Promise<BatchResponse> => {
  const { mode = 'AUTO', preset_data, sequential = false, onProgress } = options;

  if (!BACKEND_URL) {
    throw new Error('Missing VITE_BACKEND_URL');
  }

  // Convert File objects to base64 URLs if needed
  const processedImages: { url: string; id: string }[] = [];
  
  for (const img of images) {
    if (img.file) {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(img.file!);
      });
      processedImages.push({ url: base64, id: img.id });
    } else {
      processedImages.push({ url: img.url, id: img.id });
    }
  }

  // If sequential mode with progress callback, process one by one locally
  if (sequential && onProgress) {
    const results: BatchResult[] = [];
    
    for (let i = 0; i < processedImages.length; i++) {
      const img = processedImages[i];
      
      try {
        // Call single image batch endpoint
        const response = await fetch(`${BACKEND_URL}/api/process/batch-generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            images: [img],
            sliderConfig,
            mode,
            preset_data,
            sequential: true
          }),
        });

        const data = await response.json();
        const result = data.results?.[0] || { id: img.id, success: false, error: 'No result' };
        results.push(result);
        onProgress(i + 1, processedImages.length, result);
      } catch (error) {
        const result = { id: img.id, success: false, error: String(error) };
        results.push(result);
        onProgress(i + 1, processedImages.length, result);
      }
    }

    const successful = results.filter(r => r.success).length;
    return {
      success: true,
      results,
      batch_info: {
        total: results.length,
        successful,
        failed: results.length - successful,
        seed_used: preset_data?.seed || 0,
        temperature_used: preset_data?.temperature || 0.75,
        mode
      }
    };
  }

  // Full batch processing
  const controller = new AbortController();
  const timeoutMs = 300000; // 5 minutes for batch
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${BACKEND_URL}/api/process/batch-generate`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        images: processedImages,
        sliderConfig,
        mode,
        preset_data,
        sequential
      }),
    });

    window.clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Batch API error: ${response.status}`);
    }

    return response.json();
  } finally {
    window.clearTimeout(timeoutId);
  }
};

export default {
  analyzeImageWithVision,
  analyzeImageBase64WithVision,
  compilePrompt,
  generateEnhancedImage,
  generateImageWithSliders,
  processImageComplete,
  batchGenerateImages,
};
