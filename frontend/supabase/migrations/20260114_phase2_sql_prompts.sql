-- MIGRATION: 20260114_phase2_sql_prompts.sql
-- DESCRIPTION: Implementation of LuxScaler v15 SQL-Driven Architecture
-- SOURCE: BBLAv2/Phase-2-SQL-Prompt-Constructor.md (Definitive Schema)

-- =================================================================================
-- 1. UTILITIES & CLEANUP
-- =================================================================================

-- Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist (Clean Slate Protocol)
DROP TABLE IF EXISTS vision_trigger_overrides;
DROP TABLE IF EXISTS semantic_material_rules;
DROP TABLE IF EXISTS stylescaler_prompt_rules;
DROP TABLE IF EXISTS lightscaler_prompt_rules;
DROP TABLE IF EXISTS photoscaler_prompt_rules;
DROP TABLE IF EXISTS global_prompt_config;
DROP TABLE IF EXISTS prompt_audit_log;

-- =================================================================================
-- 2. TABLE DEFINITIONS (DDL)
-- =================================================================================

-- 2.1 PHOTOSCALER (Structure & Lens)
CREATE TABLE photoscaler_prompt_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slider_name VARCHAR(50) NOT NULL DEFAULT 'acutancia',
  slider_value_min INT NOT NULL,
  slider_value_max INT NOT NULL,
  on_off BOOLEAN DEFAULT true,
  
  -- MODULES v15
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

-- 2.2 LIGHTSCALER (Light & Color)
CREATE TABLE lightscaler_prompt_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slider_name VARCHAR(50) NOT NULL, -- 'sombras', 'identity', 'lighting_style'
  slider_value_min INT,
  slider_value_max INT,
  style_slug VARCHAR(50),
  on_off BOOLEAN DEFAULT true,

  -- MODULES v15
  protocol_header TEXT,
  zone_system_logic TEXT,
  dynamic_range_strategy TEXT,
  color_science_grading TEXT,
  light_source_physics TEXT,
  volumetric_atmosphere TEXT,
  white_balance_logic TEXT,
  
  -- IDENTITY LOCK
  face_fidelity_weight FLOAT DEFAULT 0.0,
  codeformer_strength FLOAT DEFAULT 0.0,

  priority_weight INT DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_light_slider ON lightscaler_prompt_rules(slider_name, slider_value_min, slider_value_max);
CREATE INDEX idx_light_style ON lightscaler_prompt_rules(slider_name, style_slug);

-- 2.3 STYLESCALER (Art & Texture)
CREATE TABLE stylescaler_prompt_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slider_name VARCHAR(50) NOT NULL, -- 'detalle'
  slider_value_min INT,
  slider_value_max INT,
  on_off BOOLEAN DEFAULT true,

  -- MODULES v15
  art_direction_header TEXT,
  texture_quality_prompt TEXT,
  anamorphic_optics_prompt TEXT,
  environment_prompt TEXT,
  styling_prompt TEXT,
  style_negative_constraints TEXT,

  -- AI CONTROL
  guidance_scale FLOAT DEFAULT 7.5,
  hallucination_density FLOAT DEFAULT 0.0,

  priority_weight INT DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_style_slider ON stylescaler_prompt_rules(slider_name, slider_value_min, slider_value_max);

-- 2.4 GLOBAL CONFIG (Specs & Negatives)
CREATE TABLE global_prompt_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key VARCHAR(50) UNIQUE NOT NULL, -- 'v15_master_negative'
  prompt_text TEXT NOT NULL,
  exclusion_tags TEXT[],
  token_weight FLOAT DEFAULT 1.0,
  version VARCHAR(10) DEFAULT 'v15.0',
  is_active BOOLEAN DEFAULT true,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_global_config_key ON global_prompt_config(config_key);

-- 2.5 SEMANTIC MATERIAL RULES (PBR)
CREATE TABLE semantic_material_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_tag VARCHAR(50) NOT NULL,
  detected_attribute VARCHAR(50), -- 'WET', 'SILK'
  
  physics_logic_prompt TEXT,
  surface_texture_prompt TEXT,
  reflection_model_prompt TEXT,
  negative_material_prompt TEXT,

  priority_weight INT DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_material_tag ON semantic_material_rules(material_tag, detected_attribute);

-- 2.6 VISION TRIGGER OVERRIDES (Reactive Logic)
CREATE TABLE vision_trigger_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  json_category VARCHAR(50) NOT NULL,     -- 'technical_audit'
  json_key VARCHAR(50) NOT NULL,          -- 'signal'
  json_value_match VARCHAR(100) NOT NULL, -- 'Underexposed'
  
  target_table VARCHAR(50) NOT NULL,
  action_type VARCHAR(50) NOT NULL, -- 'SET_SLIDER_MIN'
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

