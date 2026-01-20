
-- 1. Crear tabla de códigos beta
create table if not exists public.access_codes (
    id uuid default uuid_generate_v4() primary key,
    code text unique not null, -- El código en sí (ej: "LUX-2025")
    description text, -- "Para familia", "Evento TechCrunch"
    max_uses integer default 100, -- Límite de usos
    current_uses integer default 0,
    is_active boolean default true,
    expires_at timestamp with time zone,
    created_at timestamp with time zone default now()
);

-- 2. Habilitar RLS
alter table public.access_codes enable row level security;

-- 3. Políticas de seguridad
-- Permitir lectura pública para verificar códigos (o restringir a función RPC para más seguridad)
create policy "Public read access codes" on public.access_codes for select using (true);

-- Solo admins pueden crear/editar
create policy "Admins manage access codes" on public.access_codes using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- 4. Datos iniciales (Semilla)
insert into public.access_codes (code, description, max_uses) values 
('LUX-BETA', 'General Beta Access', 1000),
('LUX-VIP', 'VIP Access', 50),
('INVITADO', 'Guest Access', 100)
on conflict (code) do nothing;

-- 5. Función para Validar Código
create or replace function validate_access_code(input_code text)
returns boolean as $$
declare
  code_record public.access_codes%rowtype;
begin
  select * into code_record from public.access_codes where code = input_code and is_active = true;
  
  if not found then
    return false;
  end if;

  if code_record.max_uses is not null and code_record.current_uses >= code_record.max_uses then
    return false;
  end if;

  -- Incrementar uso
  update public.access_codes set current_uses = current_uses + 1 where id = code_record.id;
  
  return true;
end;
$$ language plpgsql security definer;
