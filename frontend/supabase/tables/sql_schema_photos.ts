
/**
 * LUXIFIER PHOTO ENGINE SCHEMA - PHASE 1 & 2 (FORENSIC CORE)
 * Handles: Forensic Analysis, Granular Restoration Rules
 */

export const LUXIFIER_SCHEMA_PHOTOS = `

-- 1. FORENSIC REPORTS (The Autopsy)
-- Stores the raw analysis from Gemini Vision.
create table if not exists public.forensic_reports (
    id uuid default uuid_generate_v4() primary key,
    generation_id uuid references public.generations(id) on delete cascade,
    
    -- Classification
    master_category text, -- HUMAN, FOOD, ARCH, PET, PRODUCT, LANDSCAPE
    sub_type text, 
    confidence_score integer,
    
    -- Technical Audit
    technical_audit jsonb, -- { exposure, wb, focus, noise }
    composition_audit jsonb, -- { horizon_tilt, keystoning }
    
    is_nsfw boolean default false,
    created_at timestamp with time zone default now()
);

-- 2. FORENSIC SETTINGS (The Control Panel)
-- Instead of presets, we track the specific granular overrides used for a generation.
-- This allows learning: "Users usually turn OFF Geometry for Selfies".
create table if not exists public.forensic_settings_log (
    id uuid default uuid_generate_v4() primary key,
    generation_id uuid references public.generations(id) on delete cascade,
    
    -- SWITCH 1: FOCUS & DETAIL (0-10)
    -- 0: Natural/Soft -> 10: Clinical/De-blur
    focus_strength integer default 10,
    
    -- SWITCH 2: GEOMETRY & LENS (ON/OFF)
    -- Fixes Lens Distortion (Selfie Bulge) and Horizon/Keystoning.
    -- WARNING: High impact on biometric identity perception.
    geometry_correction_enabled boolean default true,
    
    -- SWITCH 3: TONES & SIGNAL (0-10)
    -- 0: Original Tint -> 10: Perfect 5500K Neutral White Balance
    signal_balance_strength integer default 10,
    
    created_at timestamp with time zone default now()
);

-- RLS
alter table public.forensic_reports enable row level security;
alter table public.forensic_settings_log enable row level security;

create policy "Users read own reports" on public.forensic_reports for select using (exists (select 1 from public.generations where id = forensic_reports.generation_id and user_id = auth.uid()));
create policy "Users read own settings" on public.forensic_settings_log for select using (exists (select 1 from public.generations where id = forensic_settings_log.generation_id and user_id = auth.uid()));
`;
