import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { GoogleGenAI } from "npm:@google/genai"
import { encode } from "https://deno.land/std@0.168.0/encoding/base64.ts"
import { decode } from "https://deno.land/x/imagescript@1.2.15/mod.ts";

import { corsHeaders } from "../_shared/cors.ts"
import { buildDeepThinkPrompt, fetchDynamicStyles } from "../_shared/lux-logic.ts"
import { getRotatedApiKey } from "../_shared/key-rotator.ts"

declare const Deno: any;

// Helper to determine closest aspect ratio string (Synced with preview-generator v99)
// Helper to determine closest aspect ratio string (Synced with preview-generator v100)
function getGeminiAspectRatio(width: number, height: number): string {
  if (!width || !height) return "1:1";

  const ratio = width / height;
  const ratios: Record<string, number> = {
    "1:1": 1,
    "3:4": 0.75,
    "4:3": 1.33,
    "9:16": 0.5625,
    "16:9": 1.7778,
    "2:3": 0.6667,
    "3:2": 1.5,
    "21:9": 2.3333
  };

  // Find closest ratio by minimizing difference
  const bestRatio = Object.keys(ratios).reduce((a, b) =>
    Math.abs(ratios[a] - ratio) < Math.abs(ratios[b] - ratio) ? a : b
  );

  return bestRatio;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { variationId, settings } = await req.json()

    // Auth & Setup
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // --- KEY ROTATION ---
    const currentApiKey = await getRotatedApiKey(supabase);
    const ai = new GoogleGenAI({ apiKey: currentApiKey });

    const authHeader = req.headers.get('Authorization')!
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (!user) throw new Error('Unauthorized');

    // Get Data & Previous Analysis
    const { data: variation } = await supabase.from('variations').select(`*, generations(semantic_analysis, original_image_path)`).eq('id', variationId).single();
    if (!variation) throw new Error("Variation not found");

    // NEW: FETCH DYNAMIC STYLES (Consistency Check)
    const dynamicLibraries = await fetchDynamicStyles(supabase);

    // Get Input Image
    const imgResp = await fetch(variation.image_path);
    if (!imgResp.ok) throw new Error("Failed to fetch image source");
    const imgBlob = await imgResp.blob();
    const arrayBuffer = await imgBlob.arrayBuffer();
    const base64Input = encode(arrayBuffer);

    // SYNC WITH ANALYSIS DIMS & FALLBACK
    const analysis = variation.generations.semantic_analysis || {};
    let realWidth = 0;
    let realHeight = 0;

    try {
      const u8Array = new Uint8Array(arrayBuffer);
      const decodedImage = await decode(u8Array);
      realWidth = decodedImage.width;
      realHeight = decodedImage.height;
    } catch (e) {
      console.warn("[Master] ImageScript decode failed, using analysis data:", e);
      realWidth = analysis.width || 1024;
      realHeight = analysis.height || 1024;
    }

    const width = realWidth || 1024;
    const height = realHeight || 1024;
    analysis.width = width;
    analysis.height = height;
    // Force Ratio Match using the standard ratios
    const ratio = (width > 0 && height > 0) ? getGeminiAspectRatio(width, height) : "1:1";

    // SYNC with lux-logic request
    analysis.targetRatio = ratio;

    console.log(`[Master Sculptor] Target Ratio: ${ratio} | Context: ${width}x${height}`);

    // --- MASTER PROMPT CONSTRUCTION ---
    const masterPrompt = buildDeepThinkPrompt(
      analysis,
      variation.style_id,
      settings,
      'MASTER',
      dynamicLibraries
    );

    // Call Gemini 3 Pro with Thinking Budget
    const resp = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: [
        {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Input } },
            { text: masterPrompt }
          ]
        }
      ],
      config: {
        imageGenerationConfig: { // OFFICIAL API FIELD
          imageSize: "4K",
          aspectRatio: ratio
        },
        thinkingConfig: { thinkingBudget: 4096 },
        seed: variation.seed
      }
    });

    const parts = resp.candidates?.[0]?.content?.parts;
    const imgPart = parts?.find((p: any) => p.inlineData);
    const genData = imgPart?.inlineData?.data;

    if (!genData) {
      const textPart = parts?.find((p: any) => p.text)?.text;
      throw new Error(`Generative failure: ${textPart || 'No data returned'}`);
    }

    const binary = atob(genData);
    const rawArray = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) rawArray[i] = binary.charCodeAt(i);

    const fileName = `${user.id}/${variation.generation_id}/${variation.style_id}_MASTER_${Date.now()}.jpeg`;

    await supabase.storage.from('lux-storage').upload(fileName, rawArray, { contentType: 'image/jpeg' });
    const publicUrl = supabase.storage.from('lux-storage').getPublicUrl(fileName).data.publicUrl;

    const { data: record } = await supabase.from('variations').insert({
      generation_id: variation.generation_id,
      type: 'master_4k',
      style_id: variation.style_id,
      image_path: publicUrl,
      prompt_payload: { prompt_used: masterPrompt, seed_used: variation.seed, aspect_ratio: ratio },
      seed: variation.seed,
      engineering_report: {
        opticalStack: "Clinical Divine / Phase One IQ4",
        edge_logs: { function: "master-sculptor", mode: "Deep Think", compression: 'WebP-90', size: '4K', version: 'v99-sync' }
      }
    }).select().single();

    return new Response(JSON.stringify({ variation: record }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error: any) {
    console.error("Master Sculptor Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
})
