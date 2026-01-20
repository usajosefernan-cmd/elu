import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile } from '../types';

// Explicit connection using environment variables
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase Variables in .env configuration");
}

// Initialize Supabase Client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- HELPER: USERNAME GENERATOR ---
export const generateAvailableUsername = async (baseName: string): Promise<string> => {
    // 1. Sanitize baseName (remove spaces, special chars, lowercase)
    let clean = baseName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (clean.length < 3) clean = 'user';

    let candidate = `@${clean}`;
    let isAvailable = false;
    let attempts = 0;

    while (!isAvailable && attempts < 5) {
        // Check uniqueness in profiles table
        const { data } = await supabase
            .from('user_profiles')
            .select('username')
            .eq('username', candidate)
            .single();

        if (!data) {
            isAvailable = true;
        } else {
            // Append random digits if taken
            const randomSuffix = Math.floor(Math.random() * 10000);
            candidate = `@${clean}${randomSuffix}`;
            attempts++;
        }
    }

    // Fallback if loop fails
    if (!isAvailable) candidate = `@${clean}${Date.now().toString().slice(-6)}`;

    return candidate;
};

// --- BETA AUTH LOGIC ---

export const authenticateWithBetaCode = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();

    // 1. First check if code exists in beta_waitlist (dynamic codes)
    const { data: waitlistEntry } = await supabase
        .from('beta_waitlist')
        .select('*')
        .eq('access_code', cleanCode)
        .eq('status', 'approved')
        .single();

    // 2. If not found in DB, check hardcoded fallback codes
    const VALID_BETA_CODES = ['LUX-BETA', 'LUX-2025', 'INVITADO', '1111', 'ADMIN-KEY'];
    const isHardcodedValid = VALID_BETA_CODES.includes(cleanCode);

    if (!waitlistEntry && !isHardcodedValid) {
        throw new Error("Invalid Access Code");
    }

    // 3. Generate Deterministic Credentials
    const syntheticEmail = waitlistEntry?.email || `beta_user_${cleanCode}@luxifier.local`;
    const syntheticPassword = `lux-persistent-pass-${cleanCode}-2026`;

    // 4. Try to Sign In
    const { data: signInData, error: signInError } = await (supabase as any).auth.signInWithPassword({
        email: syntheticEmail,
        password: syntheticPassword
    });

    if (!signInError && signInData.user) {
        return signInData;
    }

    // 5. If Sign In fails, Sign Up with Auto Username
    const baseName = waitlistEntry?.name || `beta${cleanCode}`;
    const autoUsername = await generateAvailableUsername(baseName);

    const { data: signUpData, error: signUpError } = await (supabase as any).auth.signUp({
        email: syntheticEmail,
        password: syntheticPassword,
        options: {
            data: {
                full_name: waitlistEntry?.name || `Beta Operator ${cleanCode}`,
                username: autoUsername,
                is_beta_user: true
            },
        },
    });

    if (signUpError) throw signUpError;

    // 6. If signup successful and has tokens bonus, add to profile
    if (signUpData?.user && waitlistEntry?.tokens_bonus) {
        // Update profile with tokens bonus (after trigger creates profile row)
        setTimeout(async () => {
            await supabase
                .from('user_profiles')
                .update({
                    tokens_balance: waitlistEntry.tokens_bonus
                })
                .eq('id', signUpData.user.id);
        }, 1000); // Delay to allow trigger to create profile first
    }

    // 7. Mark waitlist entry as used
    if (waitlistEntry) {
        await supabase
            .from('beta_waitlist')
            .update({ status: 'used', used_at: new Date().toISOString() })
            .eq('id', waitlistEntry.id);
    }

    return signUpData;
};

// --- STANDARD AUTH (LEGACY / ADMIN) ---

export const signUpUser = async (email: string, password: string, fullName: string, requestedUsername?: string) => {

    // Validate or Auto-assign Username
    let finalUsername = requestedUsername;
    if (!finalUsername) {
        finalUsername = await generateAvailableUsername(fullName || email.split('@')[0]);
    } else {
        // Enforce @ prefix
        if (!finalUsername.startsWith('@')) finalUsername = `@${finalUsername}`;

        // Check availability
        const { data: existing } = await supabase.from('user_profiles').select('username').eq('username', finalUsername).single();
        if (existing) {
            // If taken, try to find a close variant
            finalUsername = await generateAvailableUsername(finalUsername.replace('@', ''));
        }
    }

    const { data, error } = await (supabase as any).auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                username: finalUsername
            },
        },
    });

    if (error) throw error;
    return data;
};