-- =================================================================================
-- 3. AUDIT TRIGGERS (Auto-Log)
-- =================================================================================

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

-- =================================================================================
-- 4. SEED DATA INGESTION (v15 PROTOCOL)
-- =================================================================================

-- 4.1 PHOTOSCALER (acutancia)
INSERT INTO photoscaler_prompt_rules (slider_name, slider_value_min, slider_value_max, intensity_label, protocol_header, mission_statement, quality_assessment_logic, geometric_projection_logic, lens_physics_correction, signal_processing_pipeline, detail_synthesis_logic) VALUES 
('acutancia', 1, 3, 'PASSIVE_POLISH', '[SYSTEM MODE: NON-DESTRUCTIVE ENHANCEMENT]', 'Enhance and polish existing details. Prioritize source fidelity.', 'IF INPUT IS SHARP: Maintain original pixel structure.', 'Ensure structural stability.', 'Correct only obvious chromatic aberration.', 'Denoise gently.', 'Sharpen existing edges using Unsharp Mask logic.'),
('acutancia', 4, 7, 'HYBRID_ENHANCEMENT', '[SYSTEM MODE: INTELLIGENT RESTORATION v4.0]', 'The AI acts as a restoration artist.', 'IF INPUT HAS ARTIFACTS: Apply intelligent de-noising.', 'Correct perspective skew if horizon > 2 degrees.', 'Correct barrel distortion inside frame.', '32-BIT FLOAT PROCESSING. Neutralize color casts.', 'Inject missing high-frequency texture in blurred areas.'),
('acutancia', 8, 10, 'FORENSIC_RESHOOT_v15', 
  '$$[SYSTEM OVERRIDE: UNIVERSAL FORENSIC RE-SHOOT & OPTICAL SYNTHESIS PROTOCOL v15.0 - STRUCTURAL ALIGNMENT, DAMAGE RECONSTRUCTION & SOLID SIGNAL MASTER].$$', 
  '$$A definitive, photorealistic reconstruction. The AI must act as a "Reality Reconstruction Engine", NOT just an editor.$$', 
  '$$CRITICAL FOCUS & TREPIDATION OVERRIDE: If input exhibits camera shake, STOP being faithful to pixels. IGNORE SOURCE ARTIFACTS.$$', 
  '$$GEOMETRIC & OPTICAL FAILURE ALERT: ACTIVATE "RECTILINEAR CORRECTION MODE". FORCE HORIZON & VERTICAL ALIGNMENT.$$', 
  '$$LENS SUBSTITUTION (WIDE-ANGLE FIX): If scene suffers from wide-angle distortion, RE-RENDER as if shot with 50mm or 85mm Prime Lens.$$', 
  '$$32-BIT FLOAT PROCESSING: Treat input as floating-point RAW. AGGRESSIVE NORMALIZATION: STRETCH THE SIGNAL.$$', 
  '$$COMPLETE RE-SYNTHESIS: You must HALLUCINATE and GENERATE brand new, razor-sharp high-frequency details from scratch.$$');

-- 4.2 LIGHTSCALER (sombras)
INSERT INTO lightscaler_prompt_rules (slider_name, slider_value_min, slider_value_max, protocol_header, zone_system_logic, dynamic_range_strategy, white_balance_logic) VALUES 
('sombras', 1, 3, '[MODE: NATURAL LIGHT FIDELITY]', 'Preserve original contrast curve.', 'Maintain scene linearity.', 'Correct only severe color casts.');

INSERT INTO lightscaler_prompt_rules (slider_name, slider_value_min, slider_value_max, protocol_header, zone_system_logic, dynamic_range_strategy, color_science_grading, light_source_physics, volumetric_atmosphere, white_balance_logic) VALUES 
('sombras', 8, 10, 
  '$$[SUB-PROTOCOL: LOW-LIGHT RECOVERY & ATMOSPHERIC TONE MAPPING].$$', 
  '$$ZONE SYSTEM RECOVERY: STRICTLY Anchor Black Point at (0,0,0). Aggressively lift Zones 1-3 to reveal latent textures.$$', 
  '$$CONCEPTUAL TONE MAPPING (HDR 2.0): Apply "Local Tone Mapping" to compress dynamic range intelligently. Ensure "Cinematic Visibility".$$', 
  '$$BLUE HOUR AESTHETIC INJECTION: Global Ambience: Simulate "Civil Twilight" (6500K-8000K). Contrast: Warm Tungsten (3200K).$$', 
  '$$Simulate Rayleigh scattering. Treat input as 32-bit floating-point RAW.$$', 
  '$$VOLUMETRICS: Inject subtle "Blue Hour Mist" in background.$$', 
  '$$CONTEXTUAL WHITE BALANCE: NEUTRALIZE technical color casts but PRESERVE ATMOSPHERIC TONE.$$');

