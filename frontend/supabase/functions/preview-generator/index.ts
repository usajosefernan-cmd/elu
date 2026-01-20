// PREVIEW-GENERATOR v2.0 (SQL-DRIVEN ARCHITECTURE)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { encode } from "https://deno.land/std@0.168.0/encoding/base64.ts"
import { decode } from "https://deno.land/x/imagescript@1.2.15/mod.ts";
import { corsHeaders } from "../_shared/cors.ts"
import { buildStandardFileName, buildStandardStoragePath } from "../_shared/storage-logic.ts"
import { buildDeepThinkPrompt, LuxConfigInput, ForensicBlueprint } from "../_shared/sqlPromptBuilder.ts"
import { getRotatedApiKey } from "../_shared/key-rotator.ts"

declare const Deno: any;

// --- 1. DEFINICIÓN DE PRESETS (SLIDER CONFIGS) ---
// En lugar de texto hardcodeado, definimos la "Intención" mediante sliders.
// El SQL Builder se encargará de traducir esto a Prompts v15.

const PRESET_ARCHETYPES = {
  'forensic_v32': {
    label: 'Forensic Restore',
    config: { photoScaler: { definition: 10, noise_reduction: 10 }, lightScaler: { tone_recovery: 9, identity_weight: 10 }, styleScaler: { reality_inject: 1 } }
  },
  'balanced_v32': {
    label: 'Commercial Polish',
    config: { photoScaler: { definition: 5 }, lightScaler: { tone_recovery: 5 }, styleScaler: { reality_inject: 5 } }
  },
  'cinematic_v32': {
    label: 'Teal & Orange',
    config: { lightScaler: { lighting_style: 'neon_noir_v32' }, styleScaler: { reality_inject: 8, guidance_scale: 12.0 } }
  },
  'rembrandt_v32': {
    label: 'Classic Portrait',
    config: { lightScaler: { lighting_style: 'rembrandt_v32' }, styleScaler: { reality_inject: 6 } }
  },
  'fashion_v32': {
    label: 'High Editorial',
    config: { lightScaler: { lighting_style: 'commercial_beauty_v32' }, styleScaler: { reality_inject: 9 } }
  },
  'reality_warp_v32': {
    label: 'Dreamlike',
    config: { styleScaler: { reality_inject: 10, guidance_scale: 15.0 } }
  }
};

async function getUsername(supabase: any, userId: string): Promise<string> {
  try {
    const { data: profile } = await supabase.from('profiles').select('username').eq('id', userId).single();
    if (profile?.username) return profile.username;
  } catch (e) { }
  return userId.substring(0, 8);
}

function getGeminiAspectRatio(width: number, height: number): string {
  const ratio = width / height;
  const ratios: Record<string, number> = { "1:1": 1, "3:4": 0.75, "4:3": 1.33, "9:16": 0.5625, "16:9": 1.7778 };
  return Object.keys(ratios).reduce((a, b) => Math.abs(ratios[a] - ratio) < Math.abs(ratios[b] - ratio) ? a : b);
}

