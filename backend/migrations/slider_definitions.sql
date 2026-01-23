-- Migration: slider_definitions
-- Description: Table containing all 27 slider definitions with their descriptions per level
-- Created: 2024-12-XX

-- Drop table if exists (for clean migration)
DROP TABLE IF EXISTS slider_definitions;

-- Create the slider_definitions table
CREATE TABLE slider_definitions (
    id TEXT PRIMARY KEY,
    pilar TEXT NOT NULL,
    key_id TEXT NOT NULL UNIQUE,
    ui_title TEXT NOT NULL,
    ui_description TEXT NOT NULL,
    auto_vision TEXT NOT NULL,
    level_off TEXT NOT NULL,
    level_low TEXT NOT NULL,
    level_med TEXT NOT NULL,
    level_high TEXT NOT NULL,
    level_force TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_slider_definitions_pilar ON slider_definitions(pilar);
CREATE INDEX idx_slider_definitions_key_id ON slider_definitions(key_id);

-- Insert PHOTOSCALER sliders (p1-p9)
INSERT INTO slider_definitions (id, pilar, key_id, ui_title, ui_description, auto_vision, level_off, level_low, level_med, level_high, level_force) VALUES
('p1', 'PHOTOSCALER', 'limpieza_artefactos', 'Limpieza de Señal', 'Gestiona el ruido y la pureza de la imagen sin perder la textura orgánica del sensor.', '(según criterio)', 'PRESERVE PATINA. Treat sensor noise and grain as essential texture. Do not denoise. Maintain organic "film" feel.', 'CHROMA DENOISE. Remove only color noise (purple/green blotches). Keep Luminance grain to prevent waxy skin.', 'SIGNAL POLISH. Standard ISO reduction. Clean smooth surfaces (walls, sky) but protect high-frequency texture areas.', 'COMMERCIAL CLEANUP. High-end editorial denoising. Remove all dust spots and sensor dirt. Smooth gradients.', 'PRISTINE SIGNAL PROCESSING. HIGH-END FREQUENCY SEPARATION CLEANUP. ZERO ARTIFACTS. PERFECT SENSOR READOUT.'),

('p2', 'PHOTOSCALER', 'geometria', 'Corrección Técnica', 'Corrige la distorsión de la lente y la perspectiva como una cámara técnica.', '(según criterio)', 'OPTICAL LOCK. Preserve original lens character (including barrel/pincushion distortion). Do not crop.', 'LENS PROFILE FIX. Correct vignetting (dark corners) and chromatic aberration (color fringing). Keep perspective.', 'PERSPECTIVE ALIGN. Straighten horizon line. Fix minor vertical keystoning. Center the subject visually.', 'RECTILINEAR MODE. Remove all lens distortion. Straighten architectural lines. Re-compose edges.', 'TECHNICAL CAMERA PRECISION. ZERO DISTORTION. TILT-SHIFT LENS ALIGNMENT. PERFECT GRID. FLATTEN FACIAL DISTORTION.'),

('p3', 'PHOTOSCALER', 'optica_nitidez', 'Definición Cristalina', 'Simula la calidad del cristal de la lente (Acutancia y Micro-contraste).', '(según criterio)', 'VINTAGE OPTICS. Maintain lens softness, spherical aberration, and "dreamy" lack of contrast. Preserve bloom.', 'KIT LENS SHARP. Remove diffraction softness. Apply subtle Unsharp Mask (Radius 0.5px) to define edges.', 'PRO ZOOM (24-70mm). High micro-contrast. Clear texture separation. Modern lens coating look (no glare).', 'PRIME LENS (85mm). Razor sharp eyelashes and iris texture. High Acutance. Zero chromatic aberration.', 'MASTER LENS SIMULATION (ZEISS/LEICA). DIFFRACTION-LIMITED SHARPNESS. MAXIMUM MTF CURVE PERFORMANCE. CRYSTALLINE CLARITY.'),

('p4', 'PHOTOSCALER', 'chronos', 'Congelar Acción', 'Elimina trepidación y movimiento simulando velocidades de obturación altas.', '(según criterio)', 'NATURAL DRAG. Preserve motion blur in moving objects to convey speed/action. Cinematic shutter (1/50s).', 'STABILIZATION (IS). Remove handheld camera shake (trepidation). Keep motion blur only on very fast objects.', 'ACTION FREEZE. Sport mode shutter (1/500s). Freeze walking/talking subjects. Sharp edges on moving parts.', 'HIGH SPEED SYNC. Freeze splashes and hair movement. 1/2000s shutter simulation. Crisp frozen details.', '1/8000s SHUTTER SPEED. FROZEN MOTION. ZERO TREPIDATION. STROBOSCOPIC CLARITY. PERFECTLY FROZEN PARTICLES.'),

('p5', 'PHOTOSCALER', 'senal_raw', 'Rango Dinámico', 'Recupera información de luces y sombras (Revelado Digital).', '(según criterio)', 'ORIGINAL EXPOSURE. Keep crushed blacks (Zone 0) and blown highlights (Zone 10) as mood/style choice.', 'HISTOGRAM SAFE. Stretch contrast to ensure data exists in shadows. Fix "grey" blacks. Normalized exposure.', 'SHADOW RECOVERY. Lift Zone 2-3 details. Soften highlight clipping. Balanced "Commercial" exposure.', 'HDR TONE MAP. Compress dynamic range for maximum visibility. Reveal details in dark corners and bright windows.', '16-BIT TIFF DYNAMIC RANGE. FULL HISTOGRAM RECOVERY. ANSEL ADAMS ZONE SYSTEM OPTIMIZATION. NO CLIPPING.'),

('p6', 'PHOTOSCALER', 'sintesis_adn', 'Textura Táctil', 'Recupera detalle de alta frecuencia (poros, hilos) realista.', '(según criterio)', 'SOFT FOCUS. Maintain low-frequency details only. Smooth/plastic look is acceptable if source dictates.', 'TEXTURE ENHANCE. Sharpen existing surface details (fabric, skin) without adding new information.', 'DETAIL RESTORE. Reconstruct lost texture in slightly blurry areas. Recover fabric weave definition.', 'HIGH-FREQ SYNTHESIS. Generate missing pores and fine lines based on context. 4K texture density.', 'MACRO-FIDELITY RESTORATION. ORGANIC HIGH-FREQUENCY DETAIL. TACTILE SURFACE REALISM. 100MP SENSOR DETAIL.'),

('p7', 'PHOTOSCALER', 'grano_filmico', 'Emulsión Fílmica', 'Añade estructura de grano orgánico para realismo analógico.', '(según criterio)', 'DIGITAL CLEAN. Modern sensor look. Zero grain. Clinical perfection.', 'ISO 100 GRAIN. Very fine, almost invisible structure. Adds subtle cohesion to digital pixels.', 'KODAK PORTRA 400. Distinct organic grain structure. Pleasing texture. Warm analog feel.', 'ILFORD HP5 (1600). Heavy, gritty grain. Documentary aesthetic. High texture perceptibility.', 'CINEMA FILM STOCK EMULSION. ORGANIC GRAIN STRUCTURE. ANALOG AESTHETIC INTEGRATION. NO DIGITAL NOISE.'),

('p8', 'PHOTOSCALER', 'apertura_bokeh', 'Profundidad de Campo', 'Controla el diafragma (f-stop) y el desenfoque del fondo.', '(según criterio)', 'HYPERFOCAL (f/16). EVERYTHING IN FOCUS. From foreground to infinity. Maximum context visibility. Landscape standard.', 'COMMERCIAL (f/8). DEEP DEPTH OF FIELD. Subject clearly sharp, background distinct but slightly softer. Group photo standard.', 'ENVIRONMENTAL (f/4). NATURAL SEPARATION. Subject pops, background is blurry but recognizable (Contextual).', 'PORTRAIT (f/1.8). CREAMY BOKEH. Background is washed out. Strong subject separation. Soft highlight circles.', 'NOCTILUX DREAM (f/0.95). EXTREME BOKEH. RAZOR-THIN FOCAL PLANE. BACKGROUND OBLITERATED INTO CREAMY AESTHETIC.'),

('p9', 'PHOTOSCALER', 'resolucion', 'Densidad de Píxel', 'Aumenta la resolución simulando sensores de formato medio.', '(según criterio)', 'NATIVE RES. Keep original pixel count. Upscale via simple bicubic if needed.', 'SMART UPSCALE (2x). Maintain edge integrity. Smooth out jaggies/pixelation.', 'SUPER-RES (4x). AI-based detail refinement. Density suitable for 4K displays.', 'PRINT DENSITY. 300 DPI simulation. Fine detail robustness for large format printing.', 'PHASE ONE IQ4 QUALITY. 150MP SENSOR SIMULATION. PRINT-READY DENSITY. REMOVE PIXEL GRID.');

-- Insert STYLESCALER sliders (s1-s9)
INSERT INTO slider_definitions (id, pilar, key_id, ui_title, ui_description, auto_vision, level_off, level_low, level_med, level_high, level_force) VALUES
('s1', 'STYLESCALER', 'styling_piel', 'Grooming Pro', 'Retoque de piel tipo editorial (mantiene poros, quita manchas).', '(según criterio)', 'BIOMETRIC LOCK. Preserve all acne, scars, redness, and oil. Documentary skin reality.', 'HEALTHY GLOW. Remove temporary redness/blotchiness. Even out skin tone. Keep moles/freckles.', 'STUDIO MATTE. Commercial retouch. Soften pores. Remove shine/oil. Brighten under-eyes.', 'HIGH-END EDITORIAL. Frequency Separation. Flawless texture. Defined features. Porcelain finish.', 'HIGH-END RETOUCHING. FLAWLESS COMPLEXION. RETAIN NATURAL PORES & VELLUS HAIR. EVEN SKIN TONE. VOGUE COVER STANDARD.'),

('s2', 'STYLESCALER', 'styling_pelo', 'Estilismo Capilar', 'Define el cabello y volumen con acabado de salón.', '(según criterio)', 'NATURAL MESS. Keep flyaways, frizz, and messy hairline. Authentic "bed head".', 'FRIZZ CONTROL. Smooth out humidity frizz. Tame stray hairs. Healthy shine.', 'SALON BLOWOUT. Defined volume. Clean hairline. Product-styled finish.', 'LIQUID HAIR. High gloss. Perfect strand definition. Keratin treatment look.', 'SESSION STYLIST FINISH. HEALTHY CUTICLE SHINE. CONTROLLED VOLUME. DEFINED STRANDS. NO FLYAWAYS.'),

('s3', 'STYLESCALER', 'styling_ropa', 'Sastrería Digital', 'Mejora la caída y calidad de los tejidos.', '(según criterio)', 'FABRIC LOCK. Keep wrinkles, stains, lint, and wear. Authentic clothing state.', 'STEAM IRON. Remove accidental fold lines and lint. Refresh fabric appearance.', 'TEXTURE POP. Sharpen weave pattern. Deepen blacks. Define stitching.', 'TAILOR FIT. Re-drape fabric to remove bunching. Fix collar alignment. Visual ironing.', 'SARTORIAL PERFECTION. IMMACULATE TEXTILE DEFINITION. HIGH-THREAD COUNT VISIBILITY. PERFECT DRAPE.'),

('s4', 'STYLESCALER', 'maquillaje', 'MUA Profesional', 'Aplica maquillaje correctivo o editorial realista.', '(según criterio)', 'BARE FACE. No makeup. Visible capillaries and natural pallor.', 'NATURAL ENHANCE. "No-makeup" look. Subtle lip tint. Mascara definition.', 'RED CARPET. Full foundation. Contouring. Defined brows. Lipstick.', 'EDITORIAL GLAM. High-fashion application. Strobing (Highlight). Graphic liner.', 'PROFESSIONAL MUA APPLICATION. CONTOUR & HIGHLIGHT SCULPTING. PHOTOGENIC DEFINITION. FLAWLESS APPLICATION.'),

('s5', 'STYLESCALER', 'limpieza_entorno', 'Set Design', 'Organiza y limpia el fondo como un director de arte.', '(según criterio)', 'JOURNALISTIC. Do not touch anything. Keep trash, cables, and clutter.', 'TIDY UP. Remove obvious trash (papers, cups) from floor/tables.', 'SET DRESSING. Organize the mess. Align chairs/curtains. Balanced composition.', 'MINIMALIST. Remove non-essential furniture/objects. Clean surfaces.', 'EDITORIAL SET DESIGN. DISTRACTION REMOVAL. CLEAN COMPOSITION. CURATED PROPS. ARCHITECTURAL DIGEST STYLE.'),

('s6', 'STYLESCALER', 'reencuadre_ia', 'Composición Pro', 'Reencuadra basándose en reglas áureas y cinematográficas.', '(según criterio)', 'ORIGINAL FRAME. Do not crop. Respect user''s framing errors.', 'RULE OF THIRDS. Subtle crop to align eyes/horizon to grid.', 'CINEMATIC CROP. 2.35:1 Aspect Ratio. Cut headroom/bottom to focus on action.', 'TIGHT FRAMING. Aggressive crop to face/subject. Eliminate background.', 'GOLDEN RATIO COMPOSITION. PROFESSIONAL CROPPING. BALANCED NEGATIVE SPACE. CINEMATOGRAPHER EYE.'),

('s7', 'STYLESCALER', 'atmosfera', 'Profundidad Aérea', 'Añade densidad atmosférica real para separar planos.', '(según criterio)', 'VACUUM CLARITY. Zero haze. Transparent air. Maximum distance visibility.', 'DEPTH HINT. Subtle aerial perspective (blueish distance). Separate planes.', 'SOFT DIFFUSION. "Pro-Mist" filter effect. Bloom on highlights. Airy feel.', 'VOLUMETRIC FOG. Visible density. Light shafts (God Rays). Moody.', 'ATMOSPHERIC DEPTH. SPATIAL SEPARATION. CINEMATIC HAZE. VOLUMETRIC DENSITY. REALISTIC FOG.'),

('s8', 'STYLESCALER', 'look_cine', 'Etalonaje (Color)', 'Aplica corrección de color de cine (sin filtros baratos).', '(según criterio)', 'REC.709 STD. Standard broadcast color. Neutral and accurate.', 'WHITE BALANCE. Correct color casts (remove green/orange tints). Neutral greys.', 'ANALOG WARMTH. Subtle film simulation. Rich skin tones. Gold bias.', 'BLOCKBUSTER. Teal & Orange split toning. High color contrast.', 'MASTER COLOR GRADING. CINEMATIC COLOR HARMONY. PRECISE SKIN TONES. FILM PRINT EMULATION.'),

('s9', 'STYLESCALER', 'materiales_pbr', 'Reflejos Físicos', 'Gestiona el brillo físico de materiales (PBR) realista.', '(según criterio)', 'MATTE FINISH. Diffuse reflection. No specular highlights. Flat look.', 'NATURAL SHINE. Standard gloss on plastic/metal. Accurate physics.', 'POLARIZED. Cut glare. Deepen color saturation on reflective surfaces.', 'WET LOOK. Enhance gloss map. Make surfaces look moist/polished.', 'PERFECT SPECULARITY. CONTROLLED REFLECTIONS. HIGH-GLOSS FINISH. SURFACE POLARIZATION.');

-- Insert LIGHTSCALER sliders (L1-L9)
INSERT INTO slider_definitions (id, pilar, key_id, ui_title, ui_description, auto_vision, level_off, level_low, level_med, level_high, level_force) VALUES
('L1', 'LIGHTSCALER', 'key_light', 'Luz Principal', 'Simula iluminación de estudio de alta gama (Profoto/Arri).', '(según criterio)', 'AMBIENT ONLY. Use available light. Flat or chaotic natural lighting.', 'REFLECTOR FILL. Bounce light back to face. Reduce dark shadows under eyes.', 'SOFTBOX (OCTA). Commercial beauty light. Large source. Wrapping soft light.', 'FRESNEL (HARD). Hollywood spotlight. Defined shadows. High drama.', 'PROFOTO STUDIO STROBE. DIRECTIONAL MODIFIERS. SCULPTING LIGHT QUALITY. 3-POINT LIGHTING.'),

('L2', 'LIGHTSCALER', 'fill_light', 'Luz de Relleno', 'Controla el contraste de iluminación (Ratio).', '(según criterio)', 'NATURAL RATIO. Keep original contrast between light and dark side.', 'NEGATIVE FILL. Block light (Black Flag) to deepen shadow side.', 'COMMERCIAL FILL. 2:1 Ratio. Shadow side is visible but darker.', 'HIGH KEY. 1:1 Ratio. Shadows are fully illuminated. Bright & Airy.', 'COMMERCIAL LIGHTING RATIO. OPEN SHADOWS. BROAD SOURCE FILL. SOFT WRAP. BEAUTY DISH.'),

('L3', 'LIGHTSCALER', 'rim_light', 'Luz de Recorte', 'Luz trasera para separar sujeto del fondo.', '(según criterio)', 'NO BACKLIGHT. Subject blends into background. 2D look.', 'SUBTLE KICKER. Edge light on hair/shoulders to separate form.', 'HAIR LIGHT. Dedicated top/back light. Halo effect on hair.', 'SILHOUETTE. Strong backlight. Rim defines the shape.', 'DISTINCT EDGE SEPARATION. HAIR LIGHT / KICKER. SUBJECT ISOLATION. RIM LIGHTING.'),

('L4', 'LIGHTSCALER', 'volumetria', 'Haces de Luz', 'Simula efecto Tyndall natural.', '(según criterio)', 'INVISIBLE AIR. Light travels invisibly. No scattering.', 'SOFT BLOOM. Light sources glow slightly (Halation).', 'LIGHT SHAFTS. Visible God Rays coming from windows/sun.', 'DENSE PARTICLES. Dusty air catching light. Texture in the beams.', 'FOCUSED LIGHT BEAMS. ATMOSPHERIC SCATTERING. VISIBLE LIGHT PATH. TYNDALL EFFECT.'),

('L5', 'LIGHTSCALER', 'temperatura', 'Balance de Blancos', 'Temperatura de color creativa (Kelvin).', '(según criterio)', 'NEUTRAL. 5500K Daylight. White is White.', 'WARM / COOL. Subtle shift (+/- 500K) for mood.', 'GOLDEN / BLUE. Golden Hour (3200K) or Blue Hour (7000K).', 'COLOR GELS. Creative lighting (Red/Blue lights).', 'PRECISE KELVIN ADJUSTMENT. MIXED LIGHTING BALANCE. CTO/CTB GEL SIMULATION.'),

('L6', 'LIGHTSCALER', 'contraste', 'Curva de Tonos', 'Curva de respuesta tonal fotográfica.', '(según criterio)', 'LINEAR. Flat profile. Low contrast. Maximum data preservation.', 'S-CURVE. Standard photography contrast. Correct blacks.', 'PUNCHY. Commercial pop. Vivid blacks and bright whites.', 'FILMIC. Deep shadows, soft highlight roll-off. Analog feel.', 'HIGH DYNAMIC CONTRAST. RICH TONALITY. DEEP BLACK POINT. PUNCHY HIGHLIGHTS.'),

('L7', 'LIGHTSCALER', 'sombras', 'Densidad de Negros', 'Control del punto negro y "cuerpo" de la sombra.', '(según criterio)', 'STANDARD. Black point at 0. Details visible in darks.', 'MATTE BLACK. Lifted blacks (faded vintage look).', 'DENSE BLACK. Add weight to shadows. Rich darkness.', 'CRUSHED. Zone 0 clipping. No detail in shadows. Noir style.', 'NEGATIVE FILL. HIGH DENSITY BLACKS. LOW KEY MOOD. LIGHT ABSORPTION.'),

('L8', 'LIGHTSCALER', 'estilo_autor', 'Esquema Dramático', 'Estilos de Dirección de Fotografía reconocidos.', '(según criterio)', 'SNAPSHOT. Random, uncurated lighting. Reality.', 'COMMERCIAL. Clean, even, safe lighting. Stock photo look.', 'CINEMATIC. Moody, intentional shadows. Roger Deakins style.', 'CHIAROSCURO. Heavy contrast. Caravaggio painting style.', 'PAINTERLY LIGHTING. DRAMATIC FALL-OFF. MASTER CINEMATOGRAPHY AESTHETIC.'),

('L9', 'LIGHTSCALER', 'reflejos', 'Brillo de Piel', 'Especularidad e hidratación de la piel.', '(según criterio)', 'MATTE / POWDER. Dry skin. No shine. Flat finish.', 'HEALTHY SHEEN. Natural oil hydration. Subtle highlights on nose/forehead.', 'DEWY. Moist, hydrated skin care look. Glow.', 'WET / SWEAT. Gym look. High gloss on skin.', 'DEWY COMPLEXION. CONTROLLED SPECULAR HIGHLIGHTS. HYDRATED SKIN SHEEN.');

-- Enable Row Level Security
ALTER TABLE slider_definitions ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access" ON slider_definitions
    FOR SELECT USING (true);

-- Add comment to table
COMMENT ON TABLE slider_definitions IS 'LuxScaler v29 - Complete slider definitions with descriptions for each level (OFF/LOW/MED/HIGH/FORCE)';