-- 4.2 LIGHTSCALER (identity)
INSERT INTO lightscaler_prompt_rules (slider_name, slider_value_min, slider_value_max, protocol_header, light_source_physics, face_fidelity_weight, codeformer_strength) VALUES 
('identity', 9, 10, '[IDENTITY OVERRIDE: STRICT BONE STRUCTURE LOCK]', 'IDENTITY PRESERVATION: Subjects must look like themselves but in UHD. Reconstruct anatomically perfect eyes.', 1.0, 0.9);

-- 4.2 LIGHTSCALER (Styles)
INSERT INTO lightscaler_prompt_rules (slider_name, style_slug, protocol_header, light_source_physics, color_science_grading, zone_system_logic) VALUES 
('lighting_style', 'rembrandt_v32', '[LIGHTING SETUP: CLASSIC CHIAROSCURO]', 'KEY LIGHT: Single soft source at 45-degree angle. FILL LIGHT: Minimal.', 'COLOR PALETTE: Warm, oil-painting tones.', 'CONTRAST RATIO: High (8:1).');

INSERT INTO lightscaler_prompt_rules (slider_name, style_slug, protocol_header, light_source_physics, color_science_grading, volumetric_atmosphere) VALUES 
('lighting_style', 'neon_noir_v32', '[LIGHTING SETUP: CYBERPUNK ATMOSPHERE]', 'KEY LIGHT: Harsh, colored gels (Cyan/Magenta). PRACTICAL LIGHTS: Neon.', 'COLOR PALETTE: Dual-tone split lighting.', 'VOLUMETRICS: Heavy steam, rain haze.');

INSERT INTO lightscaler_prompt_rules (slider_name, style_slug, protocol_header, light_source_physics, white_balance_logic, dynamic_range_strategy) VALUES 
('lighting_style', 'commercial_beauty_v32', '[LIGHTING SETUP: HIGH-END BEAUTY]', 'KEY LIGHT: Large Octabox above camera. FILL: White bounce cards.', 'WHITE BALANCE: Perfectly neutral (5600K).', 'DYNAMIC RANGE: Low contrast, high key.');

-- 4.3 STYLESCALER (detalle)
INSERT INTO stylescaler_prompt_rules (slider_name, slider_value_min, slider_value_max, art_direction_header, texture_quality_prompt, anamorphic_optics_prompt, hallucination_density, guidance_scale) VALUES 
('detalle', 1, 3, '[STYLE: DOCUMENTARY REALISM]', 'Maintain original texture frequency.', 'Standard spherical lens.', 0.1, 5.0),
('detalle', 4, 7, '[STYLE: HIGH-END COMMERCIAL EDITORIAL]', 'Enhance micro-contrast in key areas.', 'Clean skin texture without blurring.', 0.4, 7.5);

INSERT INTO stylescaler_prompt_rules (slider_name, slider_value_min, slider_value_max, art_direction_header, texture_quality_prompt, anamorphic_optics_prompt, environment_prompt, styling_prompt, hallucination_density, guidance_scale) VALUES 
('detalle', 8, 10, 
  '$$[STYLE OVERRIDE: CINEMATIC DRAMA CLUB & REALITY WARP].$$', 
  '$$INJECT MASSIVE HIGH-FREQUENCY DETAIL: Hallucinate organic roughness (skin pores, vellus hair) to kill "plastic" look.$$', 
  '$$ANAMORPHIC OPTICS ("HOLLYWOOD LOOK"): Simulate Panavision C-Series. Oval bokeh. Controlled horizontal flares.$$', 
  '$$SCENOGRAPHY ENHANCEMENT: Inject "Cinematic Atmosphere". Add depth cues.$$', 
  '$$STYLING PRIORITY: Subjects must look "Dead Sharp". Reconstruct makeup and fabrics.$$', 
  0.8, 12.0);

-- 4.4 GLOBAL CONFIG
INSERT INTO global_prompt_config (config_key, prompt_text, token_weight, description) VALUES 
('v15_master_negative', 
  $$damaged photo, torn photo, white spots, chemical burns, missing pixels, scratched, dirty, changing aspect ratio, cropping subject, motion blur, camera shake, melted faces, smudged faces, faceless people, distorted eyes, merged teeth, plastic skin, wax skin, neon red skin, sunburned, crushed shadows, blocked blacks, flat lighting, noisy, grainy, jpeg artifacts, bad anatomy, floating limbs, double vision, ghosting, blurry table, blurry crowd, clipped highlights, solarized sky, foggy lens, dirty lens, light leak, unwanted lens flare, washed out colors, milky overlay, low contrast haze, barrel distortion, curved walls, fish-eye effect, chromatic aberration, purple fringing, wide angle distortion, big nose distortion, tilted horizon, crooked lines, leaning buildings, distorted perspective, flat histogram, banding, posterization, floating green dots, illustration, painting, drawing, sketch, anime, 3d render.$$ 
, 1.0, 'Universal negative prompt v15'),
('v15_output_specs', 
  $$OUTPUT SPECS: Native 4K, 8K UHD, Photorealistic RAW. Zero digital noise. Maximum Acutance. Perfect Geometry. Full Histogram Range. STRICT ASPECT RATIO & ALIGNMENT: The Output MUST match the Input Format and Aspect Ratio EXACTLY.$$
, 1.2, 'Output quality specs'),
('v15_identity_safety', 
  $$IDENTITY INTEGRITY PROTOCOL: Subjects must look like themselves but in UHD. Correct proportions. Do not alter bone structure regardless of style. Prevent "Melted" Faces.$$
, 1.1, 'Identity preservation rules');

