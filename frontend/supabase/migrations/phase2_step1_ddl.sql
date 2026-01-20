-- PART 1: DDL (Tables & Triggers)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean Slate
DROP TABLE IF EXISTS vision_trigger_overrides;
DROP TABLE IF EXISTS semantic_material_rules;
DROP TABLE IF EXISTS stylescaler_prompt_rules;
DROP TABLE IF EXISTS lightscaler_prompt_rules;
DROP TABLE IF EXISTS photoscaler_prompt_rules;
DROP TABLE IF EXISTS global_prompt_config;
DROP TABLE IF EXISTS prompt_audit_log;

-- 2.1 PHOTOSCALER
CREATE TABLE photoscaler_prompt_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slider_name VARCHAR(50) NOT NULL DEFAULT 'acutancia',
  slider_value_min INT NOT NULL,
  slider_value_max INT NOT NULL,
  on_off BOOLEAN DEFAULT true,
  protocol_header TEXT,
  mission_statement TEXT,
  quality_assessment_logic TEXT,
  virtual_camera_specs TEXT,
  geometric_projection_logic TEXT,
  lens_physics_correction TEXT,
  signal_processing_pipeline TEXT,
  detail_synthesis_logic TEXT,
  damage_restoration_protocol TEXT,
  intensity_label VARCHAR(50), 
  priority_weight INT DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_photo_slider_range ON photoscaler_prompt_rules(slider_name, slider_value_min, slider_value_max);

-- 2.2 LIGHTSCALER
CREATE TABLE lightscaler_prompt_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slider_name VARCHAR(50) NOT NULL,
  slider_value_min INT,
  slider_value_max INT,
  style_slug VARCHAR(50),
  on_off BOOLEAN DEFAULT true,
  protocol_header TEXT,
  zone_system_logic TEXT,
  dynamic_range_strategy TEXT,
  color_science_grading TEXT,
  light_source_physics TEXT,
  volumetric_atmosphere TEXT,
  white_balance_logic TEXT,
  face_fidelity_weight FLOAT DEFAULT 0.0,
  codeformer_strength FLOAT DEFAULT 0.0,
  priority_weight INT DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_light_slider ON lightscaler_prompt_rules(slider_name, slider_value_min, slider_value_max);

-- 2.3 STYLESCALER
CREATE TABLE stylescaler_prompt_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slider_name VARCHAR(50) NOT NULL,
  slider_value_min INT,
  slider_value_max INT,
  on_off BOOLEAN DEFAULT true,
  art_direction_header TEXT,
  texture_quality_prompt TEXT,
  anamorphic_optics_prompt TEXT,
  environment_prompt TEXT,
  styling_prompt TEXT,
  style_negative_constraints TEXT,
  guidance_scale FLOAT DEFAULT 7.5,
  hallucination_density FLOAT DEFAULT 0.0,
  priority_weight INT DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_style_slider ON stylescaler_prompt_rules(slider_name, slider_value_min, slider_value_max);

-- 2.4 GLOBAL CONFIG
CREATE TABLE global_prompt_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key VARCHAR(50) UNIQUE NOT NULL,
  prompt_text TEXT NOT NULL,
  exclusion_tags TEXT[],
  token_weight FLOAT DEFAULT 1.0,
  version VARCHAR(10) DEFAULT 'v15.0',
  is_active BOOLEAN DEFAULT true,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_global_config_key ON global_prompt_config(config_key);

-- 2.5 SEMANTIC MATERIAL
CREATE TABLE semantic_material_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_tag VARCHAR(50) NOT NULL,
  detected_attribute VARCHAR(50),
  physics_logic_prompt TEXT,
  surface_texture_prompt TEXT,
  reflection_model_prompt TEXT,
  negative_material_prompt TEXT,
  priority_weight INT DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_material_tag ON semantic_material_rules(material_tag, detected_attribute);

-- 2.6 VISION TRIGGERS
CREATE TABLE vision_trigger_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  json_category VARCHAR(50) NOT NULL,
  json_key VARCHAR(50) NOT NULL,
  json_value_match VARCHAR(100) NOT NULL,
  target_table VARCHAR(50) NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  forced_slider_value INT,
  forced_style_slug VARCHAR(50),
  override_priority INT DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_vision_match ON vision_trigger_overrides(json_category, json_key, json_value_match);

-- 2.7 AUDIT LOG
CREATE TABLE prompt_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(50) NOT NULL,
  record_id UUID NOT NULL,
  operation VARCHAR(10) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_by VARCHAR(100) DEFAULT current_user,
  client_info JSONB,
  change_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_audit_table_record ON prompt_audit_log(table_name, record_id);

-- 3. AUDIT TRIGGERS
CREATE OR REPLACE FUNCTION log_prompt_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO prompt_audit_log (
    table_name, record_id, operation, old_values, new_values, changed_by
  ) VALUES (
    TG_TABLE_NAME, COALESCE(NEW.id, OLD.id), TG_OP, to_jsonb(OLD), to_jsonb(NEW), current_user
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_photoscaler_changes AFTER INSERT OR UPDATE OR DELETE ON photoscaler_prompt_rules FOR EACH ROW EXECUTE FUNCTION log_prompt_changes();
CREATE TRIGGER audit_lightscaler_changes AFTER INSERT OR UPDATE OR DELETE ON lightscaler_prompt_rules FOR EACH ROW EXECUTE FUNCTION log_prompt_changes();
CREATE TRIGGER audit_stylescaler_changes AFTER INSERT OR UPDATE OR DELETE ON stylescaler_prompt_rules FOR EACH ROW EXECUTE FUNCTION log_prompt_changes();
CREATE TRIGGER audit_global_config_changes AFTER INSERT OR UPDATE OR DELETE ON global_prompt_config FOR EACH ROW EXECUTE FUNCTION log_prompt_changes();
CREATE TRIGGER audit_semantic_changes AFTER INSERT OR UPDATE OR DELETE ON semantic_material_rules FOR EACH ROW EXECUTE FUNCTION log_prompt_changes();
CREATE TRIGGER audit_vision_changes AFTER INSERT OR UPDATE OR DELETE ON vision_trigger_overrides FOR EACH ROW EXECUTE FUNCTION log_prompt_changes();

-- RLS
ALTER TABLE photoscaler_prompt_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lightscaler_prompt_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE stylescaler_prompt_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_prompt_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE semantic_material_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE vision_trigger_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Photoscaler" ON photoscaler_prompt_rules FOR SELECT USING (true);
CREATE POLICY "Public Read Lightscaler" ON lightscaler_prompt_rules FOR SELECT USING (true);
CREATE POLICY "Public Read Stylescaler" ON stylescaler_prompt_rules FOR SELECT USING (true);
CREATE POLICY "Public Read Global" ON global_prompt_config FOR SELECT USING (true);
CREATE POLICY "Public Read Semantic" ON semantic_material_rules FOR SELECT USING (true);
CREATE POLICY "Public Read Vision" ON vision_trigger_overrides FOR SELECT USING (true);
