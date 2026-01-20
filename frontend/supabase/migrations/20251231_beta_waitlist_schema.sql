
-- Tabla para la lista de espera de la Beta
create table if not exists public.beta_waitlist (
    id uuid default uuid_generate_v4() primary key,
    email text not null,
    name text,
    status text default 'pending', -- 'pending', 'invited'
    ip_address text,
    created_at timestamp with time zone default now()
);

-- Habilitar seguridad
alter table public.beta_waitlist enable row level security;

-- Permitir que CUALQUIERA (incluso sin loguear) inserte su email
drop policy if exists "Allow anonymous inserts to waitlist" on public.beta_waitlist;
create policy "Allow anonymous inserts to waitlist" 
on public.beta_waitlist 
for insert 
with check (true);

-- Solo los admins (tú) pueden ver la lista (desde el dashboard de Supabase)
drop policy if exists "Only admins view waitlist" on public.beta_waitlist;
create policy "Only admins view waitlist" 
on public.beta_waitlist 
for select 
using (auth.role() = 'service_role' or (select is_admin from public.profiles where id = auth.uid()) = true);
