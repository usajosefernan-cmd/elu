
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

declare const Deno: any;

export async function getRotatedApiKey(supabaseClient: any): Promise<string> {
    // PURE SECRETS MODE (User Request: "Only use Supabase Secrets")
    // We ignore the DB pool completely to avoid confusion with dead keys.

    const envKeys = [
        Deno.env.get('LAOZHANG_API_KEY'),
        // Legacy/Backup Keys (Commented out to force migration to LaoZhang)
        // Deno.env.get('GEMINI_API_KEY'),
    ].filter(k => k && k.length > 10);

    if (envKeys.length === 0) {
        throw new Error("Fatal: No API Key available in Supabase Secrets (checked GEMINI_API_KEY..._5).");
    }

    // Random Selection for connection pooling/load balancing
    const randomKey = envKeys[Math.floor(Math.random() * envKeys.length)];
    console.log(`[KeyRotator] Using Secret Key (Pool Size: ${envKeys.length})`);
    return randomKey;
}

export async function banApiKey(supabaseClient: any, keyValue: string) {
    if (!keyValue) return;

    console.error(`[KeyRotator] 🚨 BANNING COMPROMISED KEY: ${keyValue.substring(0, 8)}...`);

    // Try to disable in DB
    const { error } = await supabaseClient
        .from('api_keys_pool')
        .update({
            is_active: false,
            notes: `AUTO-BANNED: Leaked/403 Error at ${new Date().toISOString()}`
        })
        .eq('key_value', keyValue);

    if (error) {
        console.warn("[KeyRotator] Could not ban key in DB (might be ENV key or DB error):", error.message);
    }
}
