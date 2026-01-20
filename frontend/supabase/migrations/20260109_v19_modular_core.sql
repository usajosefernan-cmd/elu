
-- LUXIFIER v19 OMNIBUS - MODULAR ARCHITECTURE MIGRATION
-- Created: 2026-01-09
-- Purpose: Implement Forensic, Style, and Light modules for dynamic prompt assembly.

-- ==============================================================================
-- 1. LUX MODULE FORENSIC (Technical Integrity & Repair)
-- ==============================================================================
create table if not exists public.lux_module_forensic (
    id text primary key,
    trigger_tag text, -- e.g. 'barrel_distortion', 'underexposed'
    intensity_level integer default 5,
    prompt_text text not null,
    created_at timestamp with time zone default now()
);

alter table public.lux_module_forensic enable row level security;
create policy "Public read forensic" on public.lux_module_forensic for select using (true);

-- DATA SEED (Audit v19)
insert into public.lux_module_forensic (id, trigger_tag, intensity_level, prompt_text) values
('fix_optics_geom', 'barrel_distortion,keystoning', 8, 'PHASE OPTICAL RECOVERY: Activate RECTILINEAR CORRECTION MODE. Fix barrel/pincushion distortion. Force horizon & vertical alignment to absolute 0°. Re-render scene as if shot with a 50mm Prime Lens (Rectilinear Projection).'),
('fix_blur_shutter', 'motion_blur,camera_shake', 9, 'CRITICAL FOCUS OVERRIDE: Detect motion blur/trepidation. DISCARD the blurry pixel data. Simulate a virtual re-shoot with 1/8000s shutter speed to freeze all motion. Force "Dead Sharp" focus on main subject.'),
('fix_exposure_zone', 'underexposed,crushed_shadows', 7, 'SIGNAL INTEGRITY: Activate 32-BIT NORMALIZATION PROTOCOL. Anchor Black Point at (0,0,0). Aggressively lift Zone 1-3 (Deep Shadows) to reveal latent textures hidden in darkness without washing out global contrast.'),
('fix_highlight_clip', 'overexposed,blown_out', 7, 'HIGHLIGHT ROLL-OFF: Identify clipped highlights (Zone 9-10). Apply a "Soft Clip" curve. INVENT smooth transitions and re-generate texture inside bright areas (e.g., skin pores in flash glare).'),
('fix_color_science', 'color_cast,tint', 5, 'CONTEXTUAL WHITE BALANCE: Neutralize technical color casts (sickly green fluorescent, muddy tungsten). Remove the "tint" but PRESERVE the atmospheric "temperature" (mood).'),
('fix_res_fractal', 'low_res,pixelated', 10, 'FRACTALITY INJECTION: Input is low-res/corrupt. Activate Generative Re-Invention. Hallucinate brand new, razor-sharp high-frequency details (fabric weave, brick textures) from scratch. Output: Native 8K UHD.'),
('fix_skin_physics', 'wax_skin,plastic_skin', 8, 'MATERIAL PHYSICS: Detect waxy/plastic skin caused by bad denoising. INJECT organic roughness: distinct skin pores, vellus hair, and iris trabeculae. Avoid "mobile phone" smoothing.'),
('mode_true_hdr', 'user_pro_hdr', 10, 'OUTPUT FORMAT: 32-bit Floating Point (Linear workflow). DO NOT CLIP values > 1.0. Preserve full dynamic range for EXR/TIFF compositing. NO tone mapping compression applied.')
on conflict (id) do update set prompt_text = excluded.prompt_text;


-- ==============================================================================
-- 2. LUX MODULE STYLE (Material Physics, Biology, Trends)
-- ==============================================================================
create table if not exists public.lux_module_style (
    id text primary key,
    category text, -- 'HUMAN', 'FASHION', 'ARCH', 'PRODUCT', 'TREND'
    mode text, -- 'REPAIR', 'REIMAGINE'
    prompt_text text not null,
    hallucination_settings jsonb, -- { creativity: 5, fractality: 5 }
    created_at timestamp with time zone default now()
);

alter table public.lux_module_style enable row level security;
create policy "Public read style" on public.lux_module_style for select using (true);

