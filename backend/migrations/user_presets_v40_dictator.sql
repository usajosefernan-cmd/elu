-- LuxScaler v40.1 - User Presets with "THE DICTATOR PROMPT"
-- Migration: user_presets con style_lock_prompt

-- Drop existing table if it exists (for clean migration)
DROP TABLE IF EXISTS user_presets CASCADE;

CREATE TABLE user_presets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    
    -- La Configuración Mágica (Reproducibilidad)
    seed BIGINT NOT NULL,
    temperature FLOAT NOT NULL,
    top_k INTEGER DEFAULT 40,
    top_p FLOAT DEFAULT 0.9,
    
    -- Los Ingredientes (Sliders)
    sliders_config JSONB NOT NULL,
    
    -- 🔥 THE DICTATOR PROMPT 🔥
    -- Este campo guarda el texto "Override" que FUERZA el estilo
    style_lock_prompt TEXT,
    
    -- Sliders dominantes (> 8) para referencia rápida
    dominant_sliders JSONB,
    
    -- Metadata
    mode TEXT DEFAULT 'SHOWMAN',
    thumbnail_url TEXT,
    source_image_url TEXT,  -- La imagen que generó este estilo
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indexes
CREATE INDEX idx_user_presets_user_id ON user_presets(user_id);
CREATE INDEX idx_user_presets_created_at ON user_presets(created_at DESC);

-- RLS
ALTER TABLE user_presets ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own presets" ON user_presets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own presets" ON user_presets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presets" ON user_presets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own presets" ON user_presets
    FOR DELETE USING (auth.uid() = user_id);

-- Allow anon access for testing (remove in production)
CREATE POLICY "Allow anon read" ON user_presets
    FOR SELECT USING (true);

CREATE POLICY "Allow anon insert" ON user_presets
    FOR INSERT WITH CHECK (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_presets_updated_at
    BEFORE UPDATE ON user_presets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
