# LuxScaler v40.1 - Product Requirements Document

## Descripción General
LuxScaler es una aplicación de procesamiento de imágenes con IA que utiliza Google Gemini para transformar fotos en producciones de alta calidad con aspecto profesional cinematográfico.

## Arquitectura Actual (v40.1)
- **Frontend**: React/Vite/TypeScript
- **Backend**: FastAPI/Python (primario)
- **AI**: Google Gemini `gemini-3-pro-image-preview` con salida 4K
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage

## 🔥 Funcionalidades Principales

### 1. Smart Mode Switch
Detecta automáticamente la intención del usuario:
- **FORENSIC** (Temp 0.1, Seed 42): Solo restauración
- **SHOWMAN** (Temp 0.75, Seed aleatorio): Transformación creativa

### 2. THE DICTATOR PROMPT
Sistema para garantizar consistencia estilística en presets:
- Detecta sliders dominantes (>8)
- Construye "Style Lock Prompt" agresivo
- Se inyecta AL FINAL del prompt (Recency Bias)

### 3. Batch Processing (NUEVO)
Procesar múltiples fotos con el mismo estilo:
- Endpoint: `POST /api/process/batch-generate`
- Máximo 10 imágenes por lote
- Mismo seed para todas (consistencia)
- UI con botón morado en navegación

### 4. Vision Service Optimizado
- Tiempo de respuesta: ~5 segundos (antes 20s)
- Prompt compacto para clasificación rápida

## ✅ Implementado (2025-01-23)
- [x] Smart Mode Switch (FORENSIC/SHOWMAN)
- [x] THE DICTATOR PROMPT para presets
- [x] Batch processing (múltiples fotos, mismo estilo)
- [x] Generación 4K con gemini-3-pro-image-preview
- [x] Vision Service optimizado (~5s)
- [x] Upload de fotos funciona
- [x] Página /result eliminada → Archives

## 📋 Endpoints Clave
| Endpoint | Descripción |
|----------|-------------|
| `POST /api/process/analyze` | Análisis de visión (~5s) |
| `POST /api/process/compile` | Compila prompt con Smart Switch |
| `POST /api/process/generate-image` | Genera 1 imagen 4K |
| `POST /api/process/batch-generate` | Genera N imágenes con mismo estilo |
| `POST /api/presets/v40/save-style` | Guarda preset con Dictator Prompt |

## 🔮 Próximas Tareas
1. 🟡 UI mejorada para selección de presets en batch
2. 🟡 Progreso visual durante batch processing
3. 🟡 Guardar resultados de batch al archivo automáticamente

## Backlog/Futuro
- Multimodal DNA Anchor
- Context Caching Vertex AI
- Integración Stripe

## Credenciales de Test
- Email: `usajosefernan@gmail.com`
- Password: `111111`

---
*Última actualización: 2025-01-23*
