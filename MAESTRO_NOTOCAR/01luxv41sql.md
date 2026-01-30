# LUXSCALER: ARQUITECTURA DATA-DRIVEN COMPLETA

## PARTE 1: BASE DE DATOS SQL (El Cerebro)

### 1.1 TIER CONFIG (Gestión de Usuarios y Suscripciones)

```sql
-- TABLA: Configuración de Tiers y Tokens
CREATE TABLE tier_config (
    id SERIAL PRIMARY KEY,
    tier_name TEXT UNIQUE NOT NULL,
    tier_code TEXT UNIQUE NOT NULL, -- 'AUTO', 'USER', 'PRO', 'PRO_LUX'

    -- Tokens y Límites
    preview_tokens_monthly INT DEFAULT 0,
    refine_tokens_each INT DEFAULT 0,
    unlock_tokens_each INT DEFAULT 0,
    upscale_8k_cost_tokens INT DEFAULT 0,

    -- Capacidades
    can_refine BOOLEAN DEFAULT false,
    can_upscale_8k BOOLEAN DEFAULT false,
    batch_size_limit INT DEFAULT 1,

    -- Precios (Para la tienda)
    cost_unlock_usd DECIMAL(5, 2) DEFAULT 0,
    cost_8k_usd DECIMAL(5, 2) DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INSERTS: 4 Tiers (Exactos del Documento)
INSERT INTO tier_config (tier_name, tier_code, preview_tokens_monthly, refine_tokens_each, unlock_tokens_each, upscale_8k_cost_tokens, can_refine, can_upscale_8k, batch_size_limit, cost_unlock_usd, cost_8k_usd)
VALUES
('AUTO', 'AUTO', 100, 0, 0, 0, false, false, 1, 0.00, 0.00),
('USER', 'USER', 0, 5, 20, 0, false, false, 1, 2.99, 0.00),
('PRO', 'PRO', 0, 3, 15, 50, true, false, 6, 1.99, 9.99),
('PRO_LUX', 'PRO_LUX', 0, 2, 12, 30, true, true, 12, 0.99, 4.99);
```

---

### 1.2 TAXONOMY DEFINITIONS (21 Categorías)

```sql
-- TABLA: Definiciones de Categorías de Imágenes
CREATE TABLE taxonomy_definitions (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,           -- 'CAT01', 'CAT02', etc.
    category_name TEXT NOT NULL,         -- 'SELFIE_CASUAL', 'PRO_HEADSHOT'
    category_group TEXT NOT NULL,        -- 'SERES VIVOS', 'RÍGIDOS', 'PRODUCTOS', 'DOCUMENTAL', 'FALLBACK'

    visual_description TEXT NOT NULL,    -- Descripción visual para Vision
    strategy TEXT NOT NULL,              -- Estrategia de restauración

    -- Configuración Automática de Sliders (JSON)
    slider_config JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INSERTS: 21 Categorías Completas
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
```

---

### 1.3 DIAGNOSIS DEFINITIONS (10 Diagnósticos)

```sql
-- TABLA: Definiciones de Defectos Detectados por Vision
CREATE TABLE diagnosis_definitions (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,           -- 'IN01', 'IN02', etc.
    diagnosis_name TEXT NOT NULL,        -- 'MOBILE_PROCESSED', 'SOFT_FOCUS', etc.

    visual_description TEXT NOT NULL,    -- Características visuales del defecto
    strategy TEXT NOT NULL,              -- Cómo solucionarlo

    -- Configuración de Sliders Override
    slider_config JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INSERTS: 10 Diagnósticos Completos
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
```

---

### 1.4 SLIDER DEFINITIONS (27 Sliders × 5 Niveles = 135 Instrucciones)

