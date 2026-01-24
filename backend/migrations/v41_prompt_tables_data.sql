-- ================================================================
-- LUXSCALER v41.0 - POPULATION DATA FOR PROMPT TABLES
-- ================================================================
-- Inserts para las 3 tablas con la lógica de prompts

-- ================================================================
-- PHOTOSCALER RULES - 3 Niveles de Intervención
-- ================================================================

-- NIVEL 1-3: PASSIVE POLISH
INSERT INTO photoscaler_prompt_rules (
  slider_name, slider_value_min, slider_value_max, intensity_label,
  protocol_header,
  mission_statement,
  quality_assessment_logic,
  geometric_projection_logic,
  lens_physics_correction,
  signal_processing_pipeline,
  detail_synthesis_logic,
  priority_weight
) VALUES (
  'limpieza_artefactos', 1, 3, 'PASSIVE_POLISH',
  '[SYSTEM MODE: NON-DESTRUCTIVE ENHANCEMENT]',
  'Enhance and polish existing details. Prioritize source fidelity.',
  'IF INPUT IS SHARP & CLEAN: Maintain original pixel structure. Do not hallucinate unnecessary details.',
  'Ensure structural stability. Do not warp.',
  'Correct only obvious chromatic aberration.',
  'Denoise gently. Maintain natural grain structure.',
  'Sharpen existing edges using Unsharp Mask logic.',
  10
);

-- NIVEL 4-7: HYBRID ENHANCEMENT
INSERT INTO photoscaler_prompt_rules (
  slider_name, slider_value_min, slider_value_max, intensity_label,
  protocol_header,
  mission_statement,
  quality_assessment_logic,
  virtual_camera_specs,
  geometric_projection_logic,
  lens_physics_correction,
  signal_processing_pipeline,
  detail_synthesis_logic,
  damage_restoration_protocol,
  priority_weight
) VALUES (
  'limpieza_artefactos', 4, 7, 'HYBRID_ENHANCEMENT',
  '[SYSTEM MODE: INTELLIGENT RESTORATION v4.0]',
  'The AI acts as a restoration artist. Fix flaws but keep the essence.',
  'IF INPUT HAS ARTIFACTS: Apply intelligent de-noising without waxy skin effect.',
  'Simulate a modern sensor capture. Stabilize micro-jitters.',
  'Correct perspective skew if horizon > 2 degrees tilted.',
  'Correct barrel/pincushion distortion inside the frame to flatter the subject.',
  '32-BIT FLOAT PROCESSING. Neutralize color casts while preserving atmospheric tone.',
  'Inject missing high-frequency texture in blurred areas (fabric, hair).',
  'Infill minor scratches and dust spots using context awareness.',
  20
);

-- NIVEL 8-10: FORENSIC RESHOOT
INSERT INTO photoscaler_prompt_rules (
  slider_name, slider_value_min, slider_value_max, intensity_label,
  protocol_header,
  mission_statement,
  quality_assessment_logic,
  virtual_camera_specs,
  geometric_projection_logic,
  lens_physics_correction,
  signal_processing_pipeline,
  detail_synthesis_logic,
  damage_restoration_protocol,
  priority_weight
) VALUES (
  'limpieza_artefactos', 8, 10, 'FORENSIC_RESHOOT_v15',
  '[SYSTEM OVERRIDE: UNIVERSAL FORENSIC RE-SHOOT & OPTICAL SYNTHESIS PROTOCOL v15.0 - STRUCTURAL ALIGNMENT, DAMAGE RECONSTRUCTION & SOLID SIGNAL MASTER].',
  'A definitive, photorealistic reconstruction. The AI must act as a "Reality Reconstruction Engine", NOT just an editor.',
  'CRITICAL FOCUS & TREPIDATION OVERRIDE: If the input exhibits ANY camera shake or lack of definition, STOP being faithful to the pixels. The input is now considered a "corrupted compositional sketch" only. IGNORE SOURCE ARTIFACTS: Do not sharpen the blur, noise, fog. DISCARD the bad data.',
  'VIRTUAL RE-SHOOT: Simulate a brand new capture of the same scene using a 1/8000s shutter speed (zero motion blur), a high-end rectilinear lens (zero distortion), and a calibrated sensor.',
  'GEOMETRIC & OPTICAL FAILURE ALERT: ACTIVATE "RECTILINEAR CORRECTION MODE". FORCE HORIZON & VERTICAL ALIGNMENT: ROTATE and RE-ALIGN so gravity is vertical. STRICT ASPECT RATIO: The structural composition MUST ALIGN PERFECTLY with the source.',
  'LENS SUBSTITUTION (WIDE-ANGLE FIX): If the scene suffers from wide-angle distortion (curved corners, big nose selfie), RE-RENDER THE SCENE as if shot with a 50mm or 85mm Prime Lens (Rectilinear Projection). Straighten architectural lines.',
  '32-BIT FLOAT PROCESSING: Treat input as floating-point RAW. AGGRESSIVE NORMALIZATION: STRETCH THE SIGNAL. The darkest pixel MUST touch True Black (0) and brightest True White (255). Prevent banding in gradients.',
  'COMPLETE RE-SYNTHESIS (GENERATIVE RE-INVENTION): You must HALLUCINATE and GENERATE brand new, razor-sharp high-frequency details (individual eyelashes, iris trabeculae, distinct teeth, skin pores, fabric weave) from scratch. Inject organic roughness to kill "plastic" look.',
  'SEVERE DAMAGE RECONSTRUCTION (THE "TIME MACHINE" FIX): If source contains total signal loss (white blobs, chemical burns, torn paper), YOU MUST REIMAGINE THE MISSING CONTENT. Do not preserve the damage; PAINT NEW REALITY into the void.',
  30
);

