-- LuxScaler v28.0 - Complete Schema with Pricing & Profiles
-- Execute this in Supabase SQL Editor

-- =====================================================
-- 1. USER PROFILES (Extended with Tokens & Profile Type)
-- =====================================================
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS tokens_balance INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS profile_type TEXT DEFAULT 'auto' CHECK (profile_type IN ('auto', 'user', 'pro', 'prolux')),
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS total_tokens_purchased INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_generations INTEGER DEFAULT 0;

-- Set admin for specific user
UPDATE user_profiles 
SET is_admin = TRUE, profile_type = 'prolux', tokens_balance = 99999
WHERE email = 'usajosefernan@gmail.com';

-- =====================================================
-- 2. BILLING TIERS (Pricing Configuration)
-- =====================================================
CREATE TABLE IF NOT EXISTS billing_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    price_eur DECIMAL(10,2) NOT NULL,
    tokens_included INTEGER NOT NULL,
    unlocks_profile TEXT,
    features JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert pricing tiers
INSERT INTO billing_tiers (tier_key, name, price_eur, tokens_included, unlocks_profile, features) VALUES
('free', 'Registro Gratis', 0.00, 50, 'auto', '{"previews_watermark": 5, "description": "5 previews con marca de agua"}'),
('starter', 'Pack Starter', 1.99, 200, 'auto', '{"previews": 6, "masters_4k": 2, "description": "Ideal para probar"}'),
('creator', 'Pack Creator', 9.99, 1200, 'user', '{"previews": 40, "masters_4k": 10, "description": "Para creadores"}'),
('pro', 'Pack Pro', 29.99, 4000, 'pro', '{"previews": 100, "masters_4k": 40, "no_watermark": true}'),
('studio', 'Pack Studio', 99.99, 15000, 'prolux', '{"unlimited_30_days": true, "api_access": true, "batch_processing": true}')
ON CONFLICT (tier_key) DO UPDATE SET 
    price_eur = EXCLUDED.price_eur,
    tokens_included = EXCLUDED.tokens_included;

-- =====================================================
-- 3. TOKEN COSTS (Action Pricing)
-- =====================================================
CREATE TABLE IF NOT EXISTS token_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_key TEXT UNIQUE NOT NULL,
    tokens_cost INTEGER NOT NULL,
    description TEXT,
    requires_profile TEXT DEFAULT 'auto'
);

INSERT INTO token_costs (action_key, tokens_cost, description, requires_profile) VALUES
('preview_watermark', 10, 'Preview con marca de agua', 'auto'),
('preview_clean', 15, 'Preview sin marca de agua', 'user'),
('master_4k', 50, 'Master 4K exportación', 'user'),
('master_8k', 100, 'Master 8K exportación', 'pro'),
('batch_process', 200, 'Procesamiento por lotes (10 imgs)', 'prolux')
ON CONFLICT (action_key) DO UPDATE SET tokens_cost = EXCLUDED.tokens_cost;

-- =====================================================
-- 4. USER TRANSACTIONS (Token History)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    transaction_type TEXT CHECK (transaction_type IN ('purchase', 'spend', 'bonus', 'refund')),
    tokens_amount INTEGER NOT NULL,
    action_key TEXT,
    description TEXT,
    stripe_payment_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON user_transactions(user_id);

