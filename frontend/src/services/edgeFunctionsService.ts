// LuxScaler v28 - Edge Functions Client
// Centralizes all calls to Supabase Edge Functions
// Falls back to FastAPI backend if Edge Functions are not deployed

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Backend base URL (required for fallback to FastAPI)
// NOTE: In Vite, only VITE_* vars are exposed to the browser.
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string | undefined;

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
    identity_lock: boolean;
    user_mode: string;
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

  if (canUseSupabaseFn) {
    // Use Supabase Edge Functions
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // NOTE: anon key works for functions if they're not enforcing auth.
        // If function requires user JWT, we will switch to session access_token later.
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Edge Function Error: ${errorText}`);
    }

    return response.json();
  }

  // Fallback to FastAPI backend
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
          ? 'process/generate'
          : functionName;

  const response = await fetch(`${BACKEND_URL}/api/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${errorText}`);
  }

  return response.json();
};

// =====================================================
// VISION ANALYSIS (Gemini 2.5 Flash)
// =====================================================
export const analyzeImageWithVision = async (
  imageUrl: string,
  userId?: string
): Promise<VisionAnalysisResult> => {
  return await callEdgeFunction<VisionAnalysisResult>('vision-analysis', {
    imageUrl,
    userId,
  });
};

export const analyzeImageBase64WithVision = async (
  imageBase64: string,
  userId?: string
): Promise<VisionAnalysisResult> => {
  return callEdgeFunction<VisionAnalysisResult>('vision-analysis', {
    imageBase64,
    userId,
  });
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
  return callEdgeFunction<PromptCompilerResult>('prompt-compiler', {
    config,
    visionAnalysis,
    userMode,
  });
};

// =====================================================
// IMAGE GENERATION (Gemini 3 Pro)
// =====================================================
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
  return callEdgeFunction<GenerateImageResult>('generate-image', {
    imageUrl,
    compiledPrompt,
    userMode: options.userMode || 'auto',
    userId: options.userId,
    jobId: options.jobId,
    outputType: options.outputType || 'preview_watermark',
  });
};

// =====================================================
// COMPLETE FLOW (Convenience function)
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
  } = {}
): Promise<GenerateImageResult> => {
  // Step 1: Vision Analysis
  const visionResult = await analyzeImageWithVision(imageUrl, options.userId);
  if (!visionResult.success) {
    throw new Error(visionResult.error || 'Vision analysis failed');
  }
  options.onVisionComplete?.(visionResult);

  // Step 2: Compile Prompt
  const promptResult = await compilePrompt(
    config,
    visionResult.analysis,
    options.userMode
  );
  if (!promptResult.success) {
    throw new Error(promptResult.error || 'Prompt compilation failed');
  }
  options.onPromptCompiled?.(promptResult);

  // Step 3: Generate Image
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

export default {
  analyzeImageWithVision,
  analyzeImageBase64WithVision,
  compilePrompt,
  generateEnhancedImage,
  processImageComplete,
};
