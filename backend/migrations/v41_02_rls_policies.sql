-- LUXSCALER v41 - RLS POLICIES
-- Paso 2: Activar RLS y crear políticas

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presets_v41 ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_upload_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxonomy_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE slider_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE macro_definitions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users manage own profile" ON profiles;
DROP POLICY IF EXISTS "Users manage own uploads" ON uploads;
DROP POLICY IF EXISTS "Users view own analysis" ON analysis_results;
DROP POLICY IF EXISTS "Users view own generations" ON generations;
DROP POLICY IF EXISTS "Users manage own presets" ON user_presets_v41;
DROP POLICY IF EXISTS "Users manage own workflow" ON user_upload_workflows;
DROP POLICY IF EXISTS "Public read tier_config" ON tier_config;
DROP POLICY IF EXISTS "Public read taxonomy" ON taxonomy_definitions;
DROP POLICY IF EXISTS "Public read diagnosis" ON diagnosis_definitions;
DROP POLICY IF EXISTS "Public read sliders" ON slider_definitions;
DROP POLICY IF EXISTS "Public read macros" ON macro_definitions;

-- Create policies
CREATE POLICY "Users manage own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users manage own uploads" ON uploads FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users view own analysis" ON analysis_results FOR SELECT USING (
    upload_id IN (SELECT id FROM uploads WHERE user_id = auth.uid())
);
CREATE POLICY "Users view own generations" ON generations FOR SELECT USING (
    upload_id IN (SELECT id FROM uploads WHERE user_id = auth.uid())
);
CREATE POLICY "Users manage own presets" ON user_presets_v41 FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own workflow" ON user_upload_workflows FOR ALL USING (auth.uid() = user_id);

-- Public read for definitions
CREATE POLICY "Public read tier_config" ON tier_config FOR SELECT USING (true);
CREATE POLICY "Public read taxonomy" ON taxonomy_definitions FOR SELECT USING (true);
CREATE POLICY "Public read diagnosis" ON diagnosis_definitions FOR SELECT USING (true);
CREATE POLICY "Public read sliders" ON slider_definitions FOR SELECT USING (true);
CREATE POLICY "Public read macros" ON macro_definitions FOR SELECT USING (true);