-- =====================================================
-- 5. SLIDER SEMANTIC MAPPINGS (27 Sliders)
-- =====================================================
-- Already exists, but ensure all 27 sliders are populated
INSERT INTO slider_semantic_mappings (pillar_name, slider_name, instruction_off, instruction_low, instruction_med, instruction_high, instruction_force) VALUES
-- PHOTOSCALER (1-9)
('photoscaler', 'limpieza_artefactos', '', 'Subtle noise reduction, preserve details.', 'Moderate artifact removal.', 'Aggressive noise elimination.', 'FORENSIC: Maximum artifact removal. Crystal-clear output.'),
('photoscaler', 'grano_filmico', '', 'Add subtle film grain.', 'Natural film grain texture.', 'Heavy cinematic grain.', 'FORCE: Maximum vintage grain effect.'),
('photoscaler', 'optica_nitidez', '', 'Gentle sharpening.', 'Balanced sharpness.', 'High definition clarity.', 'FORCE: Ultra-sharp, clinical precision.'),
('photoscaler', 'geometria_distorsion', '', 'Minor lens correction.', 'Standard distortion fix.', 'Full geometric correction.', 'FORCE: Perfect geometry restoration.'),
('photoscaler', 'reencuadre_ia', '', 'Subtle reframing.', 'Smart crop optimization.', 'Significant recomposition.', 'FORCE: AI-driven dramatic reframe.'),
('photoscaler', 'desenfoque_movimiento', '', 'Light motion deblur.', 'Moderate motion correction.', 'Heavy motion blur removal.', 'FORCE: Complete motion freeze.'),
('photoscaler', 'detalle_texturas', '', 'Preserve original textures.', 'Enhanced texture detail.', 'Maximum texture recovery.', 'FORCE: Hallucinate micro-textures.'),
('photoscaler', 'restauracion_danos', '', 'Minor scratch removal.', 'Moderate damage repair.', 'Heavy restoration.', 'FORCE: Complete damage reconstruction.'),
('photoscaler', 'geometria_perspectiva', '', 'Subtle perspective fix.', 'Standard keystoning.', 'Full perspective correction.', 'FORCE: Perfect architectural lines.'),
-- STYLESCALER (10-18)
('stylescaler', 'vibracion_saturacion', '', 'Subtle vibrancy boost.', 'Balanced saturation.', 'Rich, vibrant colors.', 'FORCE: Maximum color intensity.'),
('stylescaler', 'paleta_tonos', '', 'Gentle color grading.', 'Cinematic color tone.', 'Strong color stylization.', 'FORCE: Complete color transformation.'),
('stylescaler', 'dramatismo_contraste', '', 'Subtle contrast lift.', 'Balanced drama.', 'High contrast punch.', 'FORCE: Crushed blacks, blown highlights.'),
('stylescaler', 'estilo_render', '', 'Natural rendering.', 'Film-like rendering.', 'Artistic interpretation.', 'FORCE: Complete style override.'),
('stylescaler', 'antiguedad_aged_look', '', 'Hint of vintage.', 'Nostalgic feel.', 'Strong retro effect.', 'FORCE: Full vintage transformation.'),
('stylescaler', 'retoque_piel', '', 'Natural skin preservation.', 'Gentle skin smoothing.', 'Professional retouching.', 'FORCE: Flawless skin perfection.'),
('stylescaler', 'dramatismo_vigneta', '', 'Subtle vignette.', 'Moderate edge darkening.', 'Strong vignette frame.', 'FORCE: Heavy cinematic vignette.'),
('stylescaler', 'suavidad_bokeh', '', 'Natural blur.', 'Enhanced bokeh.', 'Creamy background blur.', 'FORCE: Maximum depth separation.'),
('stylescaler', 'caracter_procesa', '', 'Preserve character.', 'Enhanced personality.', 'Strong character emphasis.', 'FORCE: Dramatic character injection.'),
-- LIGHTSCALER (19-27)
('lightscaler', 'brillo_exposicion', '', 'Subtle exposure fix.', 'Balanced brightness.', 'High-key lighting.', 'FORCE: Maximum luminance control.'),
('lightscaler', 'luz_relleno', '', 'Minimal fill.', 'Balanced shadow fill.', 'Strong fill lighting.', 'FORCE: Complete shadow elimination.'),
('lightscaler', 'profundidad_sombras', '', 'Open shadows.', 'Rich shadow detail.', 'Deep shadow depth.', 'FORCE: Maximum shadow drama.'),
('lightscaler', 'iluminacion_dramatica', '', 'Natural lighting.', 'Enhanced drama.', 'Cinematic lighting.', 'FORCE: Maximum dramatic effect.'),
('lightscaler', 'tonalidad_color', '', 'Natural white balance.', 'Warm/cool shift.', 'Strong color temp.', 'FORCE: Complete temperature override.'),
('lightscaler', 'enfasis_ojos', '', 'Natural eyes.', 'Enhanced catchlights.', 'Striking eye emphasis.', 'FORCE: Maximum eye enhancement.'),
('lightscaler', 'profundidad_dof', '', 'Natural depth.', 'Enhanced DOF.', 'Strong depth effect.', 'FORCE: Maximum depth separation.'),
('lightscaler', 'luces_especulares', '', 'Natural highlights.', 'Enhanced specular.', 'Brilliant highlights.', 'FORCE: Maximum specular pop.'),
('lightscaler', 'balance_luminoso', '', 'Natural balance.', 'Optimized luminance.', 'Perfect light balance.', 'FORCE: Complete light mastery.')
ON CONFLICT (pillar_name, slider_name) DO UPDATE SET 
    instruction_high = EXCLUDED.instruction_high,
    instruction_force = EXCLUDED.instruction_force;

