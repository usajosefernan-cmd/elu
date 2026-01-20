
/**
 * LUXIFIER STYLIST SCHEMA - THE EXPERT
 * Handles: Roles (Personas) and Material Definitions.
 * Concept: "WHO IS SHOOTING?" (The Human Element)
 */

export const LUXIFIER_SCHEMA_STYLIST = `

-- 1. LUX ROLES (The Expert Persona)
-- Defines the semantic priorities of the photographer/artist.
create table if not exists public.lux_roles (
    id text primary key, -- 'michelin_stylist', 'vogue_director', 'arch_photographer'
    category_id text references public.lux_categories(id), -- Linked to a Category
    label_ui text,
    
    -- The Brain (Deep Think Instructions)
    identity_prompt text, -- "You are a Michelin Star Food Stylist..."
    obsession_prompt text, -- "Obsession: Appetite Appeal, Texture, Steam."
    
    is_active boolean default true
);

-- 2. MATERIAL DEFINITIONS (Detail Injection)
-- Used by the "Upscaler" to hallucinate textures correctly based on the Role's knowledge.
create table if not exists public.material_definitions (
    id text primary key, -- 'human_skin_elderly', 'silk_fabric', 'concrete_brutalist'
    
    -- Physical properties for the AI to simulate
    surface_prompt text, -- "Subsurface scattering enabled. Micro-relief visible."
    texture_prompt text, -- "Deep wrinkles, sun damage spots, vellus hair."
    reflection_prompt text -- "Soft, oily sheen on highlights. Fresnel falloff."
);

-- SEED DATA: Roles
INSERT INTO public.lux_roles (id, category_id, label_ui, identity_prompt, obsession_prompt) VALUES
('michelin_stylist', 'FOOD', 'Michelin Stylist', 'IDENTITY: Michelin Star Food Stylist.', 'Obsession: Appetite Appeal, Texture, Steam, Freshness.'),
('vogue_photographer', 'HUMAN', 'Editorial Director', 'IDENTITY: Vogue Editorial Portraitist.', 'Obsession: Flattery, Skin Texture, Gaze, Connection.'),
('arch_digest_photographer', 'ARCH', 'Arch Digest Photographer', 'IDENTITY: Architectural Photographer.', 'Obsession: Vertical Lines, Interior/Exterior Balance, Staging.'),
('natgeo_wildlife', 'PET', 'Wildlife Photographer', 'IDENTITY: NatGeo Wildlife Photographer.', 'Obsession: Fur Texture, Eye Life, Action, Dignity.')
ON CONFLICT (id) DO UPDATE SET 
    identity_prompt = EXCLUDED.identity_prompt,
    obsession_prompt = EXCLUDED.obsession_prompt;

-- RLS
alter table public.lux_roles enable row level security;
alter table public.material_definitions enable row level security;

create policy "Public read roles" on public.lux_roles for select using (true);
create policy "Public read materials" on public.material_definitions for select using (true);
`;
