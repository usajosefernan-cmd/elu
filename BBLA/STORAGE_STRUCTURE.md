# LuxScaler v28 Storage Structure (Supabase)

Bucket: `lux-storage`

## Path conventions

### 1) Upload inputs
- `inputs/{user_id}/{session_id}/thumb_{timestamp}.jpg`
- `inputs/{user_id}/{session_id}/master_{timestamp}.jpg`

### 2) Variations (previews)
- `variations/{user_id}/{session_id}/preview_{timestamp}.jpg`

### 3) Masters
- `masters/{user_id}/{session_id}/master4k_{timestamp}.jpg`
- `masters/{user_id}/{session_id}/master8k_{timestamp}.jpg`

## Notes
- “Folders” are prefixes; Supabase Storage does not require explicit folder creation.
- Any UI must always persist archive entries with URLs that are stable (public URL) rather than `blob:` or `data:`.
- Vision analysis should not block on Storage URL propagation. It can use base64 directly.
