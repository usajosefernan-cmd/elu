# LuxScaler v28.1 - Product Requirements Document

## Descripción General
LuxScaler es una aplicación de procesamiento de imágenes con IA que utiliza Google Gemini para transformar fotos en producciones de alta calidad con aspecto profesional.

## Arquitectura Implementada

### Backend (FastAPI)
- **Servicios Principales:**
  - `input_normalizer.py` - Normalización de entrada (19.5MP máx, JPEG sRGB)
  - `vision_service.py` - Análisis de imagen con Creative Director prompt
  - `semantic_motor.py` - Traducción de sliders a instrucciones
  - `veto_engine.py` - Resolución de conflictos entre sliders
  - `identity_lock_service.py` - Preservación de identidad facial
  - `prompt_compiler_service.py` - Compilación del prompt universal v28.1
  - `smart_presets_service.py` - Gestión de presets con narrative_anchors
  - `gemini_service.py` - Generación de imágenes con Gemini

- **Rutas API:**
  - `/api/process/analyze` - Análisis de visión
  - `/api/process/normalize` - Normalización de imagen
  - `/api/process/compile` - Compilación de prompt
  - `/api/process/generate-image` - Generación de imagen
  - `/api/presets/system` - Presets del sistema
  - `/api/presets/user/{user_id}` - Presets del usuario
  - `/api/presets/blend` - Mezcla preset + auto

### Frontend (React/TypeScript/Vite)
- **Componentes Implementados v28:**
  - `VisionConfirmModal.tsx` - Modal de confirmación con categoría, alerts, intents
  - `ProfileConfigModal.tsx` - Control de 27 sliders por perfil (AUTO/USER/PRO/PROLUX)
  - `SmartPresetSelector.tsx` - Selector de presets inteligentes
  - `IntentSpectrum.tsx` - Espectro de 5 niveles (FIX → AGGRESSIVE)
  - `ArchivesDashboard.tsx` - Vista de archivos con prompt y sliders

- **Servicios Frontend:**
  - `edgeFunctionsService.ts` - Comunicación con backend
  - `smartPresetsService.ts` - Gestión de presets

## Features Implementadas (v28.1)

### ✅ Completado
1. **Input Normalization (Fase 1)**
   - Máximo 19.5MP con downscale Lanczos
   - Formato JPEG sRGB Quality 90
   - Hash para caché

2. **Proxy Vision (Fase 2)**
   - Thumbnails de 1024px para análisis
   - Ahorro de ~80% en costo de visión

3. **Creative Director Prompt**
   - Detección de categoría (SELFIE, PORTRAIT, REAL_ESTATE, etc.)
   - Production Gap Analysis
   - 5 Intent Headlines
   - Auto-config de 27 sliders
   - Technical Diagnosis completo

4. **Category Rules**
   - Reglas por categoría con priority_sliders
   - max_reencuadre por tipo
   - Identity Lock level (strict/moderate/none)
   - Protocol Alerts

5. **Semantic Motor (Fase 3)**
   - Traducción de valores 1-10 a instrucciones
   - Indicadores de intensidad (○/◐/●)
   - Detección de conflictos

6. **Veto Engine (Fase 4)**
   - La Paradoja Forense
   - La Tiranía del Drama
   - Paradoja de Geometría
   - Claridad vs Atmósfera
   - Piel Sintética vs Grano
   - Cronos Congela Todo

7. **Identity Lock (Fase 5)**
   - Análisis de riesgo de identidad
   - Bloque de instrucciones dinámico
   - DNA Anchor instruction

8. **Smart Presets**
   - 6 presets del sistema (Natural, Editorial, Cinematic, Portrait Pro, Real Estate, Restoration)
   - narrative_anchors
   - smart_locks
   - Blend con auto_settings

9. **5 Intent Spectrum**
   - FIX (×0.3)
   - POLISHED (×0.6)
   - CREATIVE (×1.0)
   - STYLIZED (×1.3)
   - AGGRESSIVE (×1.6)

10. **27 Sliders Completos**
    - PhotoScaler: 9 sliders
    - StyleScaler: 9 sliders
    - LightScaler: 9 sliders

