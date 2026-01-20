
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenAI } from "npm:@google/genai"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    const results = [];

    // 1. GET KEYS FROM ENV
    const envKeys = [
        { source: 'ENV: GEMINI_API_KEY', key: Deno.env.get('GEMINI_API_KEY') },
        { source: 'ENV: GEMINI_API_KEY_1', key: Deno.env.get('GEMINI_API_KEY_1') },
        { source: 'ENV: GEMINI_API_KEY_2', key: Deno.env.get('GEMINI_API_KEY_2') },
    ].filter(k => k.key);

    // 2. GET KEYS FROM DB
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: dbKeys } = await supabase
        .from('api_keys_pool')
        .select('*')
        .eq('is_active', true);

    const allKeys = [
        ...envKeys,
        ...(dbKeys || []).map((k: any) => ({ source: `DB: ${k.label} (ID ${k.id})`, key: k.key_value, id: k.id }))
    ];

    results.push(`Found ${allKeys.length} keys (Env + DB) to test.`);

    // 3. TEST KEYS FOR SPECIFIC MODELS
    for (const item of allKeys) {
        if (!item.key || item.key.length < 10) {
            results.push(`❌ ${item.source}: Invalid Format`);
            continue;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: item.key });

            const resp = await ai.models.list({ pageSize: 150 });
            const modelNames = resp.models ? resp.models.map((m: any) => m.name) : [];
            let hasGemini3 = false;
            let hasImagen3 = false;

            for (const name of modelNames) {
                if (name.includes('gemini-1.5-pro')) hasGemini3 = true;
                if (name.includes('imagen-3')) hasImagen3 = true;
            }

            results.push(`✅ ${item.source}: ALIVE. Models: ${modelNames.length}`);
            results.push(`   - Has Gemini 1.5 Pro? ${hasGemini3 ? 'YES' : 'NO'}`);
            results.push(`   - Has Imagen 3? ${hasImagen3 ? 'YES' : 'NO'}`);

        } catch (e: any) {
            results.push(`💀 ${item.source}: ERROR (${e.message})`);
        }
    }

    return new Response(JSON.stringify(results, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
})
