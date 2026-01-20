
-- ==============================================================================
-- LUXIFIER V2.2 VELVET ROPE SCHEMA (SUPABASE / POSTGRESQL)
-- UPDATES: Added Generation History (Big Data), Subscription Tiers.
-- SYNC: Updated to match Lux Logic v25.0
-- ==============================================================================

-- ==============================================================================
-- 1. LIMPIEZA Y EXTENSIONES
-- ==============================================================================
create extension if not exists "uuid-ossp";

-- ==============================================================================
-- 2. TABLAS PRINCIPALES
-- ==============================================================================

-- 2.1 TABLA: PROFILES (Usuarios y Suscripción)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  lumens_balance integer default 0, 
  is_admin boolean default false,
  
  -- SUBSCRIPTION DATA (VELVET ROPE MODEL)
  subscription_tier text default 'free', -- 'free', 'beta_founder', 'pro_monthly'
  subscription_status text default 'inactive', -- 'active', 'past_due', 'cancelled'
  
  created_at timestamp with time zone default now()
);

-- 2.2 TABLA: GENERATION HISTORY (El "Big Data" del Usuario)
-- Guarda CADA generación, incluso las gratuitas, para entrenamiento futuro.
create table if not exists public.generation_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  
  -- INPUTS
  original_image_path text, -- URL del Storage
  detected_context jsonb, -- Análisis semántico (category, tags)
  input_aspect_ratio numeric, -- Ratio calculado en frontend
  
  -- RECETA "ADN" (Configuración exacta usada)
  config_used jsonb not null, -- El objeto LuxConfig completo
  style_preset_id text, -- ID si se usó un preset base
  
  -- OUTPUTS
  result_image_path text, -- URL del resultado (Preview o Master)
  is_favorite boolean default false, -- Feedback del usuario
  
  created_at timestamp with time zone default now()
);

-- 2.3 TABLA: USER PRESETS (Para usuarios PRO)
create table if not exists public.user_presets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  config_json jsonb not null, -- Objeto LuxConfig a restaurar
  created_at timestamp with time zone default now()
);

-- ==============================================================================
-- 3. FUNCIONES DE LÓGICA DE NEGOCIO
-- ==============================================================================

-- Helper para verificar Admin
create or replace function public.check_is_admin()
returns boolean
language sql
security definer
stable
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ==============================================================================
-- 4. POLÍTICAS DE SEGURIDAD (RLS)
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.generation_history enable row level security;
alter table public.user_presets enable row level security;

-- Clean old policies
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can view own history" on public.generation_history;
drop policy if exists "Users can insert own history" on public.generation_history;
drop policy if exists "Users can update own history" on public.generation_history;
drop policy if exists "Users can view own presets" on public.user_presets;
drop policy if exists "Users can modify own presets" on public.user_presets;

-- PROFILES
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- HISTORY
create policy "Users can view own history" on public.generation_history for select using (auth.uid() = user_id);
create policy "Users can insert own history" on public.generation_history for insert with check (auth.uid() = user_id);
create policy "Users can update own history" on public.generation_history for update using (auth.uid() = user_id);

-- PRESETS
create policy "Users can view own presets" on public.user_presets for select using (auth.uid() = user_id);
create policy "Users can modify own presets" on public.user_presets for all using (auth.uid() = user_id);

-- ==============================================================================
-- 5. CONFIGURACIÓN DE STORAGE
-- ==============================================================================
insert into storage.buckets (id, name, public) values ('lux-storage', 'lux-storage', true) on conflict (id) do nothing;

drop policy if exists "Luxifier User Storage Access" on storage.objects;
create policy "Luxifier User Storage Access" on storage.objects for all 
using (auth.uid()::text = (storage.foldername(name))[1]) 
with check (auth.uid()::text = (storage.foldername(name))[1]);

-- ==============================================================================
-- 6. TRIGGERS (Auto-Create Profile)
-- ==============================================================================
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, subscription_tier)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'free')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- ==============================================================================
-- 7. ADD NEW COLUMNS TO EXISTING PROFILES (Migration for existing users)
-- ==============================================================================
alter table public.profiles add column if not exists subscription_tier text default 'free';
alter table public.profiles add column if not exists subscription_status text default 'inactive';
