-- LuxScaler v40 - User Presets with Seed + Temperature
-- Migration: user_presets

CREATE TABLE IF NOT EXISTS user_presets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    
    -- La Configuración Mágica
    seed BIGINT NOT NULL,
    temperature FLOAT NOT NULL,
    
    -- Los Ingredientes (Sliders)
    sliders_config JSONB NOT NULL,
    
    -- Metadata
    mode TEXT DEFAULT 'CREATIVE',
    thumbnail_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_presets_user_id ON user_presets(user_id);

-- RLS
ALTER TABLE user_presets ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own presets" ON user_presets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own presets" ON user_presets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own presets" ON user_presets
    FOR DELETE USING (auth.uid() = user_id);

-- Allow anon access for testing (remove in production)
CREATE POLICY "Allow anon read" ON user_presets
    FOR SELECT USING (true);

CREATE POLICY "Allow anon insert" ON user_presets
    FOR INSERT WITH CHECK (true);