-- ================================================================
-- LIGHTSCALER RULES - Iluminación y Color
-- ================================================================

-- SOMBRAS: Nivel 1-3 (Natural)
INSERT INTO lightscaler_prompt_rules (
  slider_name, slider_value_min, slider_value_max,
  protocol_header, zone_system_logic, dynamic_range_strategy, white_balance_logic,
  priority_weight
) VALUES (
  'sombras', 1, 3,
  '[MODE: NATURAL LIGHT FIDELITY]',
  'Preserve original contrast curve. Do not lift shadows artificially.',
  'Maintain scene linearity. No HDR tone mapping.',
  'Correct only severe color casts (green/magenta tint). Keep temperature neutral.',
  10
);

-- SOMBRAS: Nivel 8-10 (Forensic Low-Light Recovery)
INSERT INTO lightscaler_prompt_rules (
  slider_name, slider_value_min, slider_value_max,
  protocol_header,
  zone_system_logic,
  dynamic_range_strategy,
  color_science_grading,
  light_source_physics,
  volumetric_atmosphere,
  white_balance_logic,
  priority_weight
) VALUES (
  'sombras', 8, 10,
  '[SUB-PROTOCOL: LOW-LIGHT RECOVERY & ATMOSPHERIC TONE MAPPING]. DIAGNOSIS: If input is Underexposed/Dark: DO NOT wash out the image.',
  'ZONE SYSTEM RECOVERY: STRICTLY Anchor the Black Point at absolute zero (0,0,0). Aggressively lift Zones 1-3 (Deep Shadows) to reveal latent textures (fabric weave, brick details) currently hidden. Maintain rich, deep blacks where physically appropriate.',
  'CONCEPTUAL TONE MAPPING (HDR 2.0): Apply "Local Tone Mapping" to compress dynamic range intelligently. Ensure visibility in dark areas without destroying global contrast. Avoid "halo effect". Goal is "Cinematic Visibility".',
  'BLUE HOUR AESTHETIC INJECTION: Global Ambience: Simulate "Civil Twilight" lighting physics. Ambient fill light must be cool/blue (6500K-8000K). Contrast Lighting: Force artificial sources to "Warm Tungsten" (3200K). Create Complementary Color Contrast (Teal/Orange).',
  'Simulate Rayleigh scattering from upper atmosphere. Treat input as 32-bit floating-point RAW to prevent banding during exposure lift.',
  'VOLUMETRICS: Inject subtle "Blue Hour Mist" in the background to separate planes and add depth.',
  'CONTEXTUAL WHITE BALANCE: NEUTRALIZE technical color casts (sickly green fluorescent, muddy yellow) but PRESERVE ATMOSPHERIC TONE. Do not force sterile 5500K white if it destroys the mood.',
  30
);

-- ESTILOS DE ILUMINACIÓN (Presets de Autor)

-- Estilo: Rembrandt
INSERT INTO lightscaler_prompt_rules (
  slider_name, style_slug,
  protocol_header,
  light_source_physics,
  color_science_grading,
  zone_system_logic,
  priority_weight
) VALUES (
  'lighting_style', 'rembrandt_v32',
  '[LIGHTING SETUP: CLASSIC CHIAROSCURO]',
  'KEY LIGHT: Single soft source at 45-degree angle (Rembrandt Patch). FILL LIGHT: Minimal (-3 EV). BACKLIGHT: None.',
  'COLOR PALETTE: Warm, oil-painting tones. Golden hour falloff.',
  'CONTRAST RATIO: High (8:1). Allow shadows to fall into deep darkness (Zone 1).',
  40
);

