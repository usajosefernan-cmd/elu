
import { getSupabaseClient } from './authService';

const supabase = getSupabaseClient();

export const getBalance = async (): Promise<number> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data, error } = await supabase
        .from('profiles')
        .select('tokens_balance, is_admin')
        .eq('id', user.id)
        .single();

    if (error) return 0;

    // ADMIN GOD MODE: Infinite Resources
    if (data.is_admin) return 999999;

    return data.tokens_balance || 0;
};

// RPC Call to deduct tokens atomically on the server
export const spendTokens = async (amount: number, description: string): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Check if admin first to bypass payment logic
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    // ADMIN GOD MODE: Bypass payment, always return success
    if (profile?.is_admin) {
        console.log("Admin Bypass: Payment skipped for", description);
        return true;
    }

    const { data, error } = await supabase.rpc('deduct_tokens', {
        user_id: user.id,
        amount: amount,
        description: description
    });

    if (error) {
        console.error("Payment failed:", error);
        throw new Error(error.message);
    }

    return data as boolean; // Returns true if success, false if insufficient funds
};

// RPC Call to add tokens (Simulating Stripe Webhook for testing)
export const simulatePurchase = async (packId: string): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    let amount = 0;
    let desc = '';

    // NEW PRICING: 1 Token = €1
    switch (packId) {
        case 'try': amount = 3; desc = 'Pack Try (3 Tokens)'; break;
        case 'basic': amount = 10; desc = 'Pack Basic (10 Tokens)'; break;
        case 'plus': amount = 25; desc = 'Pack Plus (25 Tokens)'; break;
        // Suscripciones
        case 'lite': amount = 15; desc = 'Lite Monthly (15 Tokens)'; break;
        case 'pro': amount = 40; desc = 'Pro Monthly (40 Tokens)'; break;
        case 'studio': amount = 100; desc = 'Studio Monthly (100 Tokens)'; break;
        // Legacy
        case 'starter': amount = 5; desc = 'Pack Starter (5 Tokens)'; break;
    }

    const { error } = await supabase.rpc('add_tokens', {
        user_id: user.id,
        amount: amount,
        description: desc
    });

    if (error) throw error;
    return true;
};

// Grant bonus tokens to a user (for beta, promotions, etc.)
export const grantBonusTokens = async (userId: string, amount: number, reason: string): Promise<boolean> => {
    const { error } = await supabase.rpc('add_tokens', {
        user_id: userId,
        amount: amount,
        description: `Bonus: ${reason}`
    });

    if (error) {
        console.error("Grant bonus failed:", error);
        return false;
    }
    return true;
};

// Check if user has enough tokens for an operation
export const canAfford = async (amount: number): Promise<boolean> => {
    const balance = await getBalance();
    return balance >= amount;
};

// Token costs for different operations
export const TOKEN_COSTS = {
    PREVIEW: 10,      // Vista previa AI
    MASTER_4K: 50,    // Master 4K profesional
    MASTER_8K: 100,   // Master 8K cine/print
} as const;

// Legacy exports for backwards compatibility
export const LUMENS_COSTS = TOKEN_COSTS;
export const spendLumens = spendTokens;
export const grantBonusLumens = grantBonusTokens;
