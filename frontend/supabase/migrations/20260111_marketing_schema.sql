
-- 20260111_marketing_schema.sql

-- Tabla para el historial de campañas de marketing
create table if not exists public.marketing_campaigns (
    id uuid default uuid_generate_v4() primary key,
    subject text not null,
    content_html text not null,
    segment text not null, -- 'all', 'waitlist', 'pro', etc.
    sent_at timestamp with time zone default now(),
    sender_id uuid references public.profiles(id),
    stats jsonb default '{"sent": 0, "opened": 0, "clicked": 0}'::jsonb
);

-- Tabla para configuraciones del sistema (incluyendo automatización de emails)
create table if not exists public.system_settings (
    key text primary key,
    value text,
    description text,
    updated_at timestamp with time zone default now()
);

-- Seed de configuraciones iniciales
insert into public.system_settings (key, value, description) values
('automation_welcome_enabled', 'false', 'Enable or disable automatic welcome email for waitlist'),
('welcome_email_subject', 'Bienvenido a LuxScaler', 'Subject line for the welcome email'),
('welcome_email_html', '<html><body><h1>¡Hola!</h1><p>Gracias por unirte a LuxScaler.</p></body></html>', 'HTML content for the welcome email')
on conflict (key) do nothing;

-- RLS
alter table public.marketing_campaigns enable row level security;
alter table public.system_settings enable row level security;

create policy "Admins can manage marketing" on public.marketing_campaigns
for all using ( (select is_admin from public.profiles where id = auth.uid()) = true );

create policy "Admins can manage settings" on public.system_settings
for all using ( (select is_admin from public.profiles where id = auth.uid()) = true );

create policy "Public can read some settings" on public.system_settings
for select using ( true );
