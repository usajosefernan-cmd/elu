
-- ==============================================================================
-- LUXIFIER V26.0 BETA DATA GATHERING SCHEMA
-- ==============================================================================

create extension if not exists "uuid-ossp";

-- ==============================================================================
-- 1. BETA DATA GATHERING TABLES (THE GOLD MINE)
-- ==============================================================================

-- TABLA 1: LOS UPLOADS (El Contexto Inicial)
create table if not exists public.beta_uploads (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id),
    original_image_path text not null,
    detected_category text,
    detected_tags jsonb,
    detected_quality_score integer,
    created_at timestamp with time zone default now()
);

-- TABLA 2: LAS GENERACIONES (El Experimento)
create table if not exists public.beta_generations (
    id uuid default uuid_generate_v4() primary key,
    upload_id uuid references public.beta_uploads(id),
    style_archetype_id text,
    result_image_path text,
    full_prompt_payload jsonb,
    created_at timestamp with time zone default now()
);

-- TABLA 3: LA ELECCIÓN (El Resultado Ganador)
create table if not exists public.beta_choices (
    id uuid default uuid_generate_v4() primary key,
    upload_id uuid references public.beta_uploads(id),
    chosen_generation_id uuid references public.beta_generations(id),
    user_feedback text,
    created_at timestamp with time zone default now()
);

-- ==============================================================================
-- 2. UPGRADE LEGACY TABLES
-- ==============================================================================
alter table public.generations add column if not exists analysis_data jsonb;
alter table public.variations add column if not exists archetype_id text;

-- ==============================================================================
-- 3. POLÍTICAS DE SEGURIDAD (RLS)
-- ==============================================================================
alter table public.beta_uploads enable row level security;
alter table public.beta_generations enable row level security;
alter table public.beta_choices enable row level security;

-- Drop if exists to avoid conflicts
drop policy if exists "Users can view own uploads" on public.beta_uploads;
drop policy if exists "Users can insert own uploads" on public.beta_uploads;
drop policy if exists "Users can view own beta gens" on public.beta_generations;
drop policy if exists "System can insert beta gens" on public.beta_generations;
drop policy if exists "Users can insert choices" on public.beta_choices;

create policy "Users can view own uploads" on public.beta_uploads for select using (auth.uid() = user_id);
create policy "Users can insert own uploads" on public.beta_uploads for insert with check (auth.uid() = user_id);

create policy "Users can view own beta gens" on public.beta_generations for select using (
    exists (select 1 from public.beta_uploads where id = beta_generations.upload_id and user_id = auth.uid())
);
create policy "System can insert beta gens" on public.beta_generations for insert with check (true);

create policy "Users can insert choices" on public.beta_choices for insert with check (
    exists (select 1 from public.beta_uploads where id = beta_choices.upload_id and user_id = auth.uid())
);
