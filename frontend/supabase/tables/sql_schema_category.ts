
/**
 * LUXIFIER CATEGORY SCHEMA - THE ROUTER
 * Handles: Master Categories classification rules.
 * Concept: "WHAT IS IT?"
 */

export const LUXIFIER_SCHEMA_CATEGORY = `

-- 1. MASTER CATEGORIES
-- The root classification for the Neural Engine.
create table if not exists public.lux_categories (
    id text primary key, -- 'HUMAN', 'FOOD', 'ARCH', 'PRODUCT', 'PET', 'LANDSCAPE', 'UNIVERSAL'
    label_ui text not null, -- Display name (e.g. "Retrato Humano")
    
    -- Routing Logic
    detection_keywords text[], -- Keywords for the Vision AI to map (e.g. ['face', 'person', 'man'])
    default_role_id text, -- Fallback expert if none selected
    
    is_active boolean default true,
    created_at timestamp with time zone default now()
);

-- SEED DATA: The 6 Pillars
INSERT INTO public.lux_categories (id, label_ui, detection_keywords) VALUES
('HUMAN', 'Human Portrait', ARRAY['person', 'face', 'man', 'woman', 'child', 'selfie']),
('FOOD', 'Gastronomy', ARRAY['food', 'dish', 'drink', 'meal', 'fruit', 'vegetable']),
('ARCH', 'Architecture & Interiors', ARRAY['building', 'room', 'house', 'furniture', 'interior']),
('PRODUCT', 'Commercial Product', ARRAY['bottle', 'shoe', 'packaging', 'object', 'gadget']),
('PET', 'Wildlife & Pets', ARRAY['dog', 'cat', 'animal', 'bird', 'pet']),
('LANDSCAPE', 'Landscape & Nature', ARRAY['mountain', 'sea', 'forest', 'sky', 'nature']),
('UNIVERSAL', 'General Purpose', ARRAY['general', 'art', 'abstract'])
ON CONFLICT (id) DO UPDATE SET 
    label_ui = EXCLUDED.label_ui,
    detection_keywords = EXCLUDED.detection_keywords;

-- RLS
alter table public.lux_categories enable row level security;
create policy "Public read categories" on public.lux_categories for select using (true);
create policy "Admin manage categories" on public.lux_categories for all using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
`;