```sql
-- TABLA: Definiciones de Sliders (El Corazón de LuxScaler)
CREATE TABLE slider_definitions (
    id SERIAL PRIMARY KEY,
    slider_key TEXT UNIQUE NOT NULL,       -- 'p1', 'p2', ... 's1', ... 'l1', ...
    pillar TEXT NOT NULL,                  -- 'PHOTOSCALER', 'STYLESCALER', 'LIGHTSCALER'
    ui_title TEXT NOT NULL,                -- Nombre mostrado en UI
    ui_description TEXT NOT NULL,          -- Descripción larga

    instruction_off TEXT,                  -- Nivel 0: OFF
    instruction_low TEXT,                  -- Nivel 1-3: LOW
    instruction_med TEXT,                  -- Nivel 4-6: MED
    instruction_high TEXT,                 -- Nivel 7-9: HIGH
    instruction_force TEXT,                -- Nivel 10: FORCE

    auto_default INT DEFAULT 5,            -- Valor automático (0-10)

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INSERTS: 27 SLIDERS COMPLETOS (p1-p9, s1-s9, l1-l9)

-- ===== PHOTOSCALER (9 sliders) =====

INSERT INTO slider_definitions 
(slider_key, pillar, ui_title, ui_description, instruction_off, instruction_low, instruction_med, instruction_high, instruction_force, auto_default)
VALUES
('p1', 'PHOTOSCALER', 'Limpieza de Señal', 
 'Gestiona el ruido y la pureza de la imagen sin perder la textura orgánica del sensor.',
 'PRESERVE PATINA. Treat sensor noise and grain as essential texture. Do not denoise. Maintain organic film feel.',
 'CHROMA DENOISE. Remove only color noise (purple/green blotches). Keep Luminance grain to prevent waxy skin.',
 'SIGNAL POLISH. Standard ISO reduction. Clean smooth surfaces (walls, sky) but protect high-frequency texture areas.',
 'COMMERCIAL CLEANUP. High-end editorial denoising. Remove all dust spots and sensor dirt. Smooth gradients.',
 'PRISTINE SIGNAL PROCESSING. HIGH-END FREQUENCY SEPARATION CLEANUP. ZERO ARTIFACTS. PERFECT SENSOR READOUT.',
 5),

('p2', 'PHOTOSCALER', 'Corrección Técnica',
 'Corrige la distorsión de la lente y la perspectiva como una cámara técnica.',
 'OPTICAL LOCK. Preserve original lens character (including barrel/pincushion distortion). Do not crop.',
 'LENS PROFILE FIX. Correct vignetting (dark corners) and chromatic aberration (color fringing). Keep perspective.',
 'PERSPECTIVE ALIGN. Straighten horizon line. Fix minor vertical keystoning. Center the subject visually.',
 'RECTILINEAR MODE. Remove all lens distortion. Straighten architectural lines. Re-compose edges.',
 'TECHNICAL CAMERA PRECISION. ZERO DISTORTION. TILT-SHIFT LENS ALIGNMENT. PERFECT GRID. FLATTEN FACIAL DISTORTION.',
 4),

('p3', 'PHOTOSCALER', 'Definición Cristalina',
 'Simula la calidad del cristal de la lente (Acutancia y Micro-contraste).',
 'VINTAGE OPTICS. Maintain lens softness, spherical aberration, and dreamy lack of contrast. Preserve bloom.',
 'KIT LENS SHARP. Remove diffraction softness. Apply subtle Unsharp Mask (Radius 0.5px) to define edges.',
 'PRO ZOOM (24-70mm). High micro-contrast. Clear texture separation. Modern lens coating look (no glare).',
 'PRIME LENS (85mm). Razor sharp eyelashes and iris texture. High Acutance. Zero chromatic aberration.',
 'MASTER LENS SIMULATION (ZEISS/LEICA). DIFFRACTION-LIMITED SHARPNESS. MAXIMUM MTF CURVE PERFORMANCE. CRYSTALLINE CLARITY.',
 6),

('p4', 'PHOTOSCALER', 'Congelar Acción',
 'Elimina trepidación y movimiento simulando velocidades de obturación altas.',
 'NATURAL DRAG. Preserve motion blur in moving objects to convey speed/action. Cinematic shutter (1/50s).',
 'STABILIZATION (IS). Remove handheld camera shake (trepidation). Keep motion blur only on very fast objects.',
 'ACTION FREEZE. Sport mode shutter (1/500s). Freeze walking/talking subjects. Sharp edges on moving parts.',
 'HIGH SPEED SYNC. Freeze splashes and hair movement. 1/2000s shutter simulation. Crisp frozen details.',
 '1/8000s SHUTTER SPEED. FROZEN MOTION. ZERO TREPIDATION. STROBOSCOPIC CLARITY. PERFECTLY FROZEN PARTICLES.',
 4),

('p5', 'PHOTOSCALER', 'Rango Dinámico',
 'Recupera información de luces y sombras (Revelado Digital).',
 'ORIGINAL EXPOSURE. Keep crushed blacks (Zone 0) and blown highlights (Zone 10) as mood/style choice.',
 'HISTOGRAM SAFE. Stretch contrast to ensure data exists in shadows. Fix grey blacks. Normalized exposure.',
 'SHADOW RECOVERY. Lift Zone 2-3 details. Soften highlight clipping. Balanced commercial exposure.',
 'HDR TONE MAP. Compress dynamic range for maximum visibility. Reveal details in dark corners and bright windows.',
 '16-BIT TIFF DYNAMIC RANGE. FULL HISTOGRAM RECOVERY. ANSEL ADAMS ZONE SYSTEM OPTIMIZATION. NO CLIPPING.',
 5),

('p6', 'PHOTOSCALER', 'Textura Táctil',
 'Recupera detalle de alta frecuencia (poros, hilos) realista.',
 'SOFT FOCUS. Maintain low-frequency details only. Smooth/plastic look is acceptable if source dictates.',
 'TEXTURE ENHANCE. Sharpen existing surface details (fabric, skin) without adding new information.',
 'DETAIL RESTORE. Reconstruct lost texture in slightly blurry areas. Recover fabric weave definition.',
 'HIGH-FREQ SYNTHESIS. Generate missing pores and fine lines based on context. 4K texture density.',
 'MACRO-FIDELITY RESTORATION. ORGANIC HIGH-FREQUENCY DETAIL. TACTILE SURFACE REALISM. 100MP SENSOR DETAIL.',
 6),

('p7', 'PHOTOSCALER', 'Emulsión Fílmica',
 'Añade estructura de grano orgánico para realismo analógico.',
 'DIGITAL CLEAN. Modern sensor look. Zero grain. Clinical perfection.',
 'ISO 100 GRAIN. Very fine, almost invisible structure. Adds subtle cohesion to digital pixels.',
 'KODAK PORTRA 400. Distinct organic grain structure. Pleasing texture. Warm analog feel.',
 'ILFORD HP5 (1600). Heavy, gritty grain. Documentary aesthetic. High texture perceptibility.',
 'CINEMA FILM STOCK EMULSION. ORGANIC GRAIN STRUCTURE. ANALOG AESTHETIC INTEGRATION. NO DIGITAL NOISE.',
 2),

('p8', 'PHOTOSCALER', 'Profundidad de Campo',
 'Controla el diafragma (f-stop) y el desenfoque del fondo.',
 'HYPERFOCAL (f/16). EVERYTHING IN FOCUS. From foreground to infinity. Maximum context visibility. Landscape standard.',
 'COMMERCIAL (f/8). DEEP DEPTH OF FIELD. Subject clearly sharp, background distinct but slightly softer. Group photo standard.',
 'ENVIRONMENTAL (f/4). NATURAL SEPARATION. Subject pops, background is blurry but recognizable (Contextual).',
 'PORTRAIT (f/1.8). CREAMY BOKEH. Background is washed out. Strong subject separation. Soft highlight circles.',
 'NOCTILUX DREAM (f/0.95). EXTREME BOKEH. RAZOR-THIN FOCAL PLANE. BACKGROUND OBLITERATED INTO CREAMY AESTHETIC.',
 3),

('p9', 'PHOTOSCALER', 'Densidad de Píxel',
 'Aumenta la resolución simulando sensores de formato medio.',
 'NATIVE RES. Keep original pixel count. Upscale via simple bicubic if needed.',
 'SMART UPSCALE (2x). Maintain edge integrity. Smooth out jaggies/pixelation.',
 'SUPER-RES (4x). AI-based detail refinement. Density suitable for 4K displays.',
 'PRINT DENSITY. 300 DPI simulation. Fine detail robustness for large format printing.',
 'PHASE ONE IQ4 QUALITY. 150MP SENSOR SIMULATION. PRINT-READY DENSITY. REMOVE PIXEL GRID.',
 5);

-- ===== STYLESCALER (9 sliders) =====

INSERT INTO slider_definitions 
(slider_key, pillar, ui_title, ui_description, instruction_off, instruction_low, instruction_med, instruction_high, instruction_force, auto_default)
VALUES
('s1', 'STYLESCALER', 'Grooming Pro',
 'Retoque de piel tipo editorial (mantiene poros, quita manchas).',
 'BIOMETRIC LOCK. Preserve all acne, scars, redness, and oil. Documentary skin reality.',
 'HEALTHY GLOW. Remove temporary redness/blotchiness. Even out skin tone. Keep moles/freckles.',
 'STUDIO MATTE. Commercial retouch. Soften pores. Remove shine/oil. Brighten under-eyes.',
 'HIGH-END EDITORIAL. Frequency Separation. Flawless texture. Defined features. Porcelain finish.',
 'HIGH-END RETOUCHING. FLAWLESS COMPLEXION. RETAIN NATURAL PORES & VELLUS HAIR. EVEN SKIN TONE. VOGUE COVER STANDARD.',
 4),

('s2', 'STYLESCALER', 'Estilismo Capilar',
 'Define el cabello y volumen con acabado de salón.',
 'NATURAL MESS. Keep flyaways, frizz, and messy hairline. Authentic bed head.',
 'FRIZZ CONTROL. Smooth out humidity frizz. Tame stray hairs. Healthy shine.',
 'SALON BLOWOUT. Defined volume. Clean hairline. Product-styled finish.',
 'LIQUID HAIR. High gloss. Perfect strand definition. Keratin treatment look.',
 'SESSION STYLIST FINISH. HEALTHY CUTICLE SHINE. CONTROLLED VOLUME. DEFINED STRANDS. NO FLYAWAYS.',
 3),

('s3', 'STYLESCALER', 'Sastrería Digital',
 'Mejora la caída y calidad de los tejidos.',
 'FABRIC LOCK. Keep wrinkles, stains, lint, and wear. Authentic clothing state.',
 'STEAM IRON. Remove accidental fold lines and lint. Refresh fabric appearance.',
 'TEXTURE POP. Sharpen weave pattern. Deepen blacks. Define stitching.',
 'TAILOR FIT. Re-drape fabric to remove bunching. Fix collar alignment. Visual ironing.',
 'SARTORIAL PERFECTION. IMMACULATE TEXTILE DEFINITION. HIGH-THREAD COUNT VISIBILITY. PERFECT DRAPE.',
 4),

('s4', 'STYLESCALER', 'MUA Profesional',
 'Aplica maquillaje correctivo o editorial realista.',
 'BARE FACE. No makeup. Visible capillaries and natural pallor.',
 'NATURAL ENHANCE. "No-makeup" look. Subtle lip tint. Mascara definition.',
 'RED CARPET. Full foundation. Contouring. Defined brows. Lipstick.',
 'EDITORIAL GLAM. High-fashion application. Strobing (Highlight). Graphic liner.',
 'PROFESSIONAL MUA APPLICATION. CONTOUR & HIGHLIGHT SCULPTING. PHOTOGENIC DEFINITION. FLAWLESS APPLICATION.',
 2),

('s5', 'STYLESCALER', 'Set Design',
 'Organiza y limpia el fondo como un director de arte.',
 'JOURNALISTIC. Do not touch anything. Keep trash, cables, and clutter.',
 'TIDY UP. Remove obvious trash (papers, cups) from floor/tables.',
 'SET DRESSING. Organize the mess. Align chairs/curtains. Balanced composition.',
 'MINIMALIST. Remove non-essential furniture/objects. Clean surfaces.',
 'EDITORIAL SET DESIGN. DISTRACTION REMOVAL. CLEAN COMPOSITION. CURATED PROPS. ARCHITECTURAL DIGEST STYLE.',
 3),

('s6', 'STYLESCALER', 'Composición Pro',
 'Reencuadra basándose en reglas áureas y cinematográficas.',
 'ORIGINAL FRAME. Do not crop. Respect user framing errors.',
 'RULE OF THIRDS. Subtle crop to align eyes/horizon to grid.',
 'CINEMATIC CROP. 2.35:1 Aspect Ratio. Cut headroom/bottom to focus on action.',
 'TIGHT FRAMING. Aggressive crop to face/subject. Eliminate background.',
 'GOLDEN RATIO COMPOSITION. PROFESSIONAL CROPPING. BALANCED NEGATIVE SPACE. CINEMATOGRAPHER EYE.',
 3),

('s7', 'STYLESCALER', 'Profundidad Aérea',
 'Añade densidad atmosférica real para separar planos.',
 'VACUUM CLARITY. Zero haze. Transparent air. Maximum distance visibility.',
 'DEPTH HINT. Subtle aerial perspective (blueish distance). Separate planes.',
 'SOFT DIFFUSION. "Pro-Mist" filter effect. Bloom on highlights. Airy feel.',
 'VOLUMETRIC FOG. Visible density. Light shafts (God Rays). Moody.',
 'ATMOSPHERIC DEPTH. SPATIAL SEPARATION. CINEMATIC HAZE. VOLUMETRIC DENSITY. REALISTIC FOG.',
 2),

('s8', 'STYLESCALER', 'Etalonaje (Color)',
 'Aplica corrección de color de cine (sin filtros baratos).',
 'REC.709 STD. Standard broadcast color. Neutral and accurate.',
 'WHITE BALANCE. Correct color casts (remove green/orange tints). Neutral greys.',
 'ANALOG WARMTH. Subtle film simulation. Rich skin tones. Gold bias.',
 'BLOCKBUSTER. Teal & Orange split toning. High color contrast.',
 'MASTER COLOR GRADING. CINEMATIC COLOR HARMONY. PRECISE SKIN TONES. FILM PRINT EMULATION.',
 3),

('s9', 'STYLESCALER', 'Reflejos Físicos',
 'Gestiona el brillo físico de materiales (PBR) realista.',
 'MATTE FINISH. Diffuse reflection. No specular highlights. Flat look.',
 'NATURAL SHINE. Standard gloss on plastic/metal. Accurate physics.',
 'POLARIZED. Cut glare. Deepen color saturation on reflective surfaces.',
 'WET LOOK. Enhance gloss map. Make surfaces look moist/polished.',
 'PERFECT SPECULARITY. CONTROLLED REFLECTIONS. HIGH-GLOSS FINISH. SURFACE POLARIZATION.',
 3);

-- ===== LIGHTSCALER (9 sliders) =====

INSERT INTO slider_definitions 
(slider_key, pillar, ui_title, ui_description, instruction_off, instruction_low, instruction_med, instruction_high, instruction_force, auto_default)
VALUES
('l1', 'LIGHTSCALER', 'Luz Principal',
 'Simula iluminación de estudio de alta gama (Profoto/Arri).',
 'AMBIENT ONLY. Use available light. Flat or chaotic natural lighting.',
 'REFLECTOR FILL. Bounce light back to face. Reduce dark shadows under eyes.',
 'SOFTBOX (OCTA). Commercial beauty light. Large source. Wrapping soft light.',
 'FRESNEL (HARD). Hollywood spotlight. Defined shadows. High drama.',
 'PROFOTO STUDIO STROBE. DIRECTIONAL MODIFIERS. SCULPTING LIGHT QUALITY. 3-POINT LIGHTING.',
 4),

('l2', 'LIGHTSCALER', 'Luz de Relleno',
 'Controla el contraste de iluminación (Ratio).',
 'NATURAL RATIO. Keep original contrast between light and dark side.',
 'NEGATIVE FILL. Block light (Black Flag) to deepen shadow side.',
 'COMMERCIAL FILL. 2:1 Ratio. Shadow side is visible but darker.',
 'HIGH KEY. 1:1 Ratio. Shadows are fully illuminated. Bright & Airy.',
 'COMMERCIAL LIGHTING RATIO. OPEN SHADOWS. BROAD SOURCE FILL. SOFT WRAP. BEAUTY DISH.',
 4),

('l3', 'LIGHTSCALER', 'Luz de Recorte',
 'Luz trasera para separar sujeto del fondo.',
 'NO BACKLIGHT. Subject blends into background. 2D look.',
 'SUBTLE KICKER. Edge light on hair/shoulders to separate form.',
 'HAIR LIGHT. Dedicated top/back light. Halo effect on hair.',
 'SILHOUETTE. Strong backlight. Rim defines the shape.',
 'DISTINCT EDGE SEPARATION. HAIR LIGHT / KICKER. SUBJECT ISOLATION. RIM LIGHTING.',
 2),

('l4', 'LIGHTSCALER', 'Haces de Luz',
 'Simula efecto Tyndall natural.',
 'INVISIBLE AIR. Light travels invisibly. No scattering.',
 'SOFT BLOOM. Light sources glow slightly (Halation).',
 'LIGHT SHAFTS. Visible God Rays coming from windows/sun.',
 'DENSE PARTICLES. Dusty air catching light. Texture in the beams.',
 'FOCUSED LIGHT BEAMS. ATMOSPHERIC SCATTERING. VISIBLE LIGHT PATH. TYNDALL EFFECT.',
 1),

('l5', 'LIGHTSCALER', 'Balance de Blancos',
 'Temperatura de color creativa (Kelvin).',
 'NEUTRAL. 5500K Daylight. White is White.',
 'WARM / COOL. Subtle shift (+/- 500K) for mood.',
 'GOLDEN / BLUE. Golden Hour (3200K) or Blue Hour (7000K).',
 'COLOR GELS. Creative lighting (Red/Blue lights).',
 'PRECISE KELVIN ADJUSTMENT. MIXED LIGHTING BALANCE. CTO/CTB GEL SIMULATION.',
 5),

('l6', 'LIGHTSCALER', 'Curva de Tonos',
 'Curva de respuesta tonal fotográfica.',
 'LINEAR. Flat profile. Low contrast. Maximum data preservation.',
 'S-CURVE. Standard photography contrast. Correct blacks.',
 'PUNCHY. Commercial pop. Vivid blacks and bright whites.',
 'FILMIC. Deep shadows, soft highlight roll-off. Analog feel.',
 'HIGH DYNAMIC CONTRAST. RICH TONALITY. DEEP BLACK POINT. PUNCHY HIGHLIGHTS.',
 4),

('l7', 'LIGHTSCALER', 'Densidad de Negros',
 'Control del punto negro y cuerpo de la sombra.',
 'STANDARD. Black point at 0. Details visible in darks.',
 'MATTE BLACK. Lifted blacks (faded vintage look).',
 'DENSE BLACK. Add weight to shadows. Rich darkness.',
 'CRUSHED. Zone 0 clipping. No detail in shadows. Noir style.',
 'NEGATIVE FILL. HIGH DENSITY BLACKS. LOW KEY MOOD. LIGHT ABSORPTION.',
 3),

('l8', 'LIGHTSCALER', 'Esquema Dramático',
 'Estilos de Dirección de Fotografía reconocidos.',
 'SNAPSHOT. Random, uncurated lighting. Reality.',
 'COMMERCIAL. Clean, even, safe lighting. Stock photo look.',
 'CINEMATIC. Moody, intentional shadows. Roger Deakins style.',
 'CHIAROSCURO. Heavy contrast. Caravaggio painting style.',
 'PAINTERLY LIGHTING. DRAMATIC FALL-OFF. MASTER CINEMATOGRAPHY AESTHETIC.',
 3),

('l9', 'LIGHTSCALER', 'Brillo de Piel',
 'Especularidad e hidratación de la piel.',
 'MATTE / POWDER. Dry skin. No shine. Flat finish.',
 'HEALTHY SHEEN. Natural oil hydration. Subtle highlights on nose/forehead.',
 'DEWY. Moist, hydrated skin care look. Glow.',
 'WET / SWEAT. Gym look. High gloss on skin.',
 'DEWY COMPLEXION. CONTROLLED SPECULAR HIGHLIGHTS. HYDRATED SKIN SHEEN.',
 3);
```

