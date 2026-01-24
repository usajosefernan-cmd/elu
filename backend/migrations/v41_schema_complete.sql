-- LUXSCALER v41 COMPLETE SCHEMA
-- Ejecutar en Supabase SQL Editor

-- Nota: Este archivo contiene TODAS las tablas del sistema
-- Ver archivos separados para inserts de datos

-- 1. TIER CONFIG
CREATE TABLE IF NOT EXISTS tier_config (
    id SERIAL PRIMARY KEY,
    tier_name TEXT UNIQUE NOT NULL,
    tier_code TEXT UNIQUE NOT NULL,
    preview_tokens_monthly INT DEFAULT 0,
    refine_tokens_each INT DEFAULT 0,
    unlock_tokens_each INT DEFAULT 0,
    upscale_8k_cost_tokens INT DEFAULT 0,
    can_refine BOOLEAN DEFAULT false,
    can_upscale_8k BOOLEAN DEFAULT false,
    batch_size_limit INT DEFAULT 1,
    cost_unlock_usd DECIMAL(5, 2) DEFAULT 0,
    cost_8k_usd DECIMAL(5, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TAXONOMY DEFINITIONS  
CREATE TABLE IF NOT EXISTS taxonomy_definitions (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    category_name TEXT NOT NULL,
    category_group TEXT NOT NULL,
    visual_description TEXT NOT NULL,
    strategy TEXT NOT NULL,
    slider_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. DIAGNOSIS DEFINITIONS
CREATE TABLE IF NOT EXISTS diagnosis_definitions (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    diagnosis_name TEXT NOT NULL,
    visual_description TEXT NOT NULL,
    strategy TEXT NOT NULL,
    slider_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. SLIDER DEFINITIONS
CREATE TABLE IF NOT EXISTS slider_definitions (
    id SERIAL PRIMARY KEY,
    slider_key TEXT UNIQUE NOT NULL,
    pillar TEXT NOT NULL,
    ui_title TEXT NOT NULL,
    ui_description TEXT NOT NULL,
    instruction_off TEXT,
    instruction_low TEXT,
    instruction_med TEXT,
    instruction_high TEXT,
    instruction_force TEXT,
    auto_default INT DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. MACRO DEFINITIONS
CREATE TABLE IF NOT EXISTS macro_definitions (
    id SERIAL PRIMARY KEY,
    macro_key TEXT UNIQUE NOT NULL,
    profile_tier TEXT NOT NULL,
    pillar TEXT,
    ui_title TEXT NOT NULL,
    ui_icon TEXT,
    slave_sliders TEXT[] NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. PROFILES (Extiende auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tier TEXT DEFAULT 'AUTO',
    token_balance INT DEFAULT 100,
    monthly_limit INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. UPLOADS
CREATE TABLE IF NOT EXISTS uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    original_width INT,
    original_height INT,
    thumbnail_url TEXT,
    biopsy_urls JSONB,
    status TEXT DEFAULT 'biopsy_ready',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. ANALYSIS RESULTS
CREATE TABLE IF NOT EXISTS analysis_results (
    upload_id UUID PRIMARY KEY REFERENCES uploads(id) ON DELETE CASCADE,
    cat_code TEXT REFERENCES taxonomy_definitions(code),
    detected_defects TEXT[] DEFAULT '{}',
    ocr_data JSONB DEFAULT 'null'::jsonb,
    visual_summary TEXT,
    severity_score INT DEFAULT 5,
    auto_settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. GENERATIONS
CREATE TABLE IF NOT EXISTS generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id UUID REFERENCES uploads(id) ON DELETE CASCADE,
    prompt_used TEXT,
    config_used JSONB,
    clean_url TEXT,
    watermarked_url TEXT,
    final_url TEXT,
    is_preview BOOLEAN DEFAULT true,
    tokens_spent INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. USER PRESETS (v41)
CREATE TABLE IF NOT EXISTS user_presets_v41 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    sliders_config JSONB,
    nano_params JSONB,
    anchor_preferences JSONB,
    reference_image_url TEXT,
    prompt_text TEXT,
    thumbnail_base64 TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. USER UPLOAD WORKFLOWS
CREATE TABLE IF NOT EXISTS user_upload_workflows (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    is_async_enabled BOOLEAN DEFAULT true,
    max_previews INT DEFAULT 3,
    batch_config JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_uploads_user ON uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_upload ON generations(upload_id);
CREATE INDEX IF NOT EXISTS idx_analysis_cat ON analysis_results(cat_code);
CREATE INDEX IF NOT EXISTS idx_presets_user ON user_presets_v41(user_id);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presets_v41 ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_upload_workflows ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own data
CREATE POLICY "Users manage own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users manage own uploads" ON uploads FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users view own analysis" ON analysis_results FOR SELECT USING (upload_id IN (SELECT id FROM uploads WHERE user_id = auth.uid()));
CREATE POLICY "Users view own generations" ON generations FOR SELECT USING (upload_id IN (SELECT id FROM uploads WHERE user_id = auth.uid()));
CREATE POLICY "Users manage own presets" ON user_presets_v41 FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own workflow" ON user_upload_workflows FOR ALL USING (auth.uid() = user_id);

-- Public read for definitions
ALTER TABLE tier_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxonomy_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE slider_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE macro_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read tier_config" ON tier_config FOR SELECT USING (true);
CREATE POLICY "Public read taxonomy" ON taxonomy_definitions FOR SELECT USING (true);
CREATE POLICY "Public read diagnosis" ON diagnosis_definitions FOR SELECT USING (true);
CREATE POLICY "Public read sliders" ON slider_definitions FOR SELECT USING (true);
CREATE POLICY "Public read macros" ON macro_definitions FOR SELECT USING (true);