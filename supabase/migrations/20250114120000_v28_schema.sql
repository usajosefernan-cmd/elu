-- LuxScaler v28.0 Database Schema (THE TRUTH)
-- Run this in Supabase SQL Editor

-- 1. Profiles & Config
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    user_mode TEXT NOT NULL CHECK (user_mode IN ('auto', 'user', 'pro', 'prolux')),
    context_cache_enabled BOOLEAN DEFAULT FALSE,
    context_cache_token TEXT,
    context_cache_expires_at TIMESTAMPTZ,
    max_presets INT DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Semantic Mappings (The Truth for Sliders)
CREATE TABLE IF NOT EXISTS slider_semantic_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pillar_name TEXT NOT NULL,
    slider_name TEXT NOT NULL,
    instruction_off TEXT,
    instruction_low TEXT,
    instruction_med TEXT,
    instruction_high TEXT,
    instruction_force TEXT,
    conflicts_with TEXT[],
    UNIQUE(pillar_name, slider_name)
);

-- 3. Macro Definitions (For PRO mode)
CREATE TABLE IF NOT EXISTS macro_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    macro_key TEXT UNIQUE NOT NULL,
    description TEXT,
    affected_sliders JSONB NOT NULL -- { "photoscaler": { "limpieza": 10 } }
);

-- 4. Processing Jobs (Async History)
CREATE TABLE IF NOT EXISTS processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id),
    status TEXT CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    mode TEXT CHECK (mode IN ('PREVIEW', 'MASTER')),
    input_image_url TEXT,
    output_image_url TEXT,
    vision_analysis_result JSONB,
    compiled_prompt TEXT,
    logs JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Vision Cache
CREATE TABLE IF NOT EXISTS vision_analysis_cache (
    image_hash TEXT PRIMARY KEY,
    analysis_result JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Smart Presets
CREATE TABLE IF NOT EXISTS smart_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id),
    name TEXT NOT NULL,
    slider_values JSONB NOT NULL,
    locked_pillars TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Data (Initial Semantic Mappings based on v27 logic)
INSERT INTO slider_semantic_mappings (pillar_name, slider_name, instruction_high, instruction_force)
VALUES 
('photoscaler', 'limpieza_artefactos', 'Restoration mode, remove all scratches.', 'FORENSIC RESTORATION. REMOVE ALL PHYSICAL DAMAGE.'),
('lightscaler', 'contraste', 'Deep blacks, dramatic contrast.', 'CRUSHED BLACKS. HDR CONTRAST.');
