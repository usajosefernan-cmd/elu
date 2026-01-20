-- ==============================================================================
-- FIX: PERMISOS DE STORAGE PARA USUARIOS REGISTRADOS
-- ==============================================================================
-- Este script asegura que cualquier usuario autenticado pueda subir archivos
-- a su carpeta personal (nombrada con su UUID).

BEGIN;

-- 1. Eliminar políticas anteriores que puedan estar causando conflictos
DROP POLICY IF EXISTS "Luxifier User Storage Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;

-- 2. Política para LECTURA PÚBLICA (el bucket ya es público)
CREATE POLICY "Allow public read" ON storage.objects
FOR SELECT
USING (bucket_id = 'lux-storage');

-- 3. Política para SUBIDA: Usuario autenticado puede subir a su carpeta
CREATE POLICY "Allow authenticated uploads to own folder" ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'lux-storage'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Política para ACTUALIZACIÓN/ELIMINACIÓN: Usuario puede modificar sus archivos
CREATE POLICY "Allow authenticated modify own files" ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'lux-storage'
    AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'lux-storage'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow authenticated delete own files" ON storage.objects
FOR DELETE
USING (
    bucket_id = 'lux-storage'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Política para ADMIN: Puede hacer todo
CREATE POLICY "Admin full access" ON storage.objects
FOR ALL
USING (
    bucket_id = 'lux-storage'
    AND public.check_is_admin() = true
)
WITH CHECK (
    bucket_id = 'lux-storage'
    AND public.check_is_admin() = true
);

COMMIT;