-- =====================================================
-- 6. MACRO DEFINITIONS (9 Macros for PRO)
-- =====================================================
INSERT INTO macro_definitions (macro_key, description, affected_sliders) VALUES
('limpieza_profunda', 'Deep Cleaning', '{"limpieza_artefactos": 10, "grano_filmico": 0, "optica_nitidez": 8, "desenfoque_movimiento": 10, "restauracion_danos": 8}'),
('restauracion_historica', 'Historical Restoration', '{"limpieza_artefactos": 10, "geometria_distorsion": 8, "restauracion_danos": 10, "geometria_perspectiva": 8}'),
('portrait_refinement', 'Portrait Refinement', '{"retoque_piel": 8, "dramatismo_vigneta": 6, "suavidad_bokeh": 8, "enfasis_ojos": 10}'),
('cinematic_tone', 'Cinematic Tone', '{"dramatismo_contraste": 8, "estilo_render": 8, "antiguedad_aged_look": 6, "dramatismo_vigneta": 7}'),
('studio_lighting', 'Studio Lighting', '{"brillo_exposicion": 7, "luz_relleno": 8, "profundidad_sombras": 8, "iluminacion_dramatica": 9}'),
('golden_hour', 'Golden Hour Glow', '{"brillo_exposicion": 7, "tonalidad_color": 8, "luces_especulares": 7}'),
('vintage_aesthetics', 'Vintage Aesthetics', '{"vibracion_saturacion": 6, "paleta_tonos": 8, "antiguedad_aged_look": 9}'),
('high_end_luxury', 'High-End Luxury', '{"limpieza_artefactos": 8, "detalle_texturas": 9, "retoque_piel": 7, "enfasis_ojos": 8, "brillo_exposicion": 7, "iluminacion_dramatica": 8}'),
('extreme_forensic', 'Extreme Forensic', '{"limpieza_artefactos": 10, "optica_nitidez": 10, "geometria_distorsion": 10, "restauracion_danos": 10, "geometria_perspectiva": 10}')
ON CONFLICT (macro_key) DO UPDATE SET affected_sliders = EXCLUDED.affected_sliders;

-- =====================================================
-- 7. USER PRESETS (Smart Presets)
-- =====================================================
-- Already created in base schema

-- =====================================================
-- 8. PROCESSING JOBS (Track Generations)
-- =====================================================
ALTER TABLE processing_jobs
ADD COLUMN IF NOT EXISTS tokens_spent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS output_type TEXT CHECK (output_type IN ('preview_watermark', 'preview_clean', 'master_4k', 'master_8k')),
ADD COLUMN IF NOT EXISTS has_watermark BOOLEAN DEFAULT TRUE;

