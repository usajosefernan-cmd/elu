// LuxScaler - Edge Functions Service CORREGIDO
// Usa prompt-compiler y generate-image de Supabase

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// CORRECCIÓN: Llamar Edge Functions directamente
export const generateImageWithSliders = async (
  imageUrl: string,
  sliderConfig: any,
  options: any = {}
): Promise<any> => {
  try {
    console.log('[EdgeFunctions] 🚀 Iniciando flujo completo...');
    
    // PASO 1: Compilar prompt con Edge Function
    console.log('[EdgeFunctions] Paso 1: Compilando prompt...');
    
    const promptResponse = await fetch(`${SUPABASE_URL}/functions/v1/prompt-compiler`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sliderConfig: sliderConfig,
        mode: options.userMode || 'AUTO',
        saved_config: options.savedConfig || {}
      })
    });
    
    if (!promptResponse.ok) {
      const error = await promptResponse.text();
      throw new Error(`Prompt compilation failed: ${error}`);
    }
    
    const promptResult = await promptResponse.json();
    console.log('[EdgeFunctions] ✅ Prompt compilado');
    
    // PASO 2: Convertir imagen a base64 si es URL
    let imageBase64 = '';
    
    if (imageUrl.startsWith('data:image')) {
      imageBase64 = imageUrl.split(',')[1];
    } else {
      console.log('[EdgeFunctions] Descargando imagen...');
      const imgResponse = await fetch(imageUrl);
      const blob = await imgResponse.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(blob);
      });
      imageBase64 = base64;
    }
    
    console.log('[EdgeFunctions] Paso 2: Imagen convertida a base64');
    
    // PASO 3: Generar imagen con Edge Function
    console.log('[EdgeFunctions] Paso 3: Generando imagen 4K...');
    
    const generateResponse = await fetch(`${SUPABASE_URL}/functions/v1/generate-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: promptResult.prompt || promptResult.compiled_prompt,
        imageBase64: imageBase64,
        config: promptResult.generation_config || promptResult.config || {},
        uploadId: options.userId || 'temp-' + Date.now(),
        userId: options.userId
      })
    });
    
    if (!generateResponse.ok) {
      const error = await generateResponse.text();
      throw new Error(`Image generation failed: ${error}`);
    }
    
    const generateResult = await generateResponse.json();
    
    console.log('[EdgeFunctions] ✅ Imagen generada exitosamente');
    
    return {
      success: true,
      image_base64: generateResult.image_base64 || generateResult.imageBase64,
      preview_url: generateResult.url || generateResult.preview_url,
      metadata: {
        model: 'gemini-3-pro-image-preview',
        via: 'LaoZhang Nano Banana Pro'
      }
    };
    
  } catch (error: any) {
    console.error('[EdgeFunctions] ❌ Error:', error);
    return {
      success: false,
      error: error.message || 'Generation failed'
    };
  }
};

// Exportar otras funciones necesarias
export const compilePromptFromSliders = async (sliderConfig: any, options: any = {}) => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/prompt-compiler`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sliderConfig, ...options })
  });
  
  return await response.json();
};
