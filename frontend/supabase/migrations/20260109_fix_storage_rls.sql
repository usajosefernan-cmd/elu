-- ==============================================================================
-- FIX: PERMISOS DE STORAGE (RLS POLICY VIOLATION)
-- ==============================================================================
-- Este script corrige el error "new row violates row-level security policy"
-- permitiendo a los administradores (tú) gestionar cualquier archivo.

BEGIN;

-- 1. Eliminar la política restrictiva anterior
DROP POLICY IF EXISTS "Luxifier User Storage Access" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1ok1k7_0" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1ok1k7_1" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1ok1k7_2" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1ok1k7_3" ON storage.objects;

-- 2. Crear nueva política permisiva para el dueño Y para el ADMIN
CREATE POLICY "Luxifier User Storage Access" ON storage.objects
FOR ALL
USING (
  -- El usuario es dueño de la carpeta (UUID coincide con el nombre de la carpeta raíz)
  (storage.foldername(name))[1] = auth.uid()::text 
  OR 
  -- O el usuario es un ADMIN verificado
  public.check_is_admin() = true
)
WITH CHECK (
  (storage.foldername(name))[1] = auth.uid()::text 
  OR 
  public.check_is_admin() = true
);

COMMIT;
