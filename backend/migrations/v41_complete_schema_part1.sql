-- ================================================================
-- LUXSCALER v41.0 - COMPLETE DATABASE SCHEMA
-- ================================================================
-- Basado en 01luxv41sql.md, 02luxv41edge.md, 03luxv31logic.md

-- ================================================================
-- 1. TIER CONFIG (Gestión de Usuarios y Suscripciones)
-- ================================================================

CREATE TABLE IF NOT EXISTS tier_config (
    id SERIAL PRIMARY KEY,
    tier_name TEXT UNIQUE NOT NULL,
    tier_code TEXT UNIQUE NOT NULL,

    -- Tokens y Límites
    preview_tokens_monthly INT DEFAULT 0,
    refine_tokens_each INT DEFAULT 0,
    unlock_tokens_each INT DEFAULT 0,
    upscale_8k_cost_tokens INT DEFAULT 0,

    -- Capacidades
    can_refine BOOLEAN DEFAULT false,
    can_upscale_8k BOOLEAN DEFAULT false,
    batch_size_limit INT DEFAULT 1,

    -- Precios
    cost_unlock_usd DECIMAL(5, 2) DEFAULT 0,
    cost_8k_usd DECIMAL(5, 2) DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar 4 Tiers
INSERT INTO tier_config (tier_name, tier_code, preview_tokens_monthly, refine_tokens_each, unlock_tokens_each, upscale_8k_cost_tokens, can_refine, can_upscale_8k, batch_size_limit, cost_unlock_usd, cost_8k_usd)
VALUES
('AUTO', 'AUTO', 100, 0, 0, 0, false, false, 1, 0.00, 0.00),
('USER', 'USER', 0, 5, 20, 0, false, false, 1, 2.99, 0.00),
('PRO', 'PRO', 0, 3, 15, 50, true, false, 6, 1.99, 9.99),
('PRO_LUX', 'PRO_LUX', 0, 2, 12, 30, true, true, 12, 0.99, 4.99);

-- ================================================================
-- 2. TAXONOMY DEFINITIONS (21 Categorías)
-- ================================================================

CREATE TABLE IF NOT EXISTS taxonomy_definitions (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    category_name TEXT NOT NULL,
    category_group TEXT NOT NULL,
    visual_description TEXT NOT NULL,
    strategy TEXT NOT NULL,
    slider_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar 21 Categorías
INSERT INTO taxonomy_definitions (code, category_name, category_group, visual_description, strategy, slider_config)
VALUES
('CAT01', 'SELFIE_CASUAL', 'SERES VIVOS', 
 'Selfie con nariz grande, distorsión de gran angular', 
 'VIRTUAL 50MM LENS. Flatten nasal distortion by simulating a telephoto perspective. Correct arm and shoulder foreshortening.',
 '{"s1": "FORCE", "p2": "FORCE", "l1": "HIGH"}'::jsonb),

('CAT02', 'PRO_HEADSHOT', 'SERES VIVOS',
 'Retrato de estudio para LinkedIn, ojos enfocados, fondo limpio',
 'FREQUENCY SEPARATION. High-end retouch preserving skin texture. Razor-sharp eyes and iris detail.',
 '{"s1": "FORCE", "p3": "FORCE", "l6": "HIGH", "p8": "HIGH"}'::jsonb),

('CAT03', 'GROUP_EVENT', 'SERES VIVOS',
 'Grupo de personas, todo en foco, evento social',
 'HYPERFOCAL STACK. Deep depth of field simulation from foreground to background. Geometric clarity.',
 '{"p8": "FORCE", "p3": "HIGH", "p2": "MED"}'::jsonb),

('CAT04', 'PET_PORTRAIT', 'SERES VIVOS',
 'Mascota (perro/gato), pelaje, ojos brillantes',
 'FUR SYNTHESIS. Reconstruct individual hair strands. Sharpen catchlights in eyes.',
 '{"p6": "FORCE", "p3": "HIGH", "l1": "HIGH", "s1": "MED"}'::jsonb),

('CAT05', 'FASHION_LOOKBOOK', 'SERES VIVOS',
 'Modelaje de ropa, telas, enfoque en prendas',
 'FABRIC PHYSICS UPGRADE. Increase thread visibility. Enhance material quality semantically.',
 '{"s3": "FORCE", "p3": "HIGH", "l6": "HIGH", "s8": "MED"}'::jsonb),

('CAT06', 'MACRO_NATURE', 'SERES VIVOS',
 'Plantas, flores, insectos a nivel macro',
 'FOCUS STACKING. Simulate infinite depth of field. Render entire subject in focus.',
 '{"p3": "FORCE", "p8": "FORCE", "p6": "HIGH", "l1": "MED"}'::jsonb),

('CAT07', 'INTERIOR_LIVING', 'RÍGIDOS',
 'Interior de casa/apartamento, líneas rectas, paredes',
 'VERTICAL LOCK. Correct wall angles to 90 degrees. Balance window exposure (HDR interior look).',
 '{"p2": "FORCE", "p5": "HIGH", "l2": "HIGH"}'::jsonb),

('CAT08', 'KITCHEN_BATH', 'RÍGIDOS',
 'Cocina o baño con brillo y materiales reflectantes',
 'PREMIUM SURFACE GLOSS. Maximize specularity on marble, tiles. Remove dust spots.',
 '{"p1": "MED", "s9": "FORCE", "l6": "FORCE"}'::jsonb),

('CAT09', 'EXTERIOR_FACADE', 'RÍGIDOS',
 'Fachada de edificio, cielo, líneas arquitectónicas',
 '2-POINT PERSPECTIVE STRAIGHTENING. Correct architectural converging lines. Replace sky if blown out.',
 '{"p2": "FORCE", "l4": "FORCE", "s7": "HIGH"}'::jsonb),

('CAT10', 'CAR_SALE_STD', 'RÍGIDOS',
 'Fotografía de coche para venta, metal, reflexiones',
 'CERAMIC COATING POLISH. Maximize gloss and reflection sharpness. Remove water marks and dust.',
 '{"p1": "MED", "s9": "FORCE", "l3": "HIGH"}'::jsonb),

('CAT11', 'MOTORCYCLE_DETAIL', 'RÍGIDOS',
 'Motocicleta, cromo, detalles mecánicos',
 'CHROME POLISH HIGH CONTRAST. Sharpen engine fins. Increase specular highlights.',
 '{"s9": "FORCE", "p3": "HIGH", "l6": "HIGH"}'::jsonb),

('CAT12', 'PRODUCT_STUDIO', 'PRODUCTOS',
 'Producto sobre fondo blanco puro 255,255,255',
 'PURE WHITE BACKGROUND LOCK. Preserve exact white (255,255,255). Hard edge definition.',
 '{"p3": "FORCE", "p2": "LOW", "l6": "FORCE", "l2": "HIGH"}'::jsonb),

('CAT13', 'JEWELRY_MACRO', 'PRODUCTOS',
 'Joyas, gemas, macro photography',
 'FOCUS STACKING + STAR FILTER. Entire gem in sharp focus. Maximize refraction and sparkle.',
 '{"p3": "FORCE", "p8": "FORCE", "s9": "FORCE", "p1": "FORCE"}'::jsonb),

('CAT14', 'FOOD_MENU', 'PRODUCTOS',
 'Comida para menú de restaurante',
 'SUCCULENCE ENHANCEMENT. Sharpen texture. Enhance oil/steam appearance. Warm color grading.',
 '{"p3": "HIGH", "s9": "FORCE", "s8": "MED", "l5": "HIGH"}'::jsonb),

('CAT15', 'SCANNED_OFFICIAL', 'DOCUMENTAL',
 'Documento oficial, factura, recepción escaneada',
 'FLATTEN DOC + OCR BOOST. De-skew lines. Darken ink. Binary contrast for text legibility.',
 '{"p2": "FORCE", "l6": "FORCE", "p1": "HIGH"}'::jsonb),

('CAT16', 'OLD_MANUSCRIPT', 'DOCUMENTAL',
 'Manuscrito antiguo, papel envejecido',
 'PAPER TEXTURE PRESERVATION. Keep grain and aging marks. Restore contrast subtly.',
 '{"p1": "FORCE", "l6": "MED", "p6": "LOW"}'::jsonb),

('CAT17', 'DAMAGED_PHOTO', 'DOCUMENTAL',
 'Fotografía rota, con grietas, manchas de humedad',
 'PHYSICAL REPAIR + FACE RECOVERY. Inpaint tears. Hallucinate missing facial features using symmetry.',
 '{"p1": "FORCE", "p3": "FORCE", "l6": "MED"}'::jsonb),

('CAT18', 'COLORIZE_VINTAGE', 'DOCUMENTAL',
 'Foto en blanco y negro que requiere colorización',
 'HISTORICAL COLOR PALETTE. Apply era-appropriate colors. Preserve grain and film look.',
 '{"p7": "MED", "s8": "FORCE", "l5": "FORCE"}'::jsonb),

('CAT19', 'SKETCH_DRAWING', 'DOCUMENTAL',
 'Dibujo a lápiz o tinta sobre papel',
 'GRAPHITE TEXTURE PRESERVATION. Clean smudges. Keep pencil strokes. Remove background noise.',
 '{"p1": "FORCE", "p6": "FORCE", "l6": "MED"}'::jsonb),

('CAT20', 'DIGITAL_ILLUSTRATION', 'DOCUMENTAL',
 'Ilustración digital o vector',
 'VECTOR DENOISE. Remove JPEG artifacts. Preserve sharp lines. Flat shading enhancement.',
 '{"p1": "FORCE", "p3": "LOW", "l6": "FORCE"}'::jsonb),

('CAT21', 'ERROR_UNIDENTIFIED', 'FALLBACK',
 'Imagen ilegible, completamente negra o dañada',
 'REIMAGINE MODE. Input serves only as color guide. Hallucinate plausible subject from scratch.',
 '{"p6": "FORCE", "p5": "HIGH", "s7": "HIGH"}'::jsonb);

-- ================================================================
-- 3. DIAGNOSIS DEFINITIONS (10 Diagnósticos)
-- ================================================================

CREATE TABLE IF NOT EXISTS diagnosis_definitions (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    diagnosis_name TEXT NOT NULL,
    visual_description TEXT NOT NULL,
    strategy TEXT NOT NULL,
    slider_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar 10 Diagnósticos
INSERT INTO diagnosis_definitions (code, diagnosis_name, visual_description, strategy, slider_config)
VALUES
('IN02', 'MOBILE_PROCESSED', 
 'Smartphone photo with computational photography artifacts: waxy skin, over-smoothed textures, watercolor-effect zoom, artificial sharpening halos.',
 'ORGANIC TEXTURE INJECTION. Strip digital plasticity. Re-synthesize film-like organic surface. Generate high-frequency micro-texture (pores, fabric weave). Mask artificial sharpening and replace with natural optical acuity.',
 '{"p6": "HIGH", "s1": "HIGH", "p3": "HIGH"}'::jsonb),

('IN03', 'SOFT_FOCUS',
 'Image where focal plane missed subject (ears sharp, eyes soft) or general lens softness. No distinct high-frequency edges.',
 'DEFINITION RE-SYNTHESIS. Hallucinate missing definition. Semantic understanding to repaint features (eyelashes, iris, text) with Leica-like sharpness. Discard blurry pixels as bad data.',
 '{"p3": "FORCE", "p6": "HIGH", "l1": "FORCE"}'::jsonb),

('IN04', 'MOTION_BLUR',
 'Directional streaking from camera shake or subject movement. Edges shifted, details smeared along vector.',
 'STATIC RECONSTRUCTION. Analyze motion vector to reverse smear. Re-draw edges as if 1/8000s shutter. Synthesize lost geometry. Replace streaks with crisp, stationary boundaries.',
 '{"p4": "FORCE", "p3": "HIGH"}'::jsonb),

('IN05', 'ISO_NOISE',
 'Low-light photography: heavy chromatic noise (color splotches) and luma noise (grain) obscuring fine detail.',
 'SIGNAL PURIFICATION. Separate image signal from noise floor. Hallucinate underlying texture visible in good lighting. Repaint micro-surfaces while maintaining atmospheric darkness.',
 '{"p1": "FORCE", "p3": "HIGH", "l1": "MED"}'::jsonb),

('IN06', 'COMPRESSION_ARTIFACTS',
 'Heavy compression degradation (WhatsApp, web thumbnails). Macro-blocking, banding in gradients, mosquito noise.',
 'ARTIFACT HALLUCINATION. Treat blocks as corruption map. Dissolve grid artifacts. Generate continuous smooth surfaces. Infer original gradients and paint over blocks.',
 '{"p1": "FORCE", "p3": "HIGH"}'::jsonb),

('IN07', 'PIXELATED_LOW_RES',
 'Extremely low-resolution: face might be 50x50 pixels. Features represented as single blocks of color.',
 'SEMANTIC UPSCALING (8K). Generative approach where input serves as color guide only. Understand that beige block = nose. Generate fully detailed nose with skin texture, lighting, 3D volume.',
 '{"p6": "FORCE", "p9": "FORCE", "s1": "HIGH"}'::jsonb),

('IN08', 'VINTAGE_FADED',
 'Old photographs with chemical decay: faded blacks (grey/green), yellowed highlights, loss of local contrast.',
 'CHEMICAL & CONTRAST RESTORATION. Expand collapsed histogram. Recover true black (Zone 0) and true white. Neutralize chemical tint. Re-define edges that physically bled over decades.',
 '{"l7": "FORCE", "l6": "HIGH", "s8": "HIGH"}'::jsonb),

('IN09', 'PHYSICAL_DAMAGE',
 'Photos with physical obstructions: tears, scratches, mold spots, tape marks, water damage. Data completely missing.',
 'STRUCTURAL INPAINTING. Contextual imagination. Analyze surrounding patterns (plaid shirt, brick wall). Seamlessly weave texture into damaged gaps. Match aging of rest of photo.',
 '{"p1": "FORCE", "p6": "HIGH"}'::jsonb),

('IN10', 'STRUCTURAL_LOSS',
 'Severe damage: significant semantic parts missing (half face torn, missing eye, destroyed background).',
 'ANATOMICAL RECONSTRUCTION. Rely on anatomical knowledge and symmetry. Rebuild missing biological features (generate new eye matching existing). Hallucinate plausible scenery.',
 '{"p6": "FORCE", "p3": "FORCE", "s1": "HIGH"}'::jsonb),

('IN11', 'CRITICAL_FAILURE',
 'Technically unusable: almost pitch black, completely blown out white, or corrupted signal. Content barely discernible.',
 'TOTAL RE-CREATION. Input treated as loose compositional sketch. Completely redraw scene using faint outlines to determine pose/subject matter. Generate 100% of lighting, texture, definition.',
 '{"p5": "FORCE", "p6": "FORCE", "l1": "FORCE"}'::jsonb);

-- ================================================================
-- 4. SLIDER DEFINITIONS (27 Sliders × 5 Niveles = 135 Instrucciones)
-- ================================================================

CREATE TABLE IF NOT EXISTS slider_definitions (
    id SERIAL PRIMARY KEY,
    slider_key TEXT UNIQUE NOT NULL,
    pillar TEXT NOT NULL,
    ui_title TEXT NOT NULL,
    ui_description TEXT NOT NULL,
    instruction_off TEXT,
    instruction_low TEXT,
    instruction_med TEXT,
    instruction_high TEXT,
    instruction_force TEXT,
    auto_default INT DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