### 🔄 Pendiente
1. **Biopsy Engine** - Thumbnail + 3 crops para análisis
2. **Context Caching** - Caché de contexto por usuario
3. **Job Queues** - Procesamiento asíncrono
4. **Storage Structure** - Estructura de carpetas definida
5. **Stripe Integration** - Pagos en /pricing

### ❌ Bugs Conocidos
1. **Sliders P0** - Verificar que sliders en 10 afectan la imagen
2. **Aspect Ratio** - Verificar alineación en Archives
3. **Legacy Modal** - ImageInspectorModal aparece después de generación

## 27 Sliders - Definición

### PhotoScaler (📷 Calidad de Imagen)
| Slider | Nombre UI | Descripción FORCE |
|--------|-----------|-------------------|
| limpieza_artefactos | Limpieza | Reconstrucción forense |
| geometria | Geometría | Perfección euclidiana |
| optica | Óptica | Nitidez sintética |
| chronos | Movimiento | 1/8000s cristalino |
| senal_raw | Rango Din. | Workflow 32-bit |
| sintesis_adn | Textura | Texturas 16K |
| grano_filmico | Grano | 16MM vintage |
| enfoque | Enfoque | Vectorial |
| resolucion | Escala | Impresión gigante |

### StyleScaler (🎨 Estilo Visual)
| Slider | Nombre UI | Descripción FORCE |
|--------|-----------|-------------------|
| styling_piel | Piel | Superficie sintética |
| styling_pelo | Cabello | Fibra sintética perfecta |
| styling_ropa | Ropa | Lujo sintetizado |
| maquillaje | Maquillaje | Stage makeup extremo |
| limpieza_entorno | Fondo | Estudio infinito |
| reencuadre_ia | Encuadre | Espiral Fibonacci |
| atmosfera | Atmósfera | Silent Hill fog |
| look_cine | Cinema | Matrix grade |
| materiales_pbr | Materiales | Unreal Engine 5 |

### LightScaler (☀️ Iluminación)
| Slider | Nombre UI | Descripción FORCE |
|--------|-----------|-------------------|
| key_light | Principal | Spotlight teatral |
| fill_light | Relleno | Mundo sin sombras |
| rim_light | Contorno | Neon Tron |
| volumetria | Volumen | Haces láser |
| temperatura | Temp. | Fuego y hielo |
| contraste | Contraste | Blanco y negro binario |
| sombras | Sombras | Vantablack |
| estilo_autor | Estilo | Renacimiento |
| reflejos | Brillo | Cromado |

## Categorías Detectadas
- SELFIE - Identity Lock strict, max_reencuadre 3
- PORTRAIT - Identity Lock strict, max_reencuadre 5
- GROUP - Identity Lock strict, max_reencuadre 3
- REAL_ESTATE - Identity Lock none, max_reencuadre 8
- PRODUCT - Identity Lock none, max_reencuadre 7
- FOOD - Identity Lock none, max_reencuadre 5
- LANDSCAPE - Identity Lock none, max_reencuadre 10
- EVENT - Identity Lock moderate, max_reencuadre 4
- DOCUMENT - Identity Lock none, max_reencuadre 10
- PET - Identity Lock none, max_reencuadre 6
- ART - Identity Lock none, max_reencuadre 3
- OTHER - Identity Lock moderate, max_reencuadre 5

## Archivos Clave
- `/app/BBLA/maestro arqu.md` - Documento maestro v28
- `/app/backend/services/` - Todos los servicios del backend
- `/app/frontend/src/components/` - Componentes UI
- `/app/backend/migrations/vision_category_rules.sql` - Schema de categorías

## Credenciales de Prueba
- Email: usajosefernan@gmail.com
- Password: 111111

## Changelog

### v28.1 (2025-01-21)
- ✅ Implementado Input Normalizer
- ✅ Implementado Semantic Motor
- ✅ Implementado Veto Engine
- ✅ Implementado Identity Lock Service
- ✅ Reescrito Prompt Compiler Service
- ✅ Reescrito Vision Service con Creative Director
- ✅ Implementado Smart Presets Service
- ✅ Añadidas rutas /api/presets/*
- ✅ Creado VisionConfirmModal con categorías y alerts
- ✅ Creado SmartPresetSelector component
- ✅ Creado IntentSpectrum component
- ✅ Creada migración vision_category_rules.sql
