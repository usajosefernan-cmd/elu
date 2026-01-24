/**
 * LuxScaler v41 Service
 * Servicio para interactuar con endpoints v41
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export interface BiopsyPayload {
  thumbnail_base64: string;
  center_base64: string;
  shadow_base64: string;
  detail_base64: string;
  originalWidth: number;
  originalHeight: number;
}

export interface VisionResult {
  cat_code: string;
  detected_defects: string[];
  severity_score: number;
  visual_summary: string;
  reasoning: string;
}

export interface AnalysisResponse {
  status: 'BATCH_PROCESSING' | 'REVIEW_REQUIRED';
  uploadId: string;
  analysis: VisionResult;
  auto_settings?: Record<string, any>;
  final_prescription?: Record<string, any>;
  tier?: string;
  can_refine?: boolean;
  can_upscale_8k?: boolean;
}

/**
 * Envía biopsy a Vision Orchestrator
 */
export const analyzeImage = async (
  userId: string,
  biopsyPayload: BiopsyPayload
): Promise<AnalysisResponse> => {
  const response = await fetch(`${BACKEND_URL}/api/v41/vision-orchestrator`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      biopsyUrls: biopsyPayload
    })
  });
  
  return await response.json();
};

/**
 * Compila prompt desde sliders
 */
export const compilePrompt = async (
  visionResult: VisionResult,
  sliderConfig: Record<string, number>,
  preset?: any
) => {
  const response = await fetch(`${BACKEND_URL}/api/v41/prompt-compiler`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      visionResult,
      sliderConfig,
      savedPreset: preset?.nano_params || {},
      userMode: 'pro'
    })
  });
  
  return await response.json();
};

/**
 * Genera imagen con LaoZhang
 */
export const generateImage = async (
  uploadId: string,
  prompt: string,
  config: any,
  imageBase64: string,
  preset?: any
) => {
  const response = await fetch(`${BACKEND_URL}/api/v41/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uploadId,
      prompt,
      config,
      imageBase64,
      preset
    })
  });
  
  return await response.json();
};

/**
 * Guarda preset con Smart Anchors
 */
export const savePreset = async (presetData: {
  userId: string;
  uploadId: string;
  presetName: string;
  description?: string;
  userAnchors: any;
  currentSliders: Record<string, number>;
  thumbnailBase64?: string;
}) => {
  const response = await fetch(`${BACKEND_URL}/api/v41/save-preset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(presetData)
  });
  
  return await response.json();
};

/**
 * Obtiene presets del usuario
 */
export const getUserPresets = async (userId: string) => {
  const response = await fetch(`${BACKEND_URL}/api/v41/presets/${userId}`);
  return await response.json();
};

/**
 * Flujo completo: Biopsy → Vision → Compile → Generate
 */
export const fullGenerationFlow = async (
  userId: string,
  biopsyPayload: BiopsyPayload,
  sliderConfig: Record<string, number>,
  preset?: any
) => {
  try {
    // 1. Vision analysis
    console.log('[v41Flow] Step 1: Vision analysis...');
    const analysisResult = await analyzeImage(userId, biopsyPayload);
    
    if (!analysisResult.uploadId) {
      throw new Error('Vision analysis failed');
    }
    
    // 2. Compile prompt
    console.log('[v41Flow] Step 2: Compiling prompt...');
    const compileResult = await compilePrompt(
      analysisResult.analysis,
      sliderConfig,
      preset
    );
    
    if (!compileResult.success) {
      throw new Error('Prompt compilation failed');
    }
    
    // 3. Generate
    console.log('[v41Flow] Step 3: Generating with LaoZhang...');
    const genResult = await generateImage(
      analysisResult.uploadId,
      compileResult.compiled_prompt,
      compileResult.generation_config,
      biopsyPayload.center_base64,
      preset
    );
    
    if (!genResult.success) {
      throw new Error('Generation failed');
    }
    
    console.log('[v41Flow] ✅ Complete!');
    
    return {
      success: true,
      uploadId: analysisResult.uploadId,
      imageBase64: genResult.image_base64,
      analysis: analysisResult.analysis
    };
    
  } catch (error) {
    console.error('[v41Flow] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};