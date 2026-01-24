-- LUXSCALER v41 - CREATE TABLES
-- Paso 1: Crear todas las tablas sin policies

-- 1. TIER CONFIG
DROP TABLE IF EXISTS tier_config CASCADE;
CREATE TABLE tier_config (
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
DROP TABLE IF EXISTS taxonomy_definitions CASCADE;
CREATE TABLE taxonomy_definitions (
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
DROP TABLE IF EXISTS diagnosis_definitions CASCADE;
CREATE TABLE diagnosis_definitions (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    diagnosis_name TEXT NOT NULL,
    visual_description TEXT NOT NULL,
    strategy TEXT NOT NULL,
    slider_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. SLIDER DEFINITIONS
DROP TABLE IF EXISTS slider_definitions CASCADE;
CREATE TABLE slider_definitions (
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
DROP TABLE IF EXISTS macro_definitions CASCADE;
CREATE TABLE macro_definitions (
    id SERIAL PRIMARY KEY,
    macro_key TEXT UNIQUE NOT NULL,
    profile_tier TEXT NOT NULL,
    pillar TEXT,
    ui_title TEXT NOT NULL,
    ui_icon TEXT,
    slave_sliders TEXT[] NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. PROFILES
DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tier TEXT DEFAULT 'AUTO',
    token_balance INT DEFAULT 100,
    monthly_limit INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. UPLOADS
DROP TABLE IF EXISTS uploads CASCADE;
CREATE TABLE uploads (
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
DROP TABLE IF EXISTS analysis_results CASCADE;
CREATE TABLE analysis_results (
    upload_id UUID PRIMARY KEY REFERENCES uploads(id) ON DELETE CASCADE,
    cat_code TEXT,
    detected_defects TEXT[] DEFAULT '{}',
    ocr_data JSONB,
    visual_summary TEXT,
    severity_score INT DEFAULT 5,
    auto_settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. GENERATIONS  
DROP TABLE IF EXISTS generations CASCADE;
CREATE TABLE generations (
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

-- 10. USER PRESETS v41
DROP TABLE IF EXISTS user_presets_v41 CASCADE;
CREATE TABLE user_presets_v41 (
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
DROP TABLE IF NOT EXISTS user_upload_workflows CASCADE;
CREATE TABLE user_upload_workflows (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    is_async_enabled BOOLEAN DEFAULT true,
    max_previews INT DEFAULT 3,
    batch_config JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_uploads_user ON uploads(user_id);
CREATE INDEX idx_generations_upload ON generations(upload_id);
CREATE INDEX idx_analysis_cat ON analysis_results(cat_code);
CREATE INDEX idx_presets_user ON user_presets_v41(user_id);