import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { encode } from "https://deno.land/std@0.168.0/encoding/base64.ts"
import { getRotatedApiKey } from "../_shared/key-rotator.ts"

declare const Deno: any;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { imageUrl } = await req.json()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const imgResp = await fetch(imageUrl);
    if (!imgResp.ok) throw new Error(`Failed to fetch image: ${imgResp.statusText}`);

    const imgBlob = await imgResp.blob();
    const arrayBuffer = await imgBlob.arrayBuffer();
    const base64Image = encode(arrayBuffer);

    // KEY ROTATION: SHARED MODULE (Secrets Only)
    const apiKey = await getRotatedApiKey(supabase);

    // SLC-R V2.0 FORENSIC PROTOCOL
    const prompt = `ROLE: Forensic_Photo_Editor. TASK: Analyze image for reconstruction.
    OUTPUT JSON: { "classification": { "master_category": "HUMAN|FOOD|ARCH|PET|PRODUCT|LANDSCAPE|NOISE", "sub_type": "string", "confidence_score": 0-100 }, "technical_audit": { "exposure_bias": "string", "focus_integrity": "string", "slcr_forensic_tags": [] }, "quality_check": { "is_usable": boolean, "usability_score": 0-100 } }`;

    // LaoZhang API: OpenAI-compatible endpoint for vision analysis
    const url = `https://api.laozhang.ai/v1/chat/completions`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gemini-1.5-flash', // STABLE FLASH
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${imgBlob.type || 'image/jpeg'};base64,${base64Image}` } },
            { type: 'text', text: prompt }
          ]
        }],
        response_format: { type: 'json_object' },
        temperature: 0.0
      })
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(errText);
    }
    const data = await resp.json();
    let jsonText = data.choices?.[0]?.message?.content || "";
    jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();

    if (!jsonText) throw new Error("Empty response from Vision AI");

    const analysis = JSON.parse(jsonText);

    return new Response(JSON.stringify(analysis), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error: any) {
    console.error("Vision Analysis Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }
})
