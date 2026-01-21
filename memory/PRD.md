# LuxScaler v28.1 - Product Requirements Document

## Descripción General
LuxScaler es una aplicación de procesamiento de imágenes con IA que utiliza Google Gemini para transformar fotos en producciones de alta calidad con aspecto profesional.

## Modal Unificado v28.1

### Estructura
```
┌─────────────────────────────────┐
│ [img] Categoría            [X]  │
├─────────────────────────────────┤
│ Diagnóstico: R:5 B:3 C:7   [▼]  │
├─────────────────────────────────┤
│ Modo                            │
│ [AUTO] [USER] [PRO] [PROLUX]    │
├─────────────────────────────────┤
│ Intensidad (solo AUTO)          │
│ [Min][Sutil][Normal][Fuerte][Max]│
├─────────────────────────────────┤
│ Preset base (USER/PRO/PROLUX)   │
│ [Ninguno][Natural][Editorial]...│
├─────────────────────────────────┤
│ Ajustes (sliders según perfil)  │
│ ▼ Imagen                        │
│   Limpieza ────●──── 7          │
│   Enfoque  ──●────── 4 🔒       │
│ ▼ Estilo                        │
│ ▼ Luz                           │
├─────────────────────────────────┤
│ [      Generar (10 tokens)     ]│
└─────────────────────────────────┘
```

### Perfiles de Usuario
| Perfil | Sliders Visibles | Descripción |
|--------|-----------------|-------------|
| AUTO   | 0 (solo intensidad) | IA decide todo |
| USER   | 6 básicos | Control simple |
| PRO    | 15 sliders | Control avanzado |
| PROLUX | 27 sliders | Control total |

### Presets con Sliders Bloqueados
Los presets cargan valores en ciertos sliders y los BLOQUEAN:
- **Natural**: grano_filmico, look_cine, atmosfera
- **Editorial**: look_cine, styling_piel, styling_pelo, contraste
- **Cine**: look_cine, grano_filmico, atmosfera, contraste, estilo_autor
- **Retrato**: styling_piel, styling_pelo, maquillaje, key_light, fill_light
- **Inmueble**: geometria, limpieza_entorno, key_light, fill_light
- **Restaurar**: limpieza_artefactos, enfoque, sintesis_adn, resolucion

El resto de sliders quedan LIBRES para que el usuario los modifique.

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
2. **Context Caching Vertex AI** - Requiere google-cloud-aiplatform SDK y GCP config
3. **Face Detection Dependencies** - Instalar face_recognition para DNA Anchor completo
4. **Job Queues** - Procesamiento asíncrono
5. **Storage Structure** - Estructura de carpetas definida
6. **Stripe Integration** - Pagos en /pricing

### ❌ Bugs Conocidos
1. **Sliders P0** - Verificar que sliders en 10 afectan la imagen generada (prompt correcto, verificar Gemini)
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
- `/app/BBLA/maestro arqu.md` - Documento maestro v28 (actualizado con FASE 4 y 5)
- `/app/backend/services/prompt_compiler_service.py` - El Cerebro v28.0
- `/app/backend/services/conflict_veto_engine.py` - Motor de vetos (NEW)
- `/app/backend/services/block_injector.py` - Inyector de bloques (NEW)
- `/app/backend/services/semantic_sanitizer.py` - Sanitizador semántico (NEW)
- `/app/backend/services/identity_lock.py` - Identity Lock dinámico (NEW)
- `/app/backend/services/dna_anchor_generator.py` - DNA Anchor Generator (NEW)
- `/app/backend/services/multimodal_prompt_injector.py` - Multimodal Injector (NEW)
- `/app/backend/services/context_cache_manager.py` - Context Cache Manager (NEW)
- `/app/frontend/src/components/` - Componentes UI
- `/app/backend/migrations/vision_category_rules.sql` - Schema de categorías

## Credenciales de Prueba
- Email: usajosefernan@gmail.com
- Password: 111111

## Nuevos Servicios Backend v28.0

### Estructura de Servicios (FASE 4 & 5)
```
backend/services/
├── conflict_veto_engine.py      # 7 reglas de veto
├── block_injector.py            # Inyección de bloques por pilar
├── semantic_sanitizer.py        # Limpieza y validación
├── identity_lock.py             # Lock dinámico facial
├── dna_anchor_generator.py      # Detección facial + crop
├── multimodal_prompt_injector.py # Contenido multimodal
├── context_cache_manager.py     # Cache Vertex AI (stub)
└── prompt_compiler_service.py   # Orquestador principal
```

### Flujo del Prompt Compiler
```
1. Flatten Config → Dict plano de sliders
2. Apply Vetos → Resuelve conflictos lógicos
3. Translate Sliders → Instrucciones semánticas
4. Inject Blocks → Bloques por pilar
5. Generate Identity Lock → Según contexto
6. Generate DNA Anchor → Si hay imagen con cara
7. Build System Prompt → Template dinámico
8. Sanitize → Elimina redundancias
9. Context Cache → Si disponible
```

### Endpoint de Compilación
```bash
POST /api/process/compile
{
  "config": {...sliders...},
  "visionAnalysis": {...},
  "profileType": "AUTO|USER|PRO|PROLUX",
  "includeDebug": true  # Para ver vetos y sanitization
}
```

## Changelog

### v28.2 (2025-01-21) - FASE 4 & 5 COMPLETE
- ✅ **Conflict Veto Engine** (conflict_veto_engine.py)
  - 7 reglas de veto implementadas
  - La Paradoja Forense, La Tiranía del Drama, Paradoja de Geometría, etc.
  - Auto-resolución de conflictos entre sliders
- ✅ **Block Injector** (block_injector.py)
  - Inyección de bloques semánticos por pilar
  - Traducción automática de valores 0-10 a instrucciones
  - Fallback mappings si BD no disponible
- ✅ **Semantic Sanitizer** (semantic_sanitizer.py)
  - Eliminación de redundancias
  - Limpieza de secciones vacías
  - Validación de prompt
- ✅ **Identity Lock Service** (identity_lock.py)
  - Identity Lock dinámico según contexto
  - Niveles: NONE, RELAXED, STANDARD, MAXIMUM
  - Soporte para DNA Anchor
- ✅ **DNA Anchor Generator** (dna_anchor_generator.py)
  - Detección facial con face_recognition/OpenCV
  - Crop facial 256x256 con margen 20%
  - Anchor strength: weak/medium/strong/absolute
- ✅ **Multimodal Prompt Injector** (multimodal_prompt_injector.py)
  - Construcción de contenido multimodal
  - Inyección de DNA Anchor como segunda imagen
  - Instrucciones biométricas
- ✅ **Context Cache Manager** (context_cache_manager.py)
  - Estructura para Vertex AI caching
  - Cache por usuario con TTL
  - Estimación de tokens ahorrados
- ✅ **Prompt Compiler Service v28.0** (prompt_compiler_service.py)
  - Orquestación completa de todas las fases
  - Debug info detallado con vetos, sanitization
  - Soporte DNA Anchor multimodal
- ✅ **Documento Maestro actualizado** (/app/BBLA/maestro arqu.md)
  - FASE 4: El Cerebro añadida
  - FASE 5: El Alma añadida
  - Ejemplos de código Python

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
