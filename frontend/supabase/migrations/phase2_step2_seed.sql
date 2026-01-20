-- PART 2: SEED DATA (Inserts)

-- 4.1 PHOTOSCALER
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

-- 4.2 LIGHTSCALER (identity/styles)
INSERT INTO lightscaler_prompt_rules (slider_name, slider_value_min, slider_value_max, protocol_header, light_source_physics, face_fidelity_weight, codeformer_strength) VALUES 
('identity', 9, 10, '[IDENTITY OVERRIDE: STRICT BONE STRUCTURE LOCK]', 'IDENTITY PRESERVATION: Subjects must look like themselves but in UHD. Reconstruct anatomically perfect eyes.', 1.0, 0.9);

INSERT INTO lightscaler_prompt_rules (slider_name, style_slug, protocol_header, light_source_physics, color_science_grading, zone_system_logic) VALUES 
('lighting_style', 'rembrandt_v32', '[LIGHTING SETUP: CLASSIC CHIAROSCURO]', 'KEY LIGHT: Single soft source at 45-degree angle. FILL LIGHT: Minimal.', 'COLOR PALETTE: Warm, oil-painting tones.', 'CONTRAST RATIO: High (8:1).');

INSERT INTO lightscaler_prompt_rules (slider_name, style_slug, protocol_header, light_source_physics, color_science_grading, volumetric_atmosphere) VALUES 
('lighting_style', 'neon_noir_v32', '[LIGHTING SETUP: CYBERPUNK ATMOSPHERE]', 'KEY LIGHT: Harsh, colored gels (Cyan/Magenta). PRACTICAL LIGHTS: Neon.', 'COLOR PALETTE: Dual-tone split lighting.', 'VOLUMETRICS: Heavy steam, rain haze.');

INSERT INTO lightscaler_prompt_rules (slider_name, style_slug, protocol_header, light_source_physics, white_balance_logic, dynamic_range_strategy) VALUES 
('lighting_style', 'commercial_beauty_v32', '[LIGHTING SETUP: HIGH-END BEAUTY]', 'KEY LIGHT: Large Octabox above camera. FILL: White bounce cards.', 'WHITE BALANCE: Perfectly neutral (5600K).', 'DYNAMIC RANGE: Low contrast, high key.');

-- 4.3 STYLESCALER
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
