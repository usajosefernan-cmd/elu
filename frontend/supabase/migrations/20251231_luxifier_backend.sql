
-- ==============================================================================
-- 1. LIMPIEZA Y EXTENSIONES (Cuidado: Esto borra datos si reinicias)
-- ==============================================================================
create extension if not exists "uuid-ossp";

-- ==============================================================================
-- 2. TABLAS PRINCIPALES (LO ANTIGUO + LO NUEVO)
-- ==============================================================================

-- 2.1 TABLA: PROFILES (Usuarios y Créditos)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  lumens_balance integer default 100, -- Saldo inicial de prueba
  is_admin boolean default false,
  created_at timestamp with time zone default now()
);

-- 2.2 TABLA: GENERATIONS (Sesiones de Fotos)
create table if not exists public.generations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  status text default 'analyzing',
  original_image_path text not null, -- URL del Storage
  original_image_thumbnail text,
  semantic_analysis jsonb, -- Datos de análisis de Gemini
  created_at timestamp with time zone default now()
);

-- 2.3 TABLA: VARIATIONS (Resultados: Previews, Masters y Upscales)
create table if not exists public.variations (
  id uuid default uuid_generate_v4() primary key,
  generation_id uuid references public.generations(id) on delete cascade not null,
  type text default 'preview', -- 'preview', 'master_4k', 'upscale_8k'
  style_id text not null, -- 'clinical_divine', 'cine_drama', etc.
  image_path text, -- URL del Storage
  prompt_payload jsonb not null, -- El prompt exacto usado
  seed bigint not null, -- Semilla para determinismo
  engineering_report jsonb, -- Logs técnicos
  rating integer default 0,
  is_selected boolean default false,
  created_at timestamp with time zone default now()
);

-- [LO NUEVO] 2.4 TABLA: USER PRESETS (Guardar configuraciones)
create table if not exists public.user_presets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  config jsonb not null, -- Objeto LuxConfig
  created_at timestamp with time zone default now()
);

-- ==============================================================================
-- 3. FUNCIONES DE LÓGICA DE NEGOCIO (RPC)
-- ==============================================================================

-- Función segura para descontar créditos (Lumens)
create or replace function public.decrement_lumens(user_id uuid, amount int)
returns void
language plpgsql
security definer
as $$
declare
  current_bal int;
begin
  -- Bloquear fila para evitar condiciones de carrera
  select lumens_balance into current_bal
  from public.profiles
  where id = user_id
  for update;

  if current_bal < amount then
    raise exception 'Saldo insuficiente (Insuficiente Lumens)';
  end if;

  update public.profiles
  set lumens_balance = lumens_balance - amount
  where id = user_id;
end;
$$;

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
-- 4. POLÍTICAS DE SEGURIDAD (ROW LEVEL SECURITY - RLS)
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.generations enable row level security;
alter table public.variations enable row level security;
alter table public.user_presets enable row level security;

-- Limpiar políticas antiguas para evitar conflictos
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can view own generations" on public.generations;
drop policy if exists "Users can insert own generations" on public.generations;
drop policy if exists "Users can view own variations" on public.variations;
drop policy if exists "Users can insert own variations" on public.variations;
drop policy if exists "Users can update own variations" on public.variations;
drop policy if exists "Users can view own presets" on public.user_presets;
drop policy if exists "Users can insert own presets" on public.user_presets;
drop policy if exists "Users can delete own presets" on public.user_presets;

-- PROFILES
create policy "Users can view own profile" on public.profiles 
  for select using (auth.uid() = id);

create policy "Admins can view all profiles" on public.profiles 
  for select using (public.check_is_admin());

create policy "Users can update own profile" on public.profiles 
  for update using (auth.uid() = id);

-- GENERATIONS
create policy "Users can view own generations" on public.generations 
  for select using (auth.uid() = user_id);

create policy "Users can insert own generations" on public.generations 
  for insert with check (auth.uid() = user_id);

-- VARIATIONS
create policy "Users can view own variations" on public.variations 
  for select using (
    exists (select 1 from public.generations g where g.id = variations.generation_id and g.user_id = auth.uid())
  );

create policy "Users can insert own variations" on public.variations 
  for insert with check (
    exists (select 1 from public.generations g where g.id = generation_id and g.user_id = auth.uid())
  );

create policy "Users can update own variations" on public.variations 
  for update using (
    exists (select 1 from public.generations g where g.id = generation_id and g.user_id = auth.uid())
  );

-- [LO NUEVO] USER PRESETS
create policy "Users can view own presets" on public.user_presets 
  for select using (auth.uid() = user_id);

create policy "Users can insert own presets" on public.user_presets 
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own presets" on public.user_presets 
  for delete using (auth.uid() = user_id);

-- ==============================================================================
-- 5. CONFIGURACIÓN DE STORAGE
-- ==============================================================================
insert into storage.buckets (id, name, public) 
values ('lux-storage', 'lux-storage', true)
on conflict (id) do nothing;

drop policy if exists "Luxifier User Storage Access" on storage.objects;
create policy "Luxifier User Storage Access" on storage.objects
  for all 
  using (auth.uid()::text = (storage.foldername(name))[1]) 
  with check (auth.uid()::text = (storage.foldername(name))[1]);

-- ==============================================================================
-- 6. TRIGGERS AUTOMÁTICOS [CRÍTICO]
-- ==============================================================================
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, is_admin)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    -- [LO NUEVO] Lógica automática de Admin para tu email
    case 
        when new.email = 'usajosefernan@gmail.com' then true 
        else false 
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created 
after insert on auth.users 
for each row execute procedure public.handle_new_user();