-- DATA SEED (Audit v19)
insert into public.lux_module_style (id, category, mode, prompt_text, hallucination_settings) values
-- HUMAN
('skin_forensic', 'HUMAN', 'REPAIR', 'BIO-PHYSICS: Apply Frequency Separation. Layer 1: High-freq texture (pores, micro-wrinkles). Layer 2: Low-freq tone. Inject Subsurface Scattering (SSS).', '{"creativity": 2, "resmblance": "HIGH"}'),
('eye_reconstruct', 'HUMAN', 'REPAIR', 'OCULAR PHYSICS: Reconstruct Iris Trabeculae (fibrous tissue). Generate sharp, wet specular catchlights. Ensure limbal ring definition. Strict anatomical symmetry.', '{"creativity": 2}'),
('hair_follicle', 'HUMAN', 'REPAIR', 'KERATIN SIMULATION: Hallucinate individual hair strands. Inject "flyaways" and vellus hair (peach fuzz) on skin edges for organic realism.', '{"creativity": 3}'),
('teeth_dental', 'HUMAN', 'REPAIR', 'DENTAL OPTICS: Separate individual teeth. Enamel texture must have slight translucency at edges. Restore gum specularity.', '{"creativity": 2}'),
('makeup_glam', 'HUMAN', 'REIMAGINE', 'COSMETIC LAYER: Apply professional contouring (Dodge & Burn). Eyeliner symmetry fix. Lip gloss specularity. Skin Texture: Porcelain but with visible pores.', '{"creativity": 4}'),

-- FASHION
('fabric_weave', 'FASHION', 'REPAIR', 'TEXTILE HALLUCINATION: Invent 8K weave topology. If Suit: "Wool twill pattern". If Silk: "Anisotropic sheen". Re-thread fraying edges.', '{"fractality": 7}'),
('ironing_fix', 'FASHION', 'REPAIR', 'VIRTUAL IRONING: Analyze fabric tension map. Remove unintentional chaotic wrinkles (creases). PRESERVE structural draping folds caused by gravity.', '{"creativity": 3}'),
('luxury_material','FASHION', 'REIMAGINE', 'MATERIAL UPGRADE: Transmute cheap polyester to Velvet/Cashmere. Deepen blacks (light absorption). Enhance embroidery thread count.', '{"creativity": 5}'),

-- ARCH & PRODUCT
('arch_concrete', 'ARCH', 'REIMAGINE', 'SURFACE AGEING: Inject "Weathering" effects. Micro-cracks in concrete. Water stains. Fractal Noise: High-frequency grit on stone surfaces.', '{"fractality": 8}'),
('glass_refraction', 'PRODUCT', 'REPAIR', 'RAYTRACING PHYSICS: Correct Index of Refraction (IOR) for glass (1.52). Sharpen internal reflections. Remove milky haze.', '{"creativity": 2}'),
('product_macro', 'PRODUCT', 'REIMAGINE', 'MACRO DETAIL: Hallucinate dust particles on surface (imperfection = realism). Sharpen label typography (OCR Lock). Enhance metallic anisotropy.', '{"fractality": 9}'),

-- TRENDS
('trend_granny', 'TREND', 'REIMAGINE', 'STYLE: GrannyWave 2026. Inject maximalist textures. Hyper-saturated floral patterns. Eclectic clutter. Tactile fabric weaving.', '{"creativity": 8}'),
('trend_warp', 'TREND', 'REIMAGINE', 'STYLE: Reality Warp. Ethereal atmosphere. Dream-like logic. Soften edges. Inject subtle surreal elements. Color: Pastel iridescence.', '{"creativity": 9}'),
('trend_imperfect','TREND', 'REIMAGINE', 'STYLE: Imperfect by Design. Simulate analog 35mm film errors. Light leaks. Film grain ISO 800.', '{"fractality": 3}'),
('trend_biolum', 'TREND', 'REIMAGINE', 'NATURE WARP: Infuse flora with bioluminescence. Translucent leaf structures. Glowing veins. Dream-like logic.', '{"creativity": 9}')
on conflict (id) do update set prompt_text = excluded.prompt_text;


-- ==============================================================================
-- 3. LUX MODULE LIGHT (Physics & Rigs)
-- ==============================================================================
create table if not exists public.lux_module_light (
    id text primary key,
    target_category text, 
    technique text, 
    prompt_text text not null,
    created_at timestamp with time zone default now()
);

alter table public.lux_module_light enable row level security;
create policy "Public read light" on public.lux_module_light for select using (true);