-- =====================================================
-- 9. ANALYTICS EVENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id),
    event_type TEXT NOT NULL,
    event_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);

-- =====================================================
-- 10. FUNCTIONS: Token Management
-- =====================================================

-- Function to spend tokens
CREATE OR REPLACE FUNCTION spend_tokens(
    p_user_id UUID,
    p_action_key TEXT,
    p_description TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_cost INTEGER;
    v_balance INTEGER;
BEGIN
    -- Get cost for action
    SELECT tokens_cost INTO v_cost FROM token_costs WHERE action_key = p_action_key;
    IF v_cost IS NULL THEN
        RAISE EXCEPTION 'Unknown action: %', p_action_key;
    END IF;
    
    -- Check balance
    SELECT tokens_balance INTO v_balance FROM user_profiles WHERE id = p_user_id;
    IF v_balance < v_cost THEN
        RETURN FALSE;
    END IF;
    
    -- Deduct tokens
    UPDATE user_profiles 
    SET tokens_balance = tokens_balance - v_cost,
        total_generations = total_generations + 1
    WHERE id = p_user_id;
    
    -- Log transaction
    INSERT INTO user_transactions (user_id, transaction_type, tokens_amount, action_key, description)
    VALUES (p_user_id, 'spend', -v_cost, p_action_key, COALESCE(p_description, p_action_key));
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to add tokens (purchase)
CREATE OR REPLACE FUNCTION add_tokens(
    p_user_id UUID,
    p_tier_key TEXT,
    p_stripe_payment_id TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_tokens INTEGER;
    v_unlocks TEXT;
BEGIN
    -- Get tier info
    SELECT tokens_included, unlocks_profile INTO v_tokens, v_unlocks 
    FROM billing_tiers WHERE tier_key = p_tier_key;
    
    IF v_tokens IS NULL THEN
        RAISE EXCEPTION 'Unknown tier: %', p_tier_key;
    END IF;
    
    -- Add tokens and upgrade profile if needed
    UPDATE user_profiles 
    SET tokens_balance = tokens_balance + v_tokens,
        total_tokens_purchased = total_tokens_purchased + v_tokens,
        profile_type = CASE 
            WHEN v_unlocks IS NOT NULL AND 
                 (CASE profile_type 
                    WHEN 'auto' THEN 1 
                    WHEN 'user' THEN 2 
                    WHEN 'pro' THEN 3 
                    WHEN 'prolux' THEN 4 
                  END) < 
                 (CASE v_unlocks 
                    WHEN 'auto' THEN 1 
                    WHEN 'user' THEN 2 
                    WHEN 'pro' THEN 3 
                    WHEN 'prolux' THEN 4 
                  END)
            THEN v_unlocks
            ELSE profile_type
        END
    WHERE id = p_user_id;
    
    -- Log transaction
    INSERT INTO user_transactions (user_id, transaction_type, tokens_amount, action_key, stripe_payment_id, description)
    VALUES (p_user_id, 'purchase', v_tokens, p_tier_key, p_stripe_payment_id, 'Pack: ' || p_tier_key);
    
    RETURN v_tokens;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 11. TRIGGER: Auto-assign tokens on signup
-- =====================================================
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, email, tokens_balance, profile_type)
    VALUES (NEW.id, NEW.email, 50, 'auto')
    ON CONFLICT (id) DO NOTHING;
    
    -- Log welcome bonus
    INSERT INTO user_transactions (user_id, transaction_type, tokens_amount, description)
    VALUES (NEW.id, 'bonus', 50, 'Welcome bonus - 5 free previews');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- 12. RLS POLICIES
-- =====================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON user_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Public read for billing tiers
ALTER TABLE billing_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view billing tiers" ON billing_tiers
    FOR SELECT TO anon, authenticated USING (is_active = TRUE);

-- Public read for token costs
ALTER TABLE token_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view token costs" ON token_costs
    FOR SELECT TO anon, authenticated USING (TRUE);

COMMIT;