-- Estilo: Neon Noir
INSERT INTO lightscaler_prompt_rules (
  slider_name, style_slug,
  protocol_header,
  light_source_physics,
  color_science_grading,
  volumetric_atmosphere,
  priority_weight
) VALUES (
  'lighting_style', 'neon_noir_v32',
  '[LIGHTING SETUP: CYBERPUNK ATMOSPHERE]',
  'KEY LIGHT: Harsh, colored gels (Cyan/Magenta). PRACTICAL LIGHTS: Neon signs and street lamps reflecting on wet surfaces.',
  'COLOR PALETTE: Dual-tone split lighting. Deep Blues vs Hot Pinks.',
  'VOLUMETRICS: Heavy steam, rain haze, diffusion filters (ProMist 1/4).',
  40
);

-- Estilo: Soft Commercial
INSERT INTO lightscaler_prompt_rules (
  slider_name, style_slug,
  protocol_header,
  light_source_physics,
  white_balance_logic,
  dynamic_range_strategy,
  priority_weight
) VALUES (
  'lighting_style', 'commercial_beauty_v32',
  '[LIGHTING SETUP: HIGH-END BEAUTY]',
  'KEY LIGHT: Large Octabox (butterfly lighting) directly above camera. FILL: White bounce cards from below (Clamshell setup).',
  'WHITE BALANCE: Perfectly neutral (5600K). Clean, sterile whites.',
  'DYNAMIC RANGE: Low contrast, high key. Lift shadows to Zone 6. No deep blacks.',
  40
);

-- ================================================================
-- STYLESCALER RULES - Textura, Cine, Styling
-- ================================================================

-- STYLING_PIEL: Nivel 1-3 (Documentary Realism)
INSERT INTO stylescaler_prompt_rules (
  slider_name, slider_value_min, slider_value_max,
  art_direction_header,
  texture_quality_prompt,
  anamorphic_optics_prompt,
  hallucination_density,
  guidance_scale,
  priority_weight
) VALUES (
  'styling_piel', 1, 3,
  '[STYLE: DOCUMENTARY REALISM]',
  'Maintain original texture frequency. Do not add artificial grain or sharpness.',
  'Standard spherical lens characteristics. No stylized flares or bokeh.',
  0.1,
  5.0,
  10
);

-- STYLING_PIEL: Nivel 4-7 (Editorial Clean)
INSERT INTO stylescaler_prompt_rules (
  slider_name, slider_value_min, slider_value_max,
  art_direction_header,
  texture_quality_prompt,
  styling_prompt,
  environment_prompt,
  hallucination_density,
  guidance_scale,
  priority_weight
) VALUES (
  'styling_piel', 4, 7,
  '[STYLE: HIGH-END COMMERCIAL EDITORIAL]',
  'Enhance micro-contrast in key areas (eyes, jewelry). Clean skin texture without blurring.',
  'Professional grooming. Tidy hair, hydrated lips.',
  'Clean up background distractions. Unify environmental lighting.',
  0.4,
  7.5,
  20
);

-- STYLING_PIEL: Nivel 8-10 (Drama Club & Reality Warp)
INSERT INTO stylescaler_prompt_rules (
  slider_name, slider_value_min, slider_value_max,
  art_direction_header,
  texture_quality_prompt,
  anamorphic_optics_prompt,
  environment_prompt,
  styling_prompt,
  hallucination_density,
  guidance_scale,
  priority_weight
) VALUES (
  'styling_piel', 8, 10,
  '[STYLE OVERRIDE: CINEMATIC DRAMA CLUB & REALITY WARP]. The goal is NOT stock photography. We seek high contrast, emotion, and a surreal "dream-like" clarity.',
  'INJECT MASSIVE HIGH-FREQUENCY DETAIL: You must HALLUCINATE organic roughness (skin pores, vellus hair, fabric threads, brick imperfections) to kill the "plastic/mobile" look. Every surface must have tactile weight.',
  'ANAMORPHIC OPTICS ("HOLLYWOOD LOOK"): Simulate Panavision C-Series Anamorphic Lens characteristics. Create subtle oval bokeh in out-of-focus areas. Allow controlled horizontal flares (blue/gold) if light hits the lens directly. Instant cinematic feel.',
  'SCENOGRAPHY ENHANCEMENT: If background is dull, inject "Cinematic Atmosphere". Add depth cues, subtle haze, and rich textures to walls/floors. Avoid sterile white walls.',
  'STYLING PRIORITY: Subjects must look "Dead Sharp" and professionally styled. Reconstruct makeup texture, fabric folds, and accessories with macro-level definition.',
  0.8,
  12.0,
  30
);

-- ================================================================
-- COMMIT
-- ================================================================
COMMIT;
