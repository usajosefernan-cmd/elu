-- LUXSCALER BETA WAITLIST SCHEMA UPDATE
-- Adds columns for access code generation and lumens bonus

-- Add missing columns to beta_waitlist
ALTER TABLE public.beta_waitlist ADD COLUMN IF NOT EXISTS access_code TEXT;
ALTER TABLE public.beta_waitlist ADD COLUMN IF NOT EXISTS lumens_bonus INTEGER DEFAULT 100;
ALTER TABLE public.beta_waitlist ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.beta_waitlist ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ;

-- Create index for fast code lookup
CREATE INDEX IF NOT EXISTS idx_beta_waitlist_access_code ON public.beta_waitlist(access_code);
CREATE INDEX IF NOT EXISTS idx_beta_waitlist_status ON public.beta_waitlist(status);

-- Ensure profiles table has lumen_balance column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lumen_balance INTEGER DEFAULT 50;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_beta_user BOOLEAN DEFAULT FALSE;

-- Create or replace the add_lumens RPC function
CREATE OR REPLACE FUNCTION public.add_lumens(user_id UUID, amount INTEGER, description TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.profiles 
    SET lumen_balance = COALESCE(lumen_balance, 0) + amount
    WHERE id = user_id;
    
    -- Log transaction
    INSERT INTO public.lumen_transactions (user_id, amount, description, type, created_at)
    VALUES (user_id, amount, description, 'credit', NOW());
    
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the deduct_lumens RPC function
CREATE OR REPLACE FUNCTION public.deduct_lumens(user_id UUID, amount INTEGER, description TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    current_balance INTEGER;
BEGIN
    SELECT lumen_balance INTO current_balance FROM public.profiles WHERE id = user_id;
    
    IF current_balance IS NULL OR current_balance < amount THEN
        RETURN FALSE; -- Insufficient funds
    END IF;
    
    UPDATE public.profiles 
    SET lumen_balance = lumen_balance - amount
    WHERE id = user_id;
    
    -- Log transaction
    INSERT INTO public.lumen_transactions (user_id, amount, description, type, created_at)
    VALUES (user_id, -amount, description, 'debit', NOW());
    
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create lumen_transactions table if not exists
CREATE TABLE IF NOT EXISTS public.lumen_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('credit', 'debit')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for transaction history
CREATE INDEX IF NOT EXISTS idx_lumen_transactions_user ON public.lumen_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_lumen_transactions_date ON public.lumen_transactions(created_at DESC);

-- Enable RLS on lumen_transactions
ALTER TABLE public.lumen_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can see their own transactions
CREATE POLICY IF NOT EXISTS "Users can view own transactions" 
ON public.lumen_transactions FOR SELECT 
USING (auth.uid() = user_id);

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.add_lumens TO authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_lumens TO authenticated;
