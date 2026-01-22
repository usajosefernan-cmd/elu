-- LuxScaler v29.0 - Smart Presets Table Migration
-- Tabla para almacenar presets de usuario

CREATE TABLE IF NOT EXISTS smart_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slider_values JSONB NOT NULL,
    locked_pillars TEXT[] DEFAULT '{}',
    narrative_anchor TEXT,
    smart_locks JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_smart_presets_user_id ON smart_presets(user_id);
CREATE INDEX IF NOT EXISTS idx_smart_presets_created_at ON smart_presets(created_at DESC);

-- RLS Policies
ALTER TABLE smart_presets ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden ver sus propios presets
CREATE POLICY "Users can view own presets" ON smart_presets
    FOR SELECT USING (auth.uid() = user_id);

-- Los usuarios solo pueden crear sus propios presets
CREATE POLICY "Users can insert own presets" ON smart_presets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Los usuarios solo pueden actualizar sus propios presets
CREATE POLICY "Users can update own presets" ON smart_presets
    FOR UPDATE USING (auth.uid() = user_id);

-- Los usuarios solo pueden eliminar sus propios presets
CREATE POLICY "Users can delete own presets" ON smart_presets
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_smart_presets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER smart_presets_updated_at
    BEFORE UPDATE ON smart_presets
    FOR EACH ROW
    EXECUTE FUNCTION update_smart_presets_updated_at();

-- Comentarios
COMMENT ON TABLE smart_presets IS 'Presets de configuración de sliders guardados por usuarios';
COMMENT ON COLUMN smart_presets.slider_values IS 'JSON con valores de 27 sliders organizados por pilar';
COMMENT ON COLUMN smart_presets.locked_pillars IS 'Lista de nombres de pilares bloqueados';
COMMENT ON COLUMN smart_presets.narrative_anchor IS 'Descripción textual del efecto deseado';
COMMENT ON COLUMN smart_presets.smart_locks IS 'Restricciones inteligentes (min/max por slider)';
