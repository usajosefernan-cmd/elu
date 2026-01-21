-- LuxScaler v28.1 - Vision Category Rules Extension
-- Añade reglas por categoría de imagen para el sistema de Protocol Alerts

-- Tabla de reglas por categoría
CREATE TABLE IF NOT EXISTS vision_category_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT UNIQUE NOT NULL,
    priority_sliders TEXT[] NOT NULL,
    max_reencuadre INT DEFAULT 5,
    identity_lock TEXT DEFAULT 'moderate' CHECK (identity_lock IN ('strict', 'moderate', 'none')),
    protocol_alert TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar reglas por categoría
INSERT INTO vision_category_rules (category, priority_sliders, max_reencuadre, identity_lock, protocol_alert)
VALUES 
('SELFIE', ARRAY['styling_piel', 'maquillaje', 'key_light', 'enfoque'], 3, 'strict', 
 'Selfie detected: Identity Lock at MAXIMUM. Focus on skin and lighting.'),

('PORTRAIT', ARRAY['styling_piel', 'styling_pelo', 'key_light', 'rim_light', 'estilo_autor'], 5, 'strict',
 'Portrait mode: Professional lighting priority. Preserve character.'),

('GROUP', ARRAY['limpieza_artefactos', 'fill_light', 'enfoque'], 3, 'strict',
 'Group photo: All faces protected. Uniform lighting adjustment.'),

('REAL_ESTATE', ARRAY['geometria', 'limpieza_entorno', 'key_light', 'contraste', 'optica'], 8, 'none',
 'Real estate: Geometry correction priority. Vertical lines must be straight.'),

('PRODUCT', ARRAY['materiales_pbr', 'reflejos', 'limpieza_entorno', 'key_light'], 7, 'none',
 'Product photography: Material accuracy critical. PBR enhancement enabled.'),

('FOOD', ARRAY['temperatura', 'reflejos', 'contraste', 'sintesis_adn'], 5, 'none',
 'Food photography: Warm tones, fresh look. Texture enhancement priority.'),

('LANDSCAPE', ARRAY['senal_raw', 'contraste', 'volumetria', 'atmosfera', 'look_cine'], 10, 'none',
 'Landscape: Full creative freedom. HDR and atmosphere enabled.'),

('EVENT', ARRAY['limpieza_artefactos', 'chronos', 'fill_light', 'enfoque'], 4, 'moderate',
 'Event photo: Motion freeze priority. Multiple subjects protected.'),

('DOCUMENT', ARRAY['geometria', 'contraste', 'limpieza_artefactos', 'enfoque'], 10, 'none',
 'Document scan: Geometry and contrast priority. B&W optimization.'),

('PET', ARRAY['enfoque', 'styling_pelo', 'key_light', 'chronos'], 6, 'none',
 'Pet photography: Eye focus priority. Fur texture enhancement.'),

('ART', ARRAY['resolucion', 'contraste', 'look_cine', 'grano_filmico'], 3, 'none',
 'Artwork: Color accuracy critical. Minimal processing to preserve artist intent.'),

('OTHER', ARRAY['limpieza_artefactos', 'enfoque', 'contraste'], 5, 'moderate',
 'Standard enhancement mode. Balanced processing.')

ON CONFLICT (category) DO UPDATE SET
    priority_sliders = EXCLUDED.priority_sliders,
    max_reencuadre = EXCLUDED.max_reencuadre,
    identity_lock = EXCLUDED.identity_lock,
    protocol_alert = EXCLUDED.protocol_alert;
