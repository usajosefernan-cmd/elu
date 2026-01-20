-- RENAME LUMENS TO TOKENS
-- MIGRATION ID: 20260111_rename_lumens
-- AUTHOR: Agent Neo

BEGIN;

-- 1. Profiles Table
ALTER TABLE IF EXISTS public.profiles 
RENAME COLUMN lumens_balance TO tokens_balance;

-- 2. Beta Waitlist Table (If exists)
ALTER TABLE IF EXISTS public.beta_waitlist 
RENAME COLUMN lumens_bonus TO tokens_bonus;

-- 3. Update any views or functions if necessary (none detected in safe mode)

COMMIT;
