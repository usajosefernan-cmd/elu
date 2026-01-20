-- ==============================================================================
-- FIX: ADMIN VISIBILITY FOR VARIATIONS
-- ==============================================================================
-- Allows Admins (is_admin = true) to see variations from ALL users.
-- This fixes the "0 VARS" issue in the Archive/Admin Dashboard.

BEGIN;

-- 1. Create Policy for Admin Read Access on Variations
-- using PERMISSIVE (additive) logic.
DROP POLICY IF EXISTS "Admin view all variations" ON variations;

CREATE POLICY "Admin view all variations" ON variations
FOR SELECT
TO authenticated
USING (
    public.check_is_admin() = true
);

COMMIT;