export const signInUser = async (email: string, password: string) => {
    const { data, error } = await (supabase as any).auth.signInWithPassword({
        email,
        password,
    });

    if (error) throw error;
    return data;
};

export const signOutUser = async () => {
    await (supabase as any).auth.signOut();
};

export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
    const { data: { user } } = await (supabase as any).auth.getUser();
    if (!user) return null;

    // Fetch extended profile data
    const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error || !profile) return null;

    // Map database fields to frontend UserProfile type
    const dbProfile = profile as any;
    
    // Determine admin status: user_mode === 'prolux' means admin
    const isAdmin = dbProfile.user_mode === 'prolux';
    
    // Map user_mode to profile_type
    const profileType = dbProfile.user_mode || 'auto';

    return {
        id: dbProfile.id,
        email: dbProfile.email || user.email,
        username: dbProfile.username || '',
        full_name: dbProfile.full_name || user.user_metadata?.full_name || '',
        tokens: dbProfile.tokens_balance || 50,
        tokens_balance: dbProfile.tokens_balance || 50,
        is_admin: isAdmin,
        subscription_tier: isAdmin ? 'pro' : 'free',
        subscription_status: 'active',
        // v28 Fields - mapped from existing DB structure
        profile_type: profileType as any,
        total_tokens_purchased: dbProfile.tokens_balance || 0,
        total_generations: 0
    } as UserProfile;
};

export const getSupabaseClient = () => supabase as any;


// =====================================================
// TOKEN MANAGEMENT FUNCTIONS
// =====================================================

// Token costs (hardcoded until DB tables are created)
const TOKEN_COSTS: Record<string, number> = {
    'preview_watermark': 10,
    'preview_clean': 15,
    'master_4k': 50,
    'master_8k': 100
};

export const spendTokens = async (actionKey: string, amount?: number): Promise<boolean> => {
    const { data: { user } } = await (supabase as any).auth.getUser();
    if (!user) return false;

    // Get current balance
    const { data: profile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('tokens_balance')
        .eq('id', user.id)
        .single();

    if (fetchError || !profile) return false;

    const currentBalance = (profile as any).tokens_balance || 0;
    const cost = amount || TOKEN_COSTS[actionKey] || 10;

    if (currentBalance < cost) return false;

    // Deduct tokens
    const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ tokens_balance: currentBalance - cost })
        .eq('id', user.id);

    if (updateError) {
        console.error('Error spending tokens:', updateError);
        return false;
    }

    return true;
};

export const addTokens = async (amount: number): Promise<boolean> => {
    const { data: { user } } = await (supabase as any).auth.getUser();
    if (!user) return false;

    // Get current balance
    const { data: profile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('tokens_balance')
        .eq('id', user.id)
        .single();

    if (fetchError || !profile) return false;

    const currentBalance = (profile as any).tokens_balance || 0;

    // Add tokens
    const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ tokens_balance: currentBalance + amount })
        .eq('id', user.id);

    if (updateError) {
        console.error('Error adding tokens:', updateError);
        return false;
    }

    return true;
};

export const getTokenBalance = async (): Promise<number> => {
    const { data: { user } } = await (supabase as any).auth.getUser();
    if (!user) return 0;

    const { data, error } = await supabase
        .from('user_profiles')
        .select('tokens_balance')
        .eq('id', user.id)
        .single();

    if (error || !data) return 0;
    return (data as any).tokens_balance || 0;
};

// Billing tiers (hardcoded until DB tables are created)
export const getBillingTiers = async () => {
    return [
        { tier_key: 'starter', name: 'Starter', price_eur: 1.99, tokens_included: 200, unlocks_profile: 'auto' },
        { tier_key: 'creator', name: 'Creator', price_eur: 9.99, tokens_included: 1200, unlocks_profile: 'user' },
        { tier_key: 'pro', name: 'Pro', price_eur: 29.99, tokens_included: 4000, unlocks_profile: 'pro' },
        { tier_key: 'studio', name: 'Studio', price_eur: 99.99, tokens_included: 15000, unlocks_profile: 'prolux' }
    ];
};

// Token costs (hardcoded until DB tables are created)
export const getTokenCosts = async () => {
    return [
        { action_key: 'preview_watermark', tokens_cost: 10, description: 'Preview con marca de agua' },
        { action_key: 'preview_clean', tokens_cost: 15, description: 'Preview sin marca' },
        { action_key: 'master_4k', tokens_cost: 50, description: 'Master 4K' },
        { action_key: 'master_8k', tokens_cost: 100, description: 'Master 8K' }
    ];
};
