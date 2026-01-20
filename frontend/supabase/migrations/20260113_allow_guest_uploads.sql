-- ==============================================================================
-- FIX: GUEST UPLOAD ACCESS (ANON) - IDEMPOTENT
-- ==============================================================================
-- Allows unauthenticated users (anon) to upload ONLY to the 'guest_analysis' folder.

BEGIN;

-- 1. DROP Policy first to avoid "42710: policy already exists" error
DROP POLICY IF EXISTS "Allow Anon Uploads to Guest Folder" ON storage.objects;

-- 2. Re-create Policy for Anon Uploads
CREATE POLICY "Allow Anon Uploads to Guest Folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lux-storage' 
  AND (storage.foldername(name))[1] = 'guest_analysis'
  AND auth.role() = 'anon'
);

COMMIT;
