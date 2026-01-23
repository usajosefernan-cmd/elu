# LuxScaler v40.1 - Product Requirements Document

## Descripción General
LuxScaler es una aplicación de procesamiento de imágenes con IA que utiliza Google Gemini para transformar fotos en producciones de alta calidad con aspecto profesional cinematográfico.

## Arquitectura Actual (v40.1)
- **Frontend**: React/Vite/TypeScript
- **Backend**: FastAPI/Python (primario), Supabase Edge Functions (pendiente despliegue)
- **AI**: Google Gemini `gemini-2.0-flash-exp` con `response_modalities=['Text', 'Image']`
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage

## Flujo de Generación de Imagen
1. Usuario sube imagen → Análisis con Gemini Flash
2. Modal de configuración aparece con 27 sliders
3. Usuario ajusta sliders y hace clic en "Generar"
4. Frontend llama a `/api/process/compile` → Compila prompt v40.1
5. Frontend llama a `/api/process/generate-image` → Gemini genera imagen
6. Imagen se muestra en `/result` y se guarda en Archives

## Universal Cinematic Production Protocol v40.1
Prompt template que implementa:
- **THE TALENT (Read-Only)**: Biometric lock en rostro, identidad, expresión
- **THE PRODUCTION (Write-Access)**: Ropa, fondo, iluminación pueden cambiar
- 27 sliders organizados en 3 pilares: PHOTOSCALER, STYLESCALER, LIGHTSCALER

## ✅ Implementado
- [x] Bug P0: App ya no se cuelga al generar (2025-01-23)
- [x] Modelo Gemini corregido a `gemini-2.0-flash-exp`
- [x] Backend compila prompts v40.1 correctamente
- [x] Backend genera imágenes con Gemini native image generation
- [x] Frontend usa FastAPI directamente (bypass Edge Functions)
- [x] Timeout aumentado a 120-180 segundos para generación

## ⏳ Pendiente (Usuario debe hacer manualmente)
- [ ] **CRÍTICO**: Ejecutar migración `user_presets_v40.sql` en Supabase SQL Editor
  ```sql
  -- Archivo: /app/backend/migrations/user_presets_v40.sql
  -- Esta tabla habilita guardar "estilos" con seed + temperature
  ```
- [ ] Desplegar Edge Functions actualizadas con `npx supabase functions deploy`

## 🔮 Próximas Tareas
1. UI para guardar/aplicar presets v40 (requiere tabla `user_presets`)
2. Mejorar menú fullscreen en ArchivesDashboard
3. Mostrar prompt completo en panel Info de Archives

## Backlog/Futuro
- Multimodal DNA Anchor
- Context Caching con Vertex AI
- Biopsy Engine
- Integración Stripe

## Archivos Clave
| Archivo | Descripción |
|---------|-------------|
| `/app/frontend/src/App.tsx` | Orquestador principal |
| `/app/frontend/src/services/edgeFunctionsService.ts` | Servicio de API |
| `/app/backend/routes/process.py` | Endpoints de generación |
| `/app/backend/services/gemini_service.py` | Integración con Gemini |
| `/app/backend/migrations/user_presets_v40.sql` | Migración pendiente |

## Credenciales de Test
- Email: `usajosefernan@gmail.com`
- Password: `111111`

## URLs
- Preview: https://visionaire-3.preview.emergentagent.com
- Supabase: https://uxqtxkuldjdvpnojgdsh.supabase.co

---
*Última actualización: 2025-01-23*
