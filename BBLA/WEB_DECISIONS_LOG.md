# LuxScaler v28 Web Decisions Log

## 2026-01-21

### Upload & Vision flow
- Immediate UI feedback required after selecting image.
- Vision analysis uses FastAPI Gemini 2.5 Flash.
- Vision should use a base64-encoded JPEG derived from the input image.
- User request: Vision input should preserve noise/detail; target approx 19.5MP at 80% JPEG quality.

### Profiles
- All modes (USER/PRO/PROLUX) must have an AUTO option.
- Must provide "Auto en todo" for modes with multiple controls.
- Default values must match what AUTO would choose (suggested_settings) rather than fixed 5.

### Storage / Archive
- Use Supabase Storage bucket `lux-storage`.
- Archive must display generations using stable public URLs (avoid `data:` and `blob:` in DB).
- Tables added: `generations`, `variations` with RLS.

### Non-goals
- Do not remove admin useful pages.
- Do not remove footer/navigation/page layout.