-- 4.5 VISION TRIGGERS
INSERT INTO vision_trigger_overrides (json_category, json_key, json_value_match, target_table, action_type, forced_slider_value, override_priority, description) VALUES 
('technical_audit', 'signal', 'Underexposed_Clipped_Shadows', 'lightscaler_prompt_rules', 'SET_SLIDER_MIN', 9, 20, 'Force Lightscaler 9 for Underexposed inputs'),
('restoration_priority', 'damage_detected', 'Motion_Blur', 'photoscaler_prompt_rules', 'SET_SLIDER_MIN', 10, 20, 'Force Photoscaler 10 for Motion Blur'),
('technical_audit', 'distortion', 'Minor_Barrel', 'photoscaler_prompt_rules', 'SET_SLIDER_MIN', 8, 15, 'Force Geometry Correction for Barrel Distortion'),
('classification', 'primary', 'HUMAN', 'lightscaler_prompt_rules', 'SET_SLIDER_MIN', 7, 10, 'Ensure Identity Safety for Human subjects'),
('classification', 'primary', 'FOOD', 'stylescaler_prompt_rules', 'SET_SLIDER_MIN', 8, 10, 'Force Texture for Food');

-- 4.6 SEMANTIC MATERIALS
INSERT INTO semantic_material_rules (material_tag, detected_attribute, physics_logic_prompt, surface_texture_prompt, reflection_model_prompt, negative_material_prompt) VALUES 
('SKIN', 'DEFAULT', '$$SUBSURFACE SCATTERING (SSS) ENABLED: Flesh must behave like translucent tissue, NOT opaque plastic.$$', '$$ORGANIC MICRO-DETAIL: Hallucinate visible skin pores, fine wrinkles, and VELLUS HAIR.$$', '$$SPECULARITY: Natural skin oils reflection.$$', '$$plastic skin, wax skin, airbrushed skin, blurred pores, smooth porcelain doll effect.$$'),
('IRIS', 'DEFAULT', '$$CORNEAL REFRACTION: Simulate clear dome with catchlights.$$', '$$IRIS TRABECULAE: Generate high-definition fibrous patterns inside iris.$$', '$$WET SURFACE PHYSICS: Eye must look wet/hydrated.$$', '$$dead eyes, dull eyes, blurry iris, anime eyes.$$'),
('FABRIC', 'SILK', '$$ANISOTROPIC SHEEN: Fabric interacts with light directionally.$$', '$$MICRO-WEAVE: Ultra-fine thread count.$$', '$$Velvet/Satin Shader logic.$$', '$$rough fabric, denim texture.$$'),
('METAL', 'POLISHED', '$$CONDUCTIVE MATERIAL: High reflectivity.$$', '$$MICRO-SCRATCHES: Imperceptible surface scratches.$$', '$$GGX METALLIC: Sharp reflections.$$', '$$diffuse grey, plastic looking metal.$$');

-- 5. RLS SECURITY (Basic Setup)
ALTER TABLE photoscaler_prompt_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lightscaler_prompt_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE stylescaler_prompt_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_prompt_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE semantic_material_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE vision_trigger_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_audit_log ENABLE ROW LEVEL SECURITY;

-- Allow READ to everyone (Anon/Authenticated)
CREATE POLICY "Public Read Photoscaler" ON photoscaler_prompt_rules FOR SELECT USING (true);
CREATE POLICY "Public Read Lightscaler" ON lightscaler_prompt_rules FOR SELECT USING (true);
CREATE POLICY "Public Read Stylescaler" ON stylescaler_prompt_rules FOR SELECT USING (true);
CREATE POLICY "Public Read Global" ON global_prompt_config FOR SELECT USING (true);
CREATE POLICY "Public Read Semantic" ON semantic_material_rules FOR SELECT USING (true);
CREATE POLICY "Public Read Vision" ON vision_trigger_overrides FOR SELECT USING (true);