---

### 1.5 MACRO DEFINITIONS (USER y PRO)

```sql
-- TABLA: Definiciones de Macros (Mapeo de Sliders)
CREATE TABLE macro_definitions (
    id SERIAL PRIMARY KEY,
    macro_key TEXT UNIQUE NOT NULL,      -- 'calidad_imagen', 'drama', etc.
    profile_tier TEXT NOT NULL,          -- 'USER', 'PRO'
    pillar TEXT,                         -- NULL para USER, 'PHOTOSCALER', 'STYLESCALER', etc. para PRO
    ui_title TEXT NOT NULL,
    ui_icon TEXT,

    -- JSON Array de sliders esclavos
    slave_sliders TEXT[] NOT NULL,       -- ['p1', 'p2', 'p6', ...]

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== MACROS PROFILE USER (3 macros, cada uno controla 9 sliders) =====

INSERT INTO macro_definitions (macro_key, profile_tier, ui_title, ui_icon, slave_sliders)
VALUES
('calidad_imagen', 'USER', 'Calidad Imagen', '💎', 
 ARRAY['p1', 'p2', 'p3', 'p4', 'p6', 'p7', 'p8', 'p9']),

('estetica_ia', 'USER', 'Estética IA', '✨',
 ARRAY['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9']),

('iluminacion_pro', 'USER', 'Iluminación Pro', '💡',
 ARRAY['l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7', 'l8', 'l9']);

-- ===== MACROS PROFILE PRO (9 macros, cada uno controla 3-4 sliders) =====

-- Photoscaler (3 macros)
INSERT INTO macro_definitions (macro_key, profile_tier, pillar, ui_title, ui_icon, slave_sliders)
VALUES
('restauracion', 'PRO', 'PHOTOSCALER', 'Restauración', '🛠️',
 ARRAY['p1', 'p2', 'p8', 'p9']),

('fidelidad', 'PRO', 'PHOTOSCALER', 'Fidelidad', '🔍',
 ARRAY['p3', 'p4', 'p6']),

('caracter', 'PRO', 'PHOTOSCALER', 'Carácter', '🎞️',
 ARRAY['p5', 'p7']);

-- Stylescaler (3 macros)
INSERT INTO macro_definitions (macro_key, profile_tier, pillar, ui_title, ui_icon, slave_sliders)
VALUES
('presencia', 'PRO', 'STYLESCALER', 'Presencia', '👤',
 ARRAY['s1', 's2', 's3']),

('pulido', 'PRO', 'STYLESCALER', 'Pulido', '🧼',
 ARRAY['s4', 's5', 's6']),

('cinematica', 'PRO', 'STYLESCALER', 'Cinemática', '🎬',
 ARRAY['s7', 's8', 's9']);

-- Lightscaler (3 macros)
INSERT INTO macro_definitions (macro_key, profile_tier, pillar, ui_title, ui_icon, slave_sliders)
VALUES
('volumen', 'PRO', 'LIGHTSCALER', 'Volumen', '📐',
 ARRAY['l1', 'l2', 'l3']),

('drama', 'PRO', 'LIGHTSCALER', 'Drama', '🎭',
 ARRAY['l4', 'l5', 'l6']),

('atmosfera', 'PRO', 'LIGHTSCALER', 'Atmósfera', '🌫️',
 ARRAY['l7', 'l8', 'l9']);
```

