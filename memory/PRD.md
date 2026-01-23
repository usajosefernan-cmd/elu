# LuxScaler v40.1 - Product Requirements Document

## Descripción General
LuxScaler es una aplicación de procesamiento de imágenes con IA que utiliza Google Gemini para transformar fotos en producciones de alta calidad con aspecto profesional cinematográfico.

## Arquitectura Actual (v40.1)
- **Frontend**: React/Vite/TypeScript
- **Backend**: FastAPI/Python (primario), Supabase Edge Functions (pendiente despliegue)
- **AI**: Google Gemini `gemini-3-pro-image-preview` con `response_modalities=['Text', 'Image']`
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage

## 🧠 Smart Mode Switch (NUEVO v40.1)
Detecta automáticamente la intención del usuario sin preguntar:

### FORENSIC (Restauración)
- **Triggers**: Solo sliders de limpieza/nitidez (P1-P6)
- **Temp**: 0.1 (seguridad máxima)
- **Seed**: 42 (siempre igual)
- **Resultado**: Arregla sin cambiar

### SHOWMAN (Creatividad)
- **Triggers**: Ropa (s3), Fondo (s5), Pelo (s2), Color (s8), Luz (L1), Estilo (L8) > nivel 3
- **Temp**: 0.75 (libertad creativa)
- **Seed**: Aleatorio (nueva magia cada vez)
- **Resultado**: Transforma con estilo cinematográfico

## Prompts Cinematográficos "La Salsa Secreta"
Archivo: `/app/backend/data/slider_definitions_v40_cinematic.json`
- L1 HIGH: "CINEMATIC REMBRANDT LIGHTING. DRAMATIC SHAFT OF LIGHT..."
- S5 FORCE: "TELEPORT TO TOKYO NIGHTS. CYBERPUNK AESTHETIC..."
- S3 FORCE: "WARDROBE OVERHAUL. HIGH-FASHION TUXEDO. GQ MAGAZINE COVER..."

## Flujo de Generación
1. Usuario sube imagen → Análisis con Gemini Flash
2. Modal de configuración con 27 sliders
3. **Smart Mode Switch** detecta FORENSIC o SHOWMAN
4. Compila prompt cinematográfico según nivel de cada slider
5. Genera con temperatura/seed apropiados
6. Navega a Archives (no a página bloqueante)

## ✅ Implementado (2025-01-23)
- [x] Bug P0: App ya no se cuelga al generar
- [x] Página /result eliminada - va directo a Archives
- [x] Smart Mode Switch (FORENSIC vs SHOWMAN)
- [x] Prompts cinematográficos v40
- [x] Modelo corregido a `gemini-3-pro-image-preview`
- [x] Detección automática de sliders creativos

## ⏳ Pendiente (Usuario debe hacer manualmente)
- [ ] **CRÍTICO**: Ejecutar migración `user_presets_v40.sql` en Supabase SQL Editor
- [ ] Desplegar Edge Functions actualizadas

## 🔮 Próximas Tareas
1. UI para guardar/aplicar presets v40 (botón "Guardar Estilo" post-generación)
2. Mejorar menú fullscreen en ArchivesDashboard

## Backlog/Futuro
- Multimodal DNA Anchor
- Context Caching con Vertex AI
- Integración Stripe

## Archivos Clave
| Archivo | Descripción |
|---------|-------------|
| `/app/backend/routes/process.py` | Smart Mode Switch + compile |
| `/app/backend/data/slider_definitions_v40_cinematic.json` | Prompts cinematográficos |
| `/app/backend/services/gemini_service.py` | gemini-3-pro-image-preview |
| `/app/frontend/src/App.tsx` | Orquestador sin /result |

## Credenciales de Test
- Email: `usajosefernan@gmail.com`
- Password: `111111`

---
*Última actualización: 2025-01-23*
