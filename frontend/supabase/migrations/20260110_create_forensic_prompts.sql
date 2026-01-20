-- MIGRATION: 20260110_create_forensic_prompts_and_fix_flow.sql
-- PURPOSE: Cloud persistence for Forensic Lab prompts and ensuring RLS access for Edge Functions.

-- 1. Create table for prompts if not exists
CREATE TABLE IF NOT EXISTS public.forensic_prompts (
    strategy_id TEXT PRIMARY KEY,
    prompt_text TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Insert Default Prompts (Seed Data)
INSERT INTO public.forensic_prompts (strategy_id, prompt_text)
VALUES
    ('sora_forensic', 'Use your advanced computer vision capabilities to reconstruct this image. Fix all optical aberrations, motion blur, and compression artifacts. Maintain the exact facial identity and scene composition. Output a high-fidelity restoration.'),
    ('seedream_forensic', 'Use SeeDream 4.0 forensic capabilities. Restore valid pixel data from noise. Keep 1:1 aspect ratio.'),
    ('nano_banana_pro', 'Professional forensic restoration and native 4K remastering. Surgical reconstruction of physical damage (tears, scratches). Razor-sharp output with maximum resolving power. Strictly preserve identity.'),
    ('nano_banana', 'Quick preview enhancement. Fix exposure and basic sharpness. Fast turnaround.')
ON CONFLICT (strategy_id) DO NOTHING;

-- 3. Enable RLS (Row Level Security)
ALTER TABLE public.forensic_prompts ENABLE ROW LEVEL SECURITY;

-- 4. Policies (Allow Authenticated Users FULL access for now - Lab is Admin tool)
CREATE POLICY "Enable all access for authenticated users" ON public.forensic_prompts
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 5. Grant Access to Service Role (for Edge Functions)
GRANT ALL ON public.forensic_prompts TO service_role;
GRANT ALL ON public.forensic_prompts TO anon; -- Allow anon for now if dev environment uses anon key