---

### 1.6 USER PROFILES & UPLOADS (Tablas Operativas)

```sql
-- TABLA: Perfiles de Usuario
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tier TEXT DEFAULT 'AUTO', -- 'AUTO', 'USER', 'PRO', 'PRO_LUX'
    token_balance INT DEFAULT 100,
    monthly_limit INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA: Subidas de Imágenes (Biopsia)
CREATE TABLE uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    original_width INT,
    original_height INT,
    thumbnail_url TEXT,
    biopsy_urls JSONB, -- { center, shadow, detail }
    status TEXT DEFAULT 'biopsy_ready', -- 'biopsy_ready', 'analyzing', 'ready_for_review'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA: Resultados de Análisis (Vision)
CREATE TABLE analysis_results (
    upload_id UUID PRIMARY KEY REFERENCES uploads(id) ON DELETE CASCADE,
    cat_code TEXT REFERENCES taxonomy_definitions(code),
    detected_defects TEXT[] DEFAULT '{}', -- Array de diagnosis codes
    ocr_data JSONB DEFAULT 'null'::jsonb, -- { text, box_2d, surface_material }
    visual_summary TEXT,
    severity_score INT DEFAULT 5, -- 1-10
    auto_settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA: Generaciones (Imágenes Producidas)
CREATE TABLE generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id UUID REFERENCES uploads(id) ON DELETE CASCADE,
    prompt_used TEXT,
    config_used JSONB, -- seed, strength, guidance_scale, sampler
    clean_url TEXT, -- URL privada (sin watermark)
    watermarked_url TEXT, -- URL pública (preview)
    final_url TEXT, -- URL tras Unlock (4K/8K, inpaint, etc.)
    is_preview BOOLEAN DEFAULT true,
    tokens_spent INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA: Presets Guardados por Usuario
CREATE TABLE user_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sliders_config JSONB, -- { p1: 5, s3: 7, l2: 4, ... }
    nano_params JSONB, -- { strength, guidance_scale, sampler, seed }
    anchor_preferences JSONB, -- { background: true, lighting: true, clothes: false }
    reference_image_url TEXT, -- URL de la imagen generada para usar como referencia
    prompt_text TEXT, -- El prompt cinematográfico compilado
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA: Configuración de Workflows de Usuario
CREATE TABLE user_upload_workflows (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    is_async_enabled BOOLEAN DEFAULT true,
    max_previews INT DEFAULT 3,
    batch_config JSONB, -- Array de { type: 'AUTO', variant: '...' } o { type: 'PRESET', preset_id: '...' }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## FIN PARTE 1: SQL COMPLETO

Todo el código SQL está listo para copiar y pegar en tu editor de Supabase. **Total: 135 instrucciones de slider única, 21 categorías, 10 diagnósticos, 4 tiers, todo data-driven.**

---