// --- 2. VISION DIAGNOSIS (ALIGNED WITH DB TRIGGERS) ---
async function diagnoseImage(apiKey: string, base64Image: string, mimeType: string): Promise<ForensicBlueprint> {
  try {
    const url = `https://api.laozhang.ai/v1/chat/completions`;
    const payload = {
      model: 'gemini-1.5-flash',
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text", text: `PROTOCOL: EDGEVISION v2.5 FORENSIC ANALYSIS.
Output STRICT JSON matching this schema for SQL Trigger compatibility:

{
  "classification": {
    "primary": "HUMAN | FOOD | ARCH | PET | PRODUCT | LANDSCAPE",
    "sub_category": "string"
  },
  "technical_audit": {
    "signal": "Underexposed_Clipped_Shadows | Overexposed | Perfect | Low_Contrast",
    "distortion": "Minor_Barrel | Severe_Pincushion | None"
  },
  "materiality_map": {
    "semantic_segments": [
      { "label": "SKIN", "detected_attribute": "HIGH" },
      { "label": "FABRIC_SILK", "detected_attribute": "MODERATE" },
      { "label": "IRIS", "detected_attribute": "WET" },
      { "label": "METAL", "detected_attribute": "POLISHED" }
    ]
  },
  "restoration_priority": {
    "strategy": "Motion_Blur | Focus_Miss | Clean"
  }
}` },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } }
          ]
        }
      ],
      response_format: { type: "json_object" }
    };

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) throw new Error(`API ${resp.status}`);
    const data = await resp.json();
    const cleanText = data.choices?.[0]?.message?.content.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);

  } catch (e) {
    console.error("Diagnosis Failed:", e);
    // Fallback safe Blueprint
    return {
      classification: { primary: 'HUMAN', sub_category: 'General' },
      technical_audit: { signal: 'Perfect', distortion: 'None' },
      materiality_map: { semantic_segments: [] }
    } as ForensicBlueprint;
  }
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

// --- 3. MAIN SERVER ---

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { imageUrl, settings, debug_userId } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // AUTH CHECK
    let userId = debug_userId;
    if (!userId) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) userId = user.id;
      }
    }
    if (!userId) throw new Error("Unauthorized");

    const username = await getUsername(supabase, userId);

    // STREAM SETUP
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const send = (data: any) => controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));

        try {
          send({ type: 'info', message: `Initializing SQL-Driven Engine for ${username}...` });

          // 1. DOWNLOAD & PREP
          const imgResp = await fetch(imageUrl);
          const imgBlob = await imgResp.blob();
          const arrayBuffer = await imgBlob.arrayBuffer();
          const base64Image = encode(arrayBuffer);
          const img = await decode(new Uint8Array(arrayBuffer));
          const ratio = getGeminiAspectRatio(img.width, img.height);

          // 2. VISION ANALYSIS (THE TRIGGER)
          const visionApiKey = await getRotatedApiKey(supabase); // Use same pool
          send({ type: 'info', message: 'Running EdgeVision Forensic Analysis...' });
          const visualAudit = await diagnoseImage(visionApiKey, base64Image, imgBlob.type);

          send({ type: 'vision_result', data: visualAudit });

          // 3. DEFINE PLAN
          let executionPlan: Array<{ id: string, config: LuxConfigInput, label: string }> = [];

          if (settings.mode === 'AUTO' || !settings.mode) {
            // Use Presets
            executionPlan = Object.entries(PRESET_ARCHETYPES).map(([key, val]) => ({
              id: key,
              config: val.config,
              label: val.label
            }));
          } else {
            // PRO Mode: Use user settings for all 6 variations (maybe slight randomization if needed)
            for (let i = 0; i < 6; i++) {
              executionPlan.push({
                id: `custom_var_${i}`,
                config: settings, // User manual config
                label: `Custom ${i + 1}`
              });
            }
          }

          send({ type: 'session_start', count: executionPlan.length });

          // 4. GENERATE
          const generateVariant = async (role: any) => {
            const startTime = Date.now();
            try {
              // A. BUILD PROMPT via SQL
              const runKey = await getRotatedApiKey(supabase);
              const builderResult = await buildDeepThinkPrompt(supabase, role.config, visualAudit);

              // B. CALL GEMINI
              const url = `https://api.laozhang.ai/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${runKey}`;
              const payload = {
                contents: [{
                  parts: [
                    { inline_data: { mime_type: imgBlob.type, data: base64Image } },
                    { text: builderResult.positive_prompt + "\n\nNEGATIVE PROMPT: " + builderResult.negative_prompt }
                  ]
                }],
                generationConfig: {
                  responseModalities: ["IMAGE"],
                  imageConfig: { imageSize: "4K", aspectRatio: ratio }
                } // Safety settings omitted for brevity
              };

              const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
              if (!resp.ok) throw new Error(`Model Error ${resp.status}`);

              const data = await resp.json();
              const imageB64 = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
              if (!imageB64) throw new Error("No image generated");

              // C. UPLOAD
              const rawBytes = base64ToUint8Array(imageB64);
              const fileName = buildStandardFileName(imageUrl, 'PREVIEW', role.id, 'vSql', 'png');
              const path = buildStandardStoragePath(userId, 'LUX_SCALER', 'temp_gen_id', fileName); // Simplified for refactor

              await supabase.storage.from('lux-storage').upload(path, rawBytes, { contentType: 'image/png', upsert: true });
              const { data: urlData } = supabase.storage.from('lux-storage').getPublicUrl(path);

              // D. RESPOND
              send({
                type: 'variation',
                data: {
                  id: crypto.randomUUID(),
                  image_path: urlData.publicUrl,
                  style_id: role.id,
                  type: 'preview_1k',
                  prompt_payload: builderResult, // Send full builder result for telemetry
                  elapsed: `${((Date.now() - startTime) / 1000).toFixed(1)}s`
                }
              });

            } catch (e: any) {
              send({ type: 'variation_error', id: role.id, error: e.message });
            }
          };

          // Execute plan
          const BATCH_SIZE = 6;
          await Promise.allSettled(executionPlan.slice(0, BATCH_SIZE).map(generateVariant));

          send({ type: 'done' });
          controller.close();

        } catch (e: any) {
          send({ type: 'error', message: e.message });
          controller.close();
        }
      }
    });

    return new Response(stream, { headers: { ...corsHeaders, 'Content-Type': 'application/x-ndjson' } });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});
