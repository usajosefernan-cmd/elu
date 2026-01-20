
/**
 * LUXIFIER LIGHT ENGINE SCHEMA - OPTICAL STACK
 * Handles: Hardware Simulation, Lighting Rigs, Physical Properties
 */

export const LUXIFIER_SCHEMA_LIGHT = `

-- 1. VIRTUAL CAMERAS (Sensors)
-- Defines the physics of the capture medium.
create table if not exists public.virtual_cameras (
    id text primary key, -- e.g., 'phase_one_iq4', 'arri_alexa', 'kodak_portra'
    name text not null,
    type text, -- 'DIGITAL_SENSOR', 'FILM_STOCK'
    
    -- Physics
    sensor_size text, -- 'Medium Format', 'Full Frame', 'Super 35'
    dynamic_range_stops float,
    native_iso integer,
    
    -- Aesthetic Properties (Instructions for the AI)
    color_science_prompt text, -- e.g. "Color Science: Hasselblad Natural Color Solution. 16-bit depth."
    grain_structure_prompt text -- e.g. "Zero grain, clinical sharpness" or "Organic organic T-Grain structure"
);

-- 2. VIRTUAL LENSES (Optics)
-- Defines the glass and its imperfections.
create table if not exists public.virtual_lenses (
    id text primary key, -- e.g., 'rodenstock_55', 'canon_85_L'
    name text not null,
    focal_length_mm integer,
    aperture text, -- 'f/1.2', 'f/8'
    
    -- Optical Characteristics
    character_prompt text, -- e.g. "Clinically sharp edge-to-edge. Zero chromatic aberration."
    bokeh_prompt text -- e.g. "Creamy, swirl bokeh. Cat-eye shape at edges."
);

-- 3. LIGHTING RIGS (The Studio)
-- Pre-defined lighting setups that LightScaler can invoke.
create table if not exists public.lighting_rigs (
    id text primary key, -- e.g., 'surgical_high_key', 'rembrandt_drama'
    name text not null,
    complexity_level integer, -- 1-10
    
    -- The Blueprint
    key_light_prompt text, -- "Massive Octabank overhead"
    fill_light_prompt text, -- "White bounce cards"
    rim_light_prompt text, -- "Hard kicker light from back-left"
    volumetrics_prompt text -- "Sterile air" or "Hazy atmosphere"
);

-- SEED DATA: The "Clinical Divine" Stack (Example)
INSERT INTO public.virtual_cameras (id, name, type, color_science_prompt) VALUES
('phase_one_iq4', 'Phase One IQ4 150MP', 'DIGITAL_SENSOR', '16-bit Trichromatic. Absolute color accuracy. Infinite resolution feeling.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.virtual_lenses (id, name, focal_length_mm, character_prompt) VALUES
('rodenstock_55', 'Rodenstock HR Digaron-W 55mm', 55, 'The sharpest lens in existence. Zero distortion. Surgical detail.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.lighting_rigs (id, name, complexity_level, key_light_prompt) VALUES
('surgical_high_key', 'Clinical Divine', 9, 'Massive diffuse white softbox (6000K) overhead. Shadowless.')
ON CONFLICT (id) DO NOTHING;

-- RLS
alter table public.virtual_cameras enable row level security;
alter table public.virtual_lenses enable row level security;
alter table public.lighting_rigs enable row level security;

create policy "Public read optical stack" on public.virtual_cameras for select using (true);
create policy "Public read lenses" on public.virtual_lenses for select using (true);
create policy "Public read lighting" on public.lighting_rigs for select using (true);
`;
