
/**
 * LUXIFIER PRODUCTIONS SCHEMA - THE AESTHETIC
 * Handles: Visual Styles, Lighting Moods, and Optical Recipes.
 * Concept: "HOW DOES IT LOOK?" (The Atmosphere)
 */

export const LUXIFIER_SCHEMA_PRODUCTIONS = `

-- 1. LUX PRODUCTIONS (Formerly Styles)
-- Defines the aesthetic wrapper applied to the subject.
create table if not exists public.lux_productions (
    id text primary key, -- 'paramount_glamour', 'cinematic_void', 'neon_cyber'
    category_id text references public.lux_categories(id), -- Can be specific or 'UNIVERSAL'
    
    name text not null, -- "Paramount Glamour"
    label_ui text not null, -- UI Display Name
    
    -- The Recipe (Vibe)
    prompt_instruction text not null, -- "Butterfly Lighting. Sculpted cheekbones. High Glamour."
    
    -- Tech Stack Linkage (JSONB for flexibility)
    -- { "base": "PARAMOUNT_BUTTERFLY", "camera": "Hasselblad", "lighting": "Hard Flash" }
    tech_stack jsonb not null, 
    
    -- Dynamic Scaling (Low/Med/High intensity overrides)
    intensity_config jsonb, 
    
    is_active boolean default true,
    is_premium boolean default false -- For locking behind paywall if needed
);

-- SEED DATA: Human Productions
INSERT INTO public.lux_productions (id, category_id, name, label_ui, tech_stack, prompt_instruction)
VALUES 
(
    'human_glam', 
    'HUMAN', 
    'Paramount Glamour', 
    'Paramount Butterfly', 
    '{"base": "PARAMOUNT_BUTTERFLY"}', 
    'Butterfly Lighting (Classic Hollywood). Sculpted cheekbones. High Glamour. Sharp eyes, creamy bokeh. Aggressive Flash Fill.'
),
(
    'human_newton', 
    'HUMAN', 
    'The Newton', 
    'Newton Flash', 
    '{"base": "NEWTON_FLASH"}', 
    'High-Fashion Flash. Razor sharp edges. Clean white/grey background (studio). High contrast but NO messy shadows. Glossy skin texture.'
),
(
    'human_avedon', 
    'HUMAN', 
    'The Avedon', 
    'Avedon 8x10', 
    '{"base": "AVEDON_8x10"}', 
    'Stark white background, brutal sharpness, raw emotion, black and white or desaturated.'
)
ON CONFLICT (id) DO UPDATE SET 
    prompt_instruction = EXCLUDED.prompt_instruction,
    tech_stack = EXCLUDED.tech_stack;

-- SEED DATA: Universal Productions
INSERT INTO public.lux_productions (id, category_id, name, label_ui, tech_stack, prompt_instruction)
VALUES
(
    'uni_cinematic', 
    'UNIVERSAL', 
    'Cinematic Void', 
    'Cinematic', 
    '{"base": "ARRI_ALEXA"}', 
    'Teal/Orange blockbuster look, anamorphic flares, wide aspect ratio feeling.'
),
(
    'uni_clean', 
    'UNIVERSAL', 
    'Studio Pure', 
    'Studio Clean', 
    '{"base": "HASSELBLAD"}', 
    'Perfect white balance, commercial sharpness, stock photography quality.'
)
ON CONFLICT (id) DO NOTHING;

-- RLS
alter table public.lux_productions enable row level security;

create policy "Public read productions" on public.lux_productions for select using (true);
create policy "Admin manage productions" on public.lux_productions for all using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
`;
