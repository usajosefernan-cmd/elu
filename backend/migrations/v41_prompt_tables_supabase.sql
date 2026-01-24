-- ================================================================
-- LUXSCALER v41.0 - MODULAR PROMPT SYSTEM
-- ================================================================
-- Sistema de 3 tablas para control granular de prompts
-- Basado en arquitectura BBLAv2

-- ================================================================
-- TABLA 1: photoscaler_prompt_rules
-- ================================================================
-- Responsabilidad: Restauración óptica, sensor, geometría

DROP TABLE IF EXISTS photoscaler_prompt_rules CASCADE;

CREATE TABLE photoscaler_prompt_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 🎚️ CONTROL DE ACTIVACIÓN (TRIGGERS)
  slider_name VARCHAR(50) NOT NULL,  -- 'limpieza_artefactos', 'geometria', 'optica_nitidez', etc.
  slider_value_min INT NOT NULL,     -- Rango de activación (ej: 8)
  slider_value_max INT NOT NULL,     -- Rango de activación (ej: 10)
  on_off BOOLEAN DEFAULT true,       -- Master Switch
  
  -- 🧬 MÓDULOS DEL PROTOCOLO (TEXTO RAW)
  protocol_header TEXT,              -- Declaración del sistema
  mission_statement TEXT,            -- Cómo debe comportarse la IA
  quality_assessment_logic TEXT,     -- Reglas de diagnóstico
  virtual_camera_specs TEXT,         -- Especificaciones de re-captura
  geometric_projection_logic TEXT,   -- Proyección y perspectiva
  lens_physics_correction TEXT,      -- Corrección de distorsiones ópticas
  signal_processing_pipeline TEXT,   -- Tratamiento del histograma
  detail_synthesis_logic TEXT,       -- Generación de detalle nuevo
  damage_restoration_protocol TEXT,  -- Qué hacer con partes dañadas
  
  -- ⚙️ METADATOS
  intensity_label VARCHAR(50),       -- 'PASSIVE_POLISH', 'HYBRID_ENHANCEMENT', 'FORENSIC_RESHOOT'
  priority_weight INT DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_photo_slider_range ON photoscaler_prompt_rules(slider_name, slider_value_min, slider_value_max);

-- ================================================================
-- TABLA 2: lightscaler_prompt_rules
-- ================================================================
-- Responsabilidad: Director de Fotografía y Colorista

DROP TABLE IF EXISTS lightscaler_prompt_rules CASCADE;

CREATE TABLE lightscaler_prompt_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 🎚️ CONTROL DE ACTIVACIÓN
  slider_name VARCHAR(50) NOT NULL,  -- 'sombras', 'key_light', 'temperatura', etc.
  slider_value_min INT,              -- Para sliders lineales (1-10)
  slider_value_max INT,
  style_slug VARCHAR(50),            -- Para presets específicos ('rembrandt_v32', 'neon_noir')
  on_off BOOLEAN DEFAULT true,

  -- 💡 MÓDULOS DEL PROTOCOLO (TEXTO RAW)
  protocol_header TEXT,              -- Diagnóstico y estrategia de exposición
  zone_system_logic TEXT,            -- Cómo manejar el histograma (negros y blancos)
  dynamic_range_strategy TEXT,       -- Compresión de luz (HDR)
  color_science_grading TEXT,        -- Teoría del color aplicada
  light_source_physics TEXT,         -- Simulación de fuentes de luz
  volumetric_atmosphere TEXT,        -- Atmósfera y profundidad
  white_balance_logic TEXT,          -- Temperatura técnica vs. artística

  -- 👤 META-VARIABLES DE IDENTIDAD
  face_fidelity_weight FLOAT DEFAULT 0.0,  -- Peso para ip-adapter (0.0 - 1.0)
  codeformer_strength FLOAT DEFAULT 0.0,   -- Fuerza de restauración facial

  priority_weight INT DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_light_slider ON lightscaler_prompt_rules(slider_name, slider_value_min, slider_value_max);
CREATE INDEX idx_light_style ON lightscaler_prompt_rules(slider_name, style_slug);

-- ================================================================
-- TABLA 3: stylescaler_prompt_rules
-- ================================================================
-- Responsabilidad: Textura, Estilo Cinematográfico, Escenografía, Styling

DROP TABLE IF EXISTS stylescaler_prompt_rules CASCADE;

CREATE TABLE stylescaler_prompt_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 🎚️ CONTROL DE ACTIVACIÓN
  slider_name VARCHAR(50) NOT NULL,  -- 'styling_piel', 'styling_ropa', 'atmosfera', etc.
  slider_value_min INT,              -- 1-10
  slider_value_max INT,
  on_off BOOLEAN DEFAULT true,

  -- 🎨 MÓDULOS DEL PROTOCOLO (TEXTO RAW)
  art_direction_header TEXT,         -- El "Vibe" general
  texture_quality_prompt TEXT,       -- Instrucción de detalle microscópico
  anamorphic_optics_prompt TEXT,     -- Carácter de lente artístico
  environment_prompt TEXT,           -- Contexto espacial
  styling_prompt TEXT,               -- Maquillaje, ropa y objetos
  style_negative_constraints TEXT,   -- Lo que NO queremos estéticamente

  -- 🤖 PARÁMETROS DE IA (CONTROL DE ALUCINACIÓN)
  guidance_scale FLOAT DEFAULT 7.5,          -- Qué tan literal es la IA (CFG Scale)
  hallucination_density FLOAT DEFAULT 0.0,   -- Creatividad permitida (0.0 - 1.0)

  priority_weight INT DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_style_slider ON stylescaler_prompt_rules(slider_name, slider_value_min, slider_value_max);

-- ================================================================
-- RLS POLICIES (Row Level Security)
-- ================================================================

-- Photoscaler
ALTER TABLE photoscaler_prompt_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read photoscaler rules" ON photoscaler_prompt_rules FOR SELECT USING (true);

-- Lightscaler
ALTER TABLE lightscaler_prompt_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read lightscaler rules" ON lightscaler_prompt_rules FOR SELECT USING (true);

-- Stylescaler
ALTER TABLE stylescaler_prompt_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read stylescaler rules" ON stylescaler_prompt_rules FOR SELECT USING (true);