-- DATA SEED (Audit v19)
insert into public.lux_module_light (id, target_category, technique, prompt_text) values
-- HUMAN
('light_human_studio_glam', 'HUMAN', 'Butterfly', 'LIGHTING PHYSICS: High-Key Setup. Place main light source directly above camera axis. Eliminate nose shadows. Create distinct circular "catchlights" in upper iris. Soft fill from below.'),
('light_human_drama_noir', 'HUMAN', 'Rembrandt', 'LIGHTING PHYSICS: High Contrast Ratio (1:8). Single hard light source at 45-degree angle. Cast distinct shadow from nose connecting to lip corner. Deep shadows (Zone 2).'),
('light_human_natural_soft','HUMAN', 'Diffused', 'LIGHTING PHYSICS: Diffused Skylight simulation. Large, soft light source simulating overcast sky (Cloudy bright). Wrap-around lighting. No harsh shadows.'),
('light_human_backlight', 'HUMAN', 'Golden Hour', 'LIGHTING PHYSICS: Strong Backlighting (Contre-jour). Sun position: Low behind subject. Create "Halo" effect on hair edges. Allow light to flare into lens.'),
('light_human_flash', 'HUMAN', 'Flash', 'LIGHTING PHYSICS: Direct On-Camera Flash. Hard shadows behind subject. Vignetting. High saturation. "Paparazzi" aesthetic.'),

-- LANDSCAPE
('land_zone_recovery', 'LANDSCAPE', 'Zone System', 'DIAGNOSIS: LOW-LIGHT RECOVERY. ZONE SYSTEM: STRICTLY Anchor Black Point at (0,0,0). Aggressively lift Zones 1-3 (Deep Shadows) to reveal latent textures. HDR 2.0: Local Tone Mapping.'),
('land_blue_hour', 'LANDSCAPE', 'Twilight', 'ATMOSPHERE INJECTION: Activate BLUE HOUR AESTHETIC. Global Ambience: Cool/Blue (8000K). Contrast: Force artificial lights to Warm Tungsten (3200K).'),
('land_golden', 'LANDSCAPE', 'Golden Hour', 'LIGHTING: Low angle sun. Long shadows. Warm volumetric god-rays. Polarized sky (Deep Blue). Enhanced dynamic range.'),
('land_ansel', 'LANDSCAPE', 'Monochrome', 'LIGHTING: Mono-chromatic. Zone System Recovery: Anchor Blacks at 0, Lift Zones 1-3. Red Filter simulation for dramatic dark skies.'),

-- PRODUCT & AUTO
('car_studio_liquid', 'AUTOMOTIVE', 'Liquid Light', 'LIGHTING: "Liquid Light" setup. Massive continuous softboxes overhead. Create continuous, unbroken highlight lines along the car body to emphasize curvature.'),
('car_action_blur', 'AUTOMOTIVE', 'Action', 'PHYSICS: Virtual Rig Shot. Shutter Speed: 1/30s. Motion: Lock car sharpness perfectly, force directional motion blur on background and wheels. Light: Golden Hour.'),
('lux_diamond', 'PRODUCT', 'Dispersion', 'OPTICS: Macro 100mm f/2.8. Focus Stacking. Light: Sparkle injection. Use "Hard Point Source" to trigger dispersion (rainbow fire) in diamonds.'),
('lux_perfume', 'PRODUCT', 'Caustics', 'RAYTRACING: Calculate Index of Refraction (IOR) for glass/liquid. Light: Backlight (translucency). Create "Caustics" projected on the floor.'),

-- ARCHITECTURE
('arch_exterior_grand', 'ARCH', 'Grazing', 'LIGHTING PHYSICS: Grazing Light. Sun angle: 45-degrees low. Maximize texture relief on building materials (stone, concrete). Cast long, dramatic shadows.'),
('arch_interior_lux', 'ARCH', 'Mixed Temp', 'LIGHTING PHYSICS: Mixed Color Temperature balance. Balance cool daylight from windows (6500K) with warm interior practicals (3000K). Exposure Fusion.'),

-- HERITAGE & DOCS
('hist_damage_fill', 'HERITAGE', 'Infill', 'PROTOCOL: TIME MACHINE FIX. Input contains total signal loss. Action: Contextual Infilling. Infer what "should" be there based on surrounding pixels. DO NOT blur the damage; PAINT NEW REALITY.'),
('doc_ocr_lock', 'TEXT', 'Hard Lock', 'OCR PRESERVATION: Strict Typographic Sharpness. Rule: Enhance edge contrast of letters but DO NOT hallucinate new characters. If text is illegible, leave it blurry. Flatten paper warp.')
on conflict (id) do update set prompt_text = excluded.prompt_text;
