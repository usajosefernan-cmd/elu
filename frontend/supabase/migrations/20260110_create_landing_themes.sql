-- ============================================
-- LUXSCALER: landing_themes Table Creation
-- Execute this in Supabase SQL Editor
-- ============================================

-- Create landing_themes table for Theme Designer
CREATE TABLE IF NOT EXISTS public.landing_themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    motor_id TEXT NOT NULL UNIQUE,
    data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.landing_themes ENABLE ROW LEVEL SECURITY;

-- Allow public read access (landing page is public)
DROP POLICY IF EXISTS "Allow public read access" ON public.landing_themes;
CREATE POLICY "Allow public read access" ON public.landing_themes
    FOR SELECT USING (true);

-- Allow authenticated admin users to write
DROP POLICY IF EXISTS "Allow admin write access" ON public.landing_themes;
CREATE POLICY "Allow admin write access" ON public.landing_themes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );

-- Insert default themes matching DEFAULT_MOTORS in HeroGallery.tsx
INSERT INTO public.landing_themes (motor_id, data) VALUES
('photo', '{
    "name": "PHOTOSCALER™",
    "tagline": "The Virtual Camera",
    "desc": "Simulates high-end optics. Replaces mobile distortion with portrait telephoto physics.",
    "before": "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/pruebas_original01.webp",
    "after": "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/pruebas_original01_muestras01.jfif",
    "bgTone": "#080808",
    "accentColor": "#D4AF37"
}'::jsonb),
('style', '{
    "name": "STYLESCALER",
    "tagline": "The Color Lab",
    "desc": "Cinema-grade color science. Simulates film stocks and unifies atmosphere.",
    "before": "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/pruebas_original01.webp",
    "after": "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/pruebas_original01_muestras02.jfif",
    "bgTone": "#050505",
    "accentColor": "#D4AF37"
}'::jsonb),
('light', '{
    "name": "LIGHTSCALER",
    "tagline": "The Lighting Rig",
    "desc": "Simulates studio equipment. Adds Key, Fill, and Rim lights for professional volume.",
    "before": "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/pruebas_original01.webp",
    "after": "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/pruebas_original01_muestras03.jfif",
    "bgTone": "#080808",
    "accentColor": "#D4AF37"
}'::jsonb),
('up', '{
    "name": "UPSCALER",
    "tagline": "The Print Master",
    "desc": "Resolution enhancement. Injects plausible texture consistent with 150MP sensors.",
    "before": "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/crops/pruebas_original01crop.webp",
    "after": "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/crops/unnamed%20(2)%20(1).webp",
    "bgTone": "#050505",
    "accentColor": "#D4AF37",
    "isZoom": true
}'::jsonb)
ON CONFLICT (motor_id) DO NOTHING;
