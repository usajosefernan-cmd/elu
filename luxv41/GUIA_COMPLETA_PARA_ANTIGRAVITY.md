# 📘 LUXSCALER v41 - GUÍA COMPLETA PARA MIGRACIÓN/ADAPTACIÓN

## 🎯 PROPÓSITO DE ESTE DOCUMENTO

Este documento explica TODA la implementación de LuxScaler v41 para que puedas:
1. Entender cómo funciona cada parte
2. Adaptar el código a tu estructura de Supabase y frontend
3. Implementar el sistema paso a paso
4. Troubleshoot problemas

---

## 📊 ARQUITECTURA GENERAL

### Diagrama de Alto Nivel:

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React/Vite)                   │
│  /app/frontend/src/                                         │
│  ├── components/                                            │
│  │   ├── SimplePillarControl.tsx (USER - 3 macros)         │
│  │   ├── MacroSliderGallery.tsx (PRO - 9 macros)           │
│  │   ├── MicroSliderGrid.tsx (PRO_LUX - 27 sliders)        │
│  │   ├── SavePresetModal.tsx (Smart Anchors)               │
│  │   └── UserSettings.tsx (Configuración completa)         │
│  ├── utils/                                                 │
│  │   └── biopsyEngine.ts (4 crops de imagen)               │
│  ├── services/                                              │
│  │   ├── v41Service.ts (API calls)                         │
│  │   └── historyService.ts (Archives v41)                  │
│  └── hooks/                                                 │
│      └── useV41Upload.ts (Flujo completo)                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI Python)                  │
│  /app/backend/                                              │
│  ├── routes/                                                │
│  │   ├── v41_routes.py (6 endpoints)                       │
│  │   └── slider_definitions_v41.py (1 endpoint)            │
│  ├── services/                                              │
│  │   ├── vision_orchestrator_v41.py (Clasificación)        │
│  │   ├── prompt_compiler_v41.py (Ensamblaje)               │
│  │   ├── laozhang_service.py (LaoZhang API)                │
│  │   └── supabase_service.py (DB client)                   │
│  └── migrations/                                            │
│      ├── v41_01_create_tables.sql                          │
│      └── v41_02_rls_policies.sql                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE PostgreSQL                      │
│  11 tablas:                                                 │
│  ├── tier_config (4 filas)                                 │
│  ├── taxonomy_definitions (21 filas)                       │
│  ├── diagnosis_definitions (10 filas)                      │
│  ├── slider_definitions (27 filas)                         │
│  ├── macro_definitions (12 filas)                          │
│  ├── profiles (runtime)                                    │
│  ├── uploads (runtime)                                     │
│  ├── analysis_results (runtime)                            │
│  ├── generations (runtime)                                 │
│  ├── user_presets_v41 (runtime)                            │
│  └── user_upload_workflows (runtime)                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    LAOZHANG API                             │
│  Nano Banana Pro (gemini-3-pro-image-preview)              │
│  - 4K resolution                                            │
│  - $0.05/edit                                               │
│  - Multi-imagen support                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ PARTE 1: BASE DE DATOS (SUPABASE)

### 1.1 TABLAS DE DEFINICIONES (Read-Only - 74 filas)

Estas tablas contienen la CONFIGURACIÓN del sistema. Son como un "diccionario" que el backend consulta.

#### A. `tier_config` (4 filas)

**Propósito:** Define los 4 planes de suscripción

**Schema:**
```sql
CREATE TABLE tier_config (
    id SERIAL PRIMARY KEY,
    tier_name TEXT UNIQUE NOT NULL,           -- 'AUTO', 'USER', 'PRO', 'PRO_LUX'
    tier_code TEXT UNIQUE NOT NULL,
    preview_tokens_monthly INT DEFAULT 0,     -- Tokens gratis al mes
    refine_tokens_each INT DEFAULT 0,         -- Costo de refinar
    unlock_tokens_each INT DEFAULT 0,         -- Costo de unlock
    upscale_8k_cost_tokens INT DEFAULT 0,     -- Costo de upscale 8K
    can_refine BOOLEAN DEFAULT false,         -- ¿Puede usar refine?
    can_upscale_8k BOOLEAN DEFAULT false,     -- ¿Puede upscale 8K?
    batch_size_limit INT DEFAULT 1,           -- Máximo de previews
    cost_unlock_usd DECIMAL(5, 2) DEFAULT 0,
    cost_8k_usd DECIMAL(5, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Datos:**
```sql
INSERT INTO tier_config VALUES
('AUTO', 'AUTO', 100, 0, 0, 0, false, false, 1, 0.00, 0.00),
('USER', 'USER', 0, 5, 20, 0, false, false, 1, 2.99, 0.00),
('PRO', 'PRO', 0, 3, 15, 50, true, false, 6, 1.99, 9.99),
('PRO_LUX', 'PRO_LUX', 0, 2, 12, 30, true, true, 12, 0.99, 4.99);
```

**Dónde se usa:**
- Backend: `vision_orchestrator_v41.py` → Para saber batch_size_limit
- Frontend: `UserSettings.tsx` → Para mostrar capacidades del tier

---

#### B. `taxonomy_definitions` (21 filas)

**Propósito:** Clasifica tipos de imágenes (selfies, retratos, productos, etc.)

**Schema:**
```sql
CREATE TABLE taxonomy_definitions (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,              -- 'CAT01', 'CAT02', ..., 'CAT21'
    category_name TEXT NOT NULL,            -- 'SELFIE_CASUAL', 'PRO_HEADSHOT', etc.
    category_group TEXT NOT NULL,           -- 'SERES VIVOS', 'RÍGIDOS', 'PRODUCTOS', 'DOCUMENTAL'
    visual_description TEXT NOT NULL,       -- Para que Gemini Vision entienda
    strategy TEXT NOT NULL,                 -- Estrategia de procesamiento
    slider_config JSONB DEFAULT '{}'::jsonb, -- Auto-config de sliders
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Ejemplo de fila:**
```json
{
  "code": "CAT01",
  "category_name": "SELFIE_CASUAL",
  "category_group": "SERES VIVOS",
  "visual_description": "Selfie con nariz grande, distorsión de gran angular",
  "strategy": "VIRTUAL 50MM LENS. Flatten nasal distortion.",
  "slider_config": {"s1": "FORCE", "p2": "FORCE", "l1": "HIGH"}
}
```

**Dónde se usa:**
- Backend: `vision_orchestrator_v41.py` → Construye contexto para Gemini
- Backend: `vision_orchestrator_v41.py` → Aplica slider_config automáticamente

**Cómo funciona:**
1. Gemini Vision analiza la imagen
2. Retorna un código: "CAT01"
3. Backend busca en taxonomy_definitions WHERE code = 'CAT01'
4. Obtiene slider_config: `{"s1": "FORCE", "p2": "FORCE"}`
5. Esos sliders se aplican automáticamente

---

#### C. `diagnosis_definitions` (10 filas)

**Propósito:** Detecta DEFECTOS en las imágenes (blur, noise, compression, etc.)

**Schema:**
```sql
CREATE TABLE diagnosis_definitions (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,              -- 'IN02', 'IN03', ..., 'IN11'
    diagnosis_name TEXT NOT NULL,           -- 'MOBILE_PROCESSED', 'SOFT_FOCUS', etc.
    visual_description TEXT NOT NULL,       -- Características del defecto
    strategy TEXT NOT NULL,                 -- Cómo solucionarlo
    slider_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Ejemplo de fila:**
```json
{
  "code": "IN03",
  "diagnosis_name": "SOFT_FOCUS",
  "visual_description": "Focal plane missed subject (ears sharp, eyes soft)",
  "strategy": "DEFINITION RE-SYNTHESIS. Hallucinate missing definition.",
  "slider_config": {"p3": "FORCE", "p6": "HIGH", "l1": "FORCE"}
}
```

**Dónde se usa:**
- Backend: `vision_orchestrator_v41.py` → Gemini detecta defectos
- Backend: Motor de mezcla → Aplica slider_config de cada defecto detectado

**Motor de Mezcla:**
```python
# Si la imagen es CAT01 + tiene defectos IN02 e IN03:
final_sliders = {}

# 1. Aplicar config de CAT01
final_sliders.update(taxonomy['CAT01'].slider_config)
# Resultado: {"s1": "FORCE", "p2": "FORCE", "l1": "HIGH"}

# 2. Aplicar config de IN02
final_sliders.update(diagnosis['IN02'].slider_config)
# Se mezcla: {"s1": "FORCE", "p2": "FORCE", "l1": "HIGH", "p6": "HIGH", "p3": "HIGH"}

# 3. Aplicar config de IN03
final_sliders.update(diagnosis['IN03'].slider_config)
# Final: {"s1": "FORCE", "p2": "FORCE", "l1": "FORCE", "p3": "FORCE", "p6": "HIGH"}
# (Nota: l1 cambió de HIGH a FORCE porque IN03 tiene prioridad)
```

---

#### D. `slider_definitions` (27 filas)

**Propósito:** Define CADA UNO de los 27 sliders con sus 5 niveles de intensidad

**Schema:**
```sql
CREATE TABLE slider_definitions (
    id SERIAL PRIMARY KEY,
    slider_key TEXT UNIQUE NOT NULL,        -- 'p1', 'p2', ..., 's1', ..., 'l1', ...
    pillar TEXT NOT NULL,                   -- 'PHOTOSCALER', 'STYLESCALER', 'LIGHTSCALER'
    ui_title TEXT NOT NULL,                 -- 'Limpieza de Señal'
    ui_description TEXT NOT NULL,           -- Descripción larga
    instruction_off TEXT,                   -- Nivel 0: OFF
    instruction_low TEXT,                   -- Nivel 1-3: LOW
    instruction_med TEXT,                   -- Nivel 4-6: MED
    instruction_high TEXT,                  -- Nivel 7-9: HIGH
    instruction_force TEXT,                 -- Nivel 10: FORCE
    auto_default INT DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Ejemplo de fila (p1 - Limpieza de Señal):**
```json
{
  "slider_key": "p1",
  "pillar": "PHOTOSCALER",
  "ui_title": "Limpieza de Señal",
  "ui_description": "Gestiona el ruido y la pureza de la imagen...",
  "instruction_off": "PRESERVE PATINA. Treat sensor noise as essential texture.",
  "instruction_low": "CHROMA DENOISE. Remove only color noise.",
  "instruction_med": "SIGNAL POLISH. Clean smooth surfaces.",
  "instruction_high": "COMMERCIAL CLEANUP. High-end editorial denoising.",
  "instruction_force": "PRISTINE SIGNAL. ZERO ARTIFACTS. PERFECT SENSOR."
}
```

**Total:** 27 sliders × 5 niveles = 135 instrucciones únicas

**Dónde se usa:**
- Backend: `prompt_compiler_v41.py` → Lee estas instrucciones
- Frontend: `MicroSliderGrid.tsx` → Muestra ui_title y ui_description
- Frontend: Endpoint `/api/slider-definitions` → Obtiene todas las definiciones

**Cómo funciona el Prompt Compiler:**
```python
# Usuario ajusta: p1 = 9 (HIGH)

# 1. Backend consulta:
SELECT * FROM slider_definitions 
WHERE slider_key = 'p1';

# 2. Determina nivel:
# 9 está entre 7-9 → Nivel = HIGH

# 3. Obtiene instrucción:
instruction = row['instruction_high']
# "COMMERCIAL CLEANUP. High-end editorial denoising."

# 4. Añade al prompt:
prompt += f"- [P1 - HIGH] {instruction}"
```

---

#### E. `macro_definitions` (12 filas)

**Propósito:** Define MACROS que controlan múltiples sliders

**Schema:**
```sql
CREATE TABLE macro_definitions (
    id SERIAL PRIMARY KEY,
    macro_key TEXT UNIQUE NOT NULL,         -- 'restauracion', 'fidelidad', etc.
    profile_tier TEXT NOT NULL,             -- 'USER' o 'PRO'
    pillar TEXT,                            -- 'PHOTOSCALER', 'STYLESCALER', 'LIGHTSCALER'
    ui_title TEXT NOT NULL,
    ui_icon TEXT,                           -- Emoji o ícono
    slave_sliders TEXT[] NOT NULL,          -- Array de sliders que controla
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Ejemplo (Macro PRO - Restauración):**
```json
{
  "macro_key": "restauracion",
  "profile_tier": "PRO",
  "pillar": "PHOTOSCALER",
  "ui_title": "Restauración",
  "ui_icon": "🛠️",
  "slave_sliders": ["p1", "p2", "p8", "p9"]
}
```

**Dónde se usa:**
- Frontend: `MacroSliderGallery.tsx` (PRO) → Muestra 9 macros
- Frontend: `SimplePillarControl.tsx` (USER) → Usa 3 macros
- Backend: Endpoint `/api/v41/macro-definitions/{tier}`

**Cómo funciona:**
```javascript
// Usuario PRO mueve macro "restauracion" a valor 7

// Frontend traduce:
const slave_sliders = ['p1', 'p2', 'p8', 'p9'];
const sliderConfig = {};

slave_sliders.forEach(key => {
  sliderConfig[key] = 7;  // Todos reciben el valor del macro
});

// Resultado:
// {p1: 7, p2: 7, p8: 7, p9: 7}

// Envía al backend para compilar prompt
```

**Macros USER (3 macros, cada uno controla 9 sliders):**
```json
[
  {"macro_key": "calidad_imagen", "slave_sliders": ["p1"-"p9"]},
  {"macro_key": "estetica_ia", "slave_sliders": ["s1"-"s9"]},
  {"macro_key": "iluminacion_pro", "slave_sliders": ["l1"-"l9"]}
]
```

**Macros PRO (9 macros, cada uno controla 3-4 sliders):**
```json
// PHOTOSCALER:
{"restauracion": ["p1", "p2", "p8", "p9"]},
{"fidelidad": ["p3", "p4", "p6"]},
{"caracter": ["p5", "p7"]},

// STYLESCALER:
{"presencia": ["s1", "s2", "s3"]},
{"pulido": ["s4", "s5", "s6"]},
{"cinematica": ["s7", "s8", "s9"]},

// LIGHTSCALER:
{"volumen": ["l1", "l2", "l3"]},
{"drama": ["l4", "l5", "l6"]},
{"atmosfera": ["l7", "l8", "l9"]}
```

---

### 1.2 TABLAS OPERATIVAS (Runtime - se llenan en uso)

#### F. `profiles`

**Propósito:** Perfil del usuario (tier actual, balance de tokens)

**Schema:**
```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    tier TEXT DEFAULT 'AUTO',               -- Tier actual del usuario
    token_balance INT DEFAULT 100,          -- Tokens disponibles
    monthly_limit INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Cuándo se crea:**
- Al hacer login por primera vez
- O al abrir UserSettings

**Dónde se usa:**
- Backend: Para verificar tier del usuario
- Frontend: Para mostrar balance de tokens

---

#### G. `uploads`

**Propósito:** Registro de cada imagen subida

**Schema:**
```sql
CREATE TABLE uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    original_width INT,
    original_height INT,
    thumbnail_url TEXT,
    biopsy_urls JSONB,                      -- Los 4 crops (thumbnail, center, shadow, detail)
    status TEXT DEFAULT 'biopsy_ready',     -- 'analyzing', 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Ejemplo de biopsy_urls:**
```json
{
  "thumbnail_base64": "iVBORw0KGgoAAAA...",
  "center_base64": "iVBORw0KGgoAAAA...",
  "shadow_base64": "iVBORw0KGgoAAAA...",
  "detail_base64": "iVBORw0KGgoAAAA...",
  "originalWidth": 4000,
  "originalHeight": 3000
}
```

**Flujo:**
1. Usuario sube imagen en frontend
2. `biopsyEngine.ts` genera 4 crops
3. Frontend → `POST /api/v41/vision-orchestrator`
4. Backend crea registro en `uploads`

---

#### H. `analysis_results`

**Propósito:** Resultados del análisis de Gemini Vision

**Schema:**
```sql
CREATE TABLE analysis_results (
    upload_id UUID PRIMARY KEY REFERENCES uploads(id),
    cat_code TEXT,                          -- 'CAT01', 'CAT02', etc.
    detected_defects TEXT[] DEFAULT '{}',   -- ['IN02', 'IN03']
    ocr_data JSONB,
    visual_summary TEXT,
    severity_score INT DEFAULT 5,           -- 1-10
    auto_settings JSONB DEFAULT '{}'::jsonb, -- Sliders automáticos mezclados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Ejemplo:**
```json
{
  "upload_id": "uuid-123",
  "cat_code": "CAT02",
  "detected_defects": ["IN02", "IN03"],
  "visual_summary": "Professional headshot with mobile artifacts",
  "severity_score": 6,
  "auto_settings": {"p1": 7, "p3": 10, "p6": 8, "s1": 5}
}
```

**Dónde se guarda:**
- Backend: `vision_orchestrator_v41.py` línea ~156

---

#### I. `generations`

**Propósito:** Imágenes generadas por LaoZhang

**Schema:**
```sql
CREATE TABLE generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id UUID REFERENCES uploads(id),
    prompt_used TEXT,                       -- El prompt compilado
    config_used JSONB,                      -- {seed, temperature, variant, preset_id}
    clean_url TEXT,                         -- Imagen sin watermark
    watermarked_url TEXT,                   -- Imagen con watermark (preview)
    final_url TEXT,                         -- Imagen final después de unlock
    is_preview BOOLEAN DEFAULT true,
    tokens_spent INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Ejemplo:**
```json
{
  "upload_id": "uuid-123",
  "prompt_used": "You are LuxScaler... [RECONSTRUCTION DIRECTIVES]...",
  "config_used": {"seed": 12345, "temperature": 0.8, "variant": "CREATIVE"},
  "watermarked_url": "iVBORw0KGgoAAAA..." (base64),
  "is_preview": true,
  "tokens_spent": 0
}
```

**Dónde se guarda:**
- Backend: `v41_routes.py` → Endpoint `/generate` línea ~155

---

#### J. `user_presets_v41`

**Propósito:** Presets guardados con Smart Anchors

**Schema:**
```sql
CREATE TABLE user_presets_v41 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    description TEXT,
    sliders_config JSONB,                   -- {p1: 5, p3: 9, s1: 7, ...}
    nano_params JSONB,                      -- {strength: 0.85, guidance_scale: 4.0, seed: 123}
    anchor_preferences JSONB,               -- {background: true, lighting: true, ...}
    reference_image_url TEXT,               -- URL de imagen de referencia (para multi-imagen)
    prompt_text TEXT,
    thumbnail_base64 TEXT,
    is_global BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Ejemplo completo:**
```json
{
  "name": "Restaurante Lujoso",
  "description": "Iluminación dramática para interiores",
  "sliders_config": {"p1": 5, "p3": 9, "s1": 7, "s5": 10, "l1": 9},
  "nano_params": {
    "strength": 0.85,
    "guidance_scale": 4.0,
    "seed": 847291,
    "temperature": 0.75
  },
  "anchor_preferences": {
    "background": true,   // ✅ Anclar ambiente
    "lighting": true,     // ✅ Anclar iluminación
    "clothes": false,     // ❌ No anclar ropa
    "pose": false,        // ❌ No anclar pose
    "style": false
  },
  "reference_image_url": "data:image/jpeg;base64,..."
}
```

**Dónde se guarda:**
- Backend: Endpoint `/api/v41/save-preset`

**Dónde se usa:**
- Backend: Endpoint `/api/v41/generate` → Lee anchor_preferences y reference_image
- Frontend: `SavePresetModal.tsx` → UI para seleccionar anchors

---

#### K. `user_upload_workflows`

**Propósito:** Configuración de "Shoot, Pocket, Review" (procesamiento automático)

**Schema:**
```sql
CREATE TABLE user_upload_workflows (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    is_async_enabled BOOLEAN DEFAULT true,  -- Modo "Pocket" ON/OFF
    max_previews INT DEFAULT 3,             -- Cuántas variantes generar (1-6)
    batch_config JSONB,                     -- Configuración de cada preview
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Ejemplo de batch_config:**
```json
[
  {"type": "AUTO", "variant": "FORENSIC"},      // Preview 1: Limpia
  {"type": "AUTO", "variant": "CREATIVE"},      // Preview 2: Creativa
  {"type": "PRESET", "preset_id": "uuid-123"}   // Preview 3: Tu preset favorito
]
```

**Dónde se configura:**
- Frontend: `UserSettings.tsx` → Usuario configura sus slots

**Dónde se usa:**
- Backend: `vision_orchestrator_v41.py` → Método `execute_batch_processing()`

**Cómo funciona:**
```python
# Usuario sube foto

# 1. Backend lee workflow:
workflow = db.table('user_upload_workflows').get(user_id)

# 2. Obtiene config:
batch_config = workflow['batch_config']
max_previews = workflow['max_previews']

# 3. Para cada slot (con delay de 1.5s):
for item in batch_config[:max_previews]:
    if item['type'] == 'AUTO':
        if item['variant'] == 'FORENSIC':
            temp = 0.1
            seed = 42
        elif item['variant'] == 'CREATIVE':
            temp = 0.8
            seed = random()
    
    elif item['type'] == 'PRESET':
        preset = load_preset(item['preset_id'])
        temp = preset.nano_params.strength
        seed = preset.nano_params.seed
    
    # Genera imagen
    generate(prompt, image, temp, seed)
    
    # HEARTBEAT DELAY (Smart Staggering)
    await sleep(1.5)
```

---

## 🔌 PARTE 2: BACKEND (FastAPI)

### 2.1 ESTRUCTURA DE ARCHIVOS

```
/app/backend/
├── routes/
│   ├── v41_routes.py (6 endpoints principales)
│   └── slider_definitions_v41.py (1 endpoint)
├── services/
│   ├── vision_orchestrator_v41.py
│   ├── prompt_compiler_v41.py
│   ├── laozhang_service.py
│   └── supabase_service.py (ya existente)
└── migrations/
    ├── v41_01_create_tables.sql
    └── v41_02_rls_policies.sql
```

---

### 2.2 ENDPOINTS (7 total)

#### Endpoint 1: POST /api/v41/vision-orchestrator

**Archivo:** `/app/backend/routes/v41_routes.py` líneas 11-75

**Propósito:** Analiza imagen y clasifica

**Request:**
```json
{
  "userId": "uuid",
  "biopsyUrls": {
    "thumbnail_base64": "...",
    "center_base64": "...",
    "shadow_base64": "...",
    "detail_base64": "...",
    "originalWidth": 4000,
    "originalHeight": 3000
  }
}
```

**Flujo interno:**
```python
1. Crea registro en uploads
2. Obtiene tier del usuario (profiles table)
3. Obtiene tier_config
4. Llama vision_orchestrator.orchestrate_vision_analysis()
   ├─ Carga taxonomy_definitions (21 categorías)
   ├─ Carga diagnosis_definitions (10 defectos)
   ├─ Construye prompt para Gemini Vision
   ├─ Llama Gemini Vision API
   ├─ Gemini retorna: {cat_code: "CAT02", detected_defects: ["IN02"]}
   ├─ Mezcla slider_config de CAT02 + IN02
   └─ Guarda en analysis_results
5. Si tier = AUTO:
   ├─ Ejecuta batch processing
   └─ Retorna "BATCH_PROCESSING"
6. Si tier = USER/PRO/PRO_LUX:
   └─ Retorna "REVIEW_REQUIRED" con auto_settings
```

**Response (AUTO):**
```json
{
  "status": "BATCH_PROCESSING",
  "uploadId": "uuid",
  "count": 2,
  "analysis": {...},
  "message": "Generations queued. You can close the app."
}
```

**Response (USER/PRO):**
```json
{
  "status": "REVIEW_REQUIRED",
  "uploadId": "uuid",
  "analysis": {...},
  "final_prescription": {"p1": 7, "p3": 10},
  "tier": "USER",
  "can_refine": false,
  "can_upscale_8k": false,
  "token_balance": 100
}
```

---

#### Endpoint 2: POST /api/v41/prompt-compiler

**Archivo:** `/app/backend/routes/v41_routes.py` líneas 78-115

**Propósito:** Ensambla prompt desde slider_definitions

**Request:**
```json
{
  "visionResult": {...},
  "sliderConfig": {"p1": 5, "p3": 9, "s1": 7},
  "savedPreset": {"seed": 123, "temperature": 0.4}
}
```

**Flujo interno:**
```python
1. Llama prompt_compiler_v41.compile_from_sliders()
2. Para cada slider en sliderConfig:
   ├─ Consulta slider_definitions WHERE slider_key = 'p1'
   ├─ Determina nivel: 5 → MED
   ├─ Obtiene instruction_med
   └─ Añade a lista de instrucciones
3. Agrupa por pilar:
   ├─ PHOTOSCALER operations
   ├─ STYLESCALER operations
   └─ LIGHTSCALER operations
4. Si hay rostro → Añade BIOMETRIC LOCK
5. Ensambla prompt final
```

**Response:**
```json
{
  "success": true,
  "compiled_prompt": "You are LuxScaler... [instrucciones]...",
  "generation_config": {
    "seed": 123,
    "temperature": 0.4,
    "top_k": 40,
    "top_p": 0.9
  },
  "metadata": {
    "photoscaler_count": 2,
    "stylescaler_count": 1,
    "lightscaler_count": 1
  }
}
```

---

#### Endpoint 3: POST /api/v41/generate

**Archivo:** `/app/backend/routes/v41_routes.py` líneas 118-175

**Propósito:** Genera imagen con LaoZhang Nano Banana Pro

**Request:**
```json
{
  "uploadId": "uuid",
  "prompt": "...",
  "config": {"temperature": 0.4, "seed": 123},
  "imageBase64": "...",
  "preset": {
    "id": "uuid",
    "reference_image_url": "data:image/...",
    "anchor_preferences": {"background": true, "lighting": true},
    "nano_params": {"strength": 0.85, "guidance_scale": 4.0}
  }
}
```

**Flujo con Smart Anchors:**
```python
1. Si hay preset con anchor_preferences:
   ├─ Lee anchor_preferences: {background: true, lighting: true}
   ├─ Inyecta en prompt:
   │   "[SMART ANCHOR: BACKGROUND] Preserve environment from reference."
   │   "[SMART ANCHOR: LIGHTING] Match lighting from reference."
   ├─ Extrae reference_image_url del preset
   └─ Añade a reference_images para multi-imagen
   
2. Llama laozhang_service.generate_with_nano_banana_pro()
   ├─ Endpoint: https://api.laozhang.ai/v1beta/models/gemini-3-pro-image-preview:generateContent
   ├─ Payload:
   │   {
   │     "contents": [{
   │       "parts": [
   │         {"text": prompt},
   │         {"inline_data": {"data": imagen_usuario_base64}},
   │         {"inline_data": {"data": reference_image_base64}}  // Si hay anchor
   │       ]
   │     }],
   │     "generationConfig": {
   │       "responseModalities": ["IMAGE"],
   │       "imageConfig": {"imageSize": "4K"}
   │     }
   │   }
   └─ LaoZhang retorna imagen 4K en base64

3. Guarda en generations table
```

**Response:**
```json
{
  "success": true,
  "image_base64": "...",
  "upload_id": "uuid",
  "generation_id": "uuid"
}
```

---

#### Endpoint 4: POST /api/v41/save-preset

**Archivo:** `/app/backend/routes/v41_routes.py` líneas 178-268

**Propósito:** Guarda preset con Smart Anchors

**Request:**
```json
{
  "userId": "uuid",
  "uploadId": "uuid",
  "presetName": "Restaurante Lujoso",
  "description": "Iluminación dramática",
  "userAnchors": {
    "background": true,
    "lighting": true,
    "clothes": false,
    "pose": false
  },
  "currentSliders": {"p1": 5, "s5": 10, "l1": 9},
  "thumbnailBase64": "..."
}
```

**Flujo - Detector Automático:**
```python
# 1. Analiza sliders creativos
creative_triggers = [
    currentSliders['s3'],  # Ropa
    currentSliders['s5'],  # Fondo
    currentSliders['s8'],  # Color
    currentSliders['l1']   # Luz
]

# 2. Detecta modo
is_creative = any(val > 5 for val in creative_triggers)

# 3. Genera nano_params automáticamente
if is_creative:
    nano_params = {
        'strength': 0.85,        # Alta creatividad
        'guidance_scale': 4.0,   # IA libre
        'temperature': 0.75,
        'seed': seed
    }
else:
    nano_params = {
        'strength': 0.45,        # Restauración fiel
        'guidance_scale': 7.5,   # IA obediente
        'temperature': 0.1,
        'seed': seed
    }

# 4. Si hay anchors, guarda reference_image
if userAnchors['background'] or userAnchors['lighting']:
    # Recupera imagen generada
    gen = db.table('generations').get(uploadId)
    reference_url = gen['watermarked_url']

# 5. Guarda en user_presets_v41
```

---

#### Endpoint 5: GET /api/v41/presets/{userId}

**Archivo:** `/app/backend/routes/v41_routes.py` líneas 271-284

**Propósito:** Obtiene presets del usuario

**Response:**
```json
{
  "success": true,
  "presets": [
    {
      "id": "uuid",
      "name": "Restaurante Lujoso",
      "description": "...",
      "sliders_config": {...},
      "nano_params": {...},
      "anchor_preferences": {...},
      "reference_image_url": "...",
      "thumbnail_base64": "..."
    }
  ]
}
```

---

#### Endpoint 6: GET /api/v41/macro-definitions/{profile_tier}

**Archivo:** `/app/backend/routes/v41_routes.py` líneas 287-301

**Propósito:** Obtiene macros para USER o PRO

**Response:**
```json
{
  "success": true,
  "macros": [
    {
      "macro_key": "restauracion",
      "profile_tier": "PRO",
      "ui_title": "Restauración",
      "ui_icon": "🛠️",
      "slave_sliders": ["p1", "p2", "p8", "p9"]
    }
  ]
}
```

---

#### Endpoint 7: GET /api/slider-definitions

**Archivo:** `/app/backend/routes/slider_definitions_v41.py`

**Propósito:** Obtiene todas las definiciones de sliders

**Response:**
```json
{
  "success": true,
  "definitions": [
    {
      "slider_key": "p1",
      "pillar": "PHOTOSCALER",
      "ui_title": "Limpieza de Señal",
      "ui_description": "...",
      "instruction_off": "...",
      "instruction_low": "...",
      "instruction_med": "...",
      "instruction_high": "...",
      "instruction_force": "..."
    }
  ]
}
```

---

## 🎨 PARTE 3: FRONTEND (React)

### 3.1 COMPONENTES PRINCIPALES

#### A. BiopsyEngine (`/app/frontend/src/utils/biopsyEngine.ts`)

**Propósito:** Genera 4 crops de la imagen original

**Por qué:** En vez de subir 50MB, sube 300KB (4 crops)

**Algoritmo:**
```typescript
export async function generateBiopsyPayload(file: File): Promise<BiopsyPayload> {
  // 1. THUMBNAIL (1024px)
  // Propósito: Contexto completo para Gemini Vision
  const thumbCanvas = new OffscreenCanvas(1024, ...);
  thumbCanvas.drawImage(bitmap, 0, 0, 1024, ...);
  const thumbnail_base64 = await blobToBase64(thumbBlob);
  
  // 2. CENTER CROP (512x512)
  // Propósito: Zona central (normalmente la más importante)
  const centerX = width / 2 - 256;
  const centerY = height / 2 - 256;
  const center_base64 = await cropAt(bitmap, centerX, centerY, 512);
  
  // 3. SHADOW CROP (512x512)
  // Propósito: Región más OSCURA (prueba de recuperación de sombras)
  const shadowCoords = await findDarkestRegion(bitmap, 512);
  // Algoritmo: Barrer imagen en bloques, calcular luminancia promedio
  const shadow_base64 = await cropAt(bitmap, shadowCoords.x, shadowCoords.y, 512);
  
  // 4. DETAIL CROP (512x512)  
  // Propósito: Región de mayor ENTROPÍA (más textura/detalle)
  const detailCoords = await findHighEntropyRegion(bitmap, 512);
  // Algoritmo: Barrer imagen, calcular entropía Shannon por bloque
  const detail_base64 = await cropAt(bitmap, detailCoords.x, detailCoords.y, 512);
  
  return { thumbnail_base64, center_base64, shadow_base64, detail_base64 };
}
```

**Dónde se usa:**
- Frontend: `useV41Upload.ts` → Hook que llama biopsyEngine
- Frontend: `v41Service.ts` → fullGenerationFlow()

---

#### B. SavePresetModal (`/app/frontend/src/components/SavePresetModal.tsx`)

**Propósito:** UI para guardar presets con Smart Anchors

**UI:**
```
┌────────────────────────────────────┐
│ 💾 Guardar Receta Visual          │
├────────────────────────────────────┤
│ [Imagen preview]                   │
│                                    │
│ Nombre: [Restaurante Lujoso]      │
│ Descripción: [...]                 │
│                                    │
│ ¿Qué anclar?                       │
│ [✓] Ambiente / Fondo              │
│ [✓] Iluminación                    │
│ [ ] Ropa                           │
│ [ ] Pose                           │
│                                    │
│ [Cancelar] [Guardar Preset]        │
└────────────────────────────────────┘
```

**Props:**
```typescript
interface SavePresetModalProps {
  isVisible: boolean;
  uploadId: string;
  userId: string;
  currentSliders: Record<string, number>;
  generatedImageBase64?: string;
  onSave: (presetData: any) => Promise<void>;
  onCancel: () => void;
}
```

**Dónde se usa:**
- Después de generar una imagen exitosa
- Usuario hace click en "Guardar Preset"

---

#### C. SimplePillarControl (`/app/frontend/src/components/SimplePillarControl.tsx`)

**Propósito:** UI para perfil USER (3 sliders macro)

**UI:**
```
┌────────────────────────────────────┐
│ Ajusta los 3 Pilares Principales   │
├────────────────────────────────────┤
│ 💎 Calidad Imagen                 │
│ [━━━━━●━━━━] 5                     │
│                                    │
│ ✨ Estética IA                     │
│ [━━━━━━━●━━] 7                     │
│                                    │
│ 💡 Iluminación Pro                 │
│ [━━━━━━━━●━] 8                     │
│                                    │
│ [Generar Imagen]                   │
└────────────────────────────────────┘
```

**Lógica de traducción:**
```typescript
// Usuario mueve "Calidad Imagen" a 7

// Se traduce a 9 sliders:
const sliderConfig = {
  p1: 7, p2: 7, p3: 7, p4: 7, p5: 7,
  p6: 7, p7: 7, p8: 7, p9: 7
};

// Envía al backend
```

---

#### D. MacroSliderGallery (`/app/frontend/src/components/MacroSliderGallery.tsx`)

**Propósito:** UI para perfil PRO (9 macros temáticos)

**UI:**
```
┌────────────────────────────────────┐
│ Mesa de Mezclas Pro                │
├────────────────────────────────────┤
│ PHOTOSCALER                        │
│ [Restauración] [Fidelidad] [...]   │
│                                    │
│ STYLESCALER                        │
│ [Presencia] [Pulido] [Cinemática]  │
│                                    │
│ LIGHTSCALER                        │
│ [Volumen] [Drama] [Atmósfera]      │
│                                    │
│ [Generar Imagen]                   │
└────────────────────────────────────┘
```

**Lógica:**
```typescript
// Usuario mueve "Restauración" (PRO) a 8

// macro_definitions dice que "restauracion" controla: ['p1', 'p2', 'p8', 'p9']

// Se traduce:
const sliderConfig = {
  p1: 8,
  p2: 8,
  p8: 8,
  p9: 8
};
```

---

#### E. MicroSliderGrid (`/app/frontend/src/components/MicroSliderGrid.tsx`)

**Propósito:** UI para perfil PRO_LUX (27 sliders individuales)

**UI:**
```
┌────────────────────────────────────┐
│ Ingeniería Forense: 27 Sliders     │
├────────────────────────────────────┤
│ PHOTOSCALER                        │
│ [p1] [p2] [p3]                     │
│ [p4] [p5] [p6]                     │
│ [p7] [p8] [p9]                     │
│                                    │
│ STYLESCALER                        │
│ [s1] [s2] [s3]                     │
│ ...                                │
│                                    │
│ LIGHTSCALER                        │
│ [l1] [l2] [l3]                     │
│ ...                                │
│                                    │
│ [Generar Imagen]                   │
└────────────────────────────────────┘
```

**Lógica:**
```typescript
// Control directo, sin traducción
const sliderConfig = {
  p1: 5,
  p2: 7,
  p3: 9,
  // ... 27 sliders independientes
};
```

---

#### F. UserSettings (`/app/frontend/src/components/UserSettings.tsx`)

**Propósito:** Configuración completa del usuario

**Secciones:**

**1. Tier Selection:**
```
┌────────────────────────────────────┐
│ [AUTO] [USER] [PRO] [PRO_LUX]      │
└────────────────────────────────────┘
```

**2. Token Balance:**
```
┌────────────────────────────────────┐
│ Balance: 100 tokens                │
│ [Comprar Tokens]                   │
└────────────────────────────────────┘
```

**3. Pocket Mode:**
```
┌────────────────────────────────────┐
│ Modo Pocket [✓ ON]                 │
│ Máximo de Previews: 3 [━━●━━━]     │
│                                    │
│ Slot 1: [Auto ▼] [Forense ▼]      │
│ Slot 2: [Auto ▼] [Creativo ▼]     │
│ Slot 3: [Preset ▼] [Mi Boda ▼]    │
└────────────────────────────────────┘
```

**4. Mis Presets:**
```
Muestra grid de presets guardados con thumbnails
```

**Dónde guarda:**
- `profiles` table → tier
- `user_upload_workflows` table → batch_config, max_previews

---

### 3.2 SERVICES

#### `/app/frontend/src/services/v41Service.ts`

**Funciones principales:**

```typescript
// 1. Analizar imagen
export const analyzeImage = async (userId, biopsyPayload) => {
  return await fetch('/api/v41/vision-orchestrator', {
    method: 'POST',
    body: JSON.stringify({ userId, biopsyUrls: biopsyPayload })
  });
};

// 2. Compilar prompt
export const compilePrompt = async (visionResult, sliderConfig, preset) => {
  return await fetch('/api/v41/prompt-compiler', { ... });
};

// 3. Generar imagen
export const generateImage = async (uploadId, prompt, config, imageBase64, preset) => {
  return await fetch('/api/v41/generate', { ... });
};

// 4. Flujo completo
export const fullGenerationFlow = async (userId, biopsyPayload, sliderConfig, preset) => {
  // Vision → Compile → Generate
  const analysis = await analyzeImage(userId, biopsyPayload);
  const compiled = await compilePrompt(analysis, sliderConfig);
  const result = await generateImage(uploadId, compiled.prompt, ...);
  return result;
};
```

---

#### `/app/frontend/src/hooks/useV41Upload.ts`

**Propósito:** Hook que maneja el flujo completo de upload

```typescript
export const useV41Upload = (userId: string, tier: string) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  
  const processImage = async (file: File, sliderConfig, preset) => {
    // 1. Generate biopsy
    const biopsyPayload = await generateBiopsyPayload(file);
    
    // 2. Full flow
    const flowResult = await fullGenerationFlow(userId, biopsyPayload, sliderConfig, preset);
    
    setResult(flowResult);
    return flowResult;
  };
  
  return { isProcessing, result, processImage };
};
```

---

## 🔄 PARTE 4: FLUJOS COMPLETOS

### 4.1 FLUJO: Upload Simple (USER/PRO)

```
1. Usuario sube imagen en frontend
        ↓
2. BiopsyEngine genera 4 crops (300KB total)
        ↓
3. POST /api/v41/vision-orchestrator
   - Backend analiza con Gemini Vision
   - Clasifica: CAT02 (PRO_HEADSHOT)
   - Detecta defectos: IN02 (MOBILE_PROCESSED)
   - Mezcla configs:
     * CAT02: {"s1": "FORCE", "p3": "FORCE"}
     * IN02: {"p6": "HIGH", "s1": "HIGH"}
     * Final: {"s1": "FORCE", "p3": "FORCE", "p6": "HIGH"}
   - Retorna: "REVIEW_REQUIRED" con auto_settings
        ↓
4. Frontend muestra componente según tier:
   - USER → SimplePillarControl
   - PRO → MacroSliderGallery
   - PRO_LUX → MicroSliderGrid
        ↓
5. Usuario ajusta sliders manualmente (opcional)
        ↓
6. Click "Generar"
        ↓
7. POST /api/v41/prompt-compiler
   - Para cada slider:
     * p1=7 → Busca slider_definitions WHERE slider_key='p1'
     * Nivel 7 → HIGH
     * Obtiene instruction_high
     * Añade: "- [P1 - HIGH] COMMERCIAL CLEANUP..."
   - Agrupa por pilar
   - Ensambla prompt final
        ↓
8. POST /api/v41/generate
   - Llama LaoZhang Nano Banana Pro
   - Endpoint: https://api.laozhang.ai/v1beta/models/gemini-3-pro-image-preview:generateContent
   - Payload: {prompt, imagen_base64, config: {imageSize: "4K"}}
   - LaoZhang genera imagen 4K
        ↓
9. Frontend recibe imagen generada
        ↓
10. Usuario satisfecho → Click "Guardar Preset"
        ↓
11. SavePresetModal se abre
    - Usuario selecciona anchors: [✓] Background, [✓] Lighting
        ↓
12. POST /api/v41/save-preset
    - Backend detecta modo (Forense vs Showman)
    - Genera nano_params automáticamente
    - Guarda reference_image_url
    - Guarda en user_presets_v41
```

---

### 4.2 FLUJO: Batch Processing (AUTO tier)

```
1. Usuario AUTO sube imagen
        ↓
2. POST /api/v41/vision-orchestrator
   - Vision analiza (1 vez)
   - Tier = AUTO detectado
        ↓
3. Backend ejecuta execute_batch_processing():
   
   a) Lee user_upload_workflows:
      batch_config = [
        {"type": "AUTO", "variant": "FORENSIC"},
        {"type": "AUTO", "variant": "CREATIVE"}
      ]
   
   b) Para cada slot:
      
      Slot 1: FORENSIC
      ├─ Compila prompt
      ├─ temp: 0.1, seed: 42
      ├─ LaoZhang genera
      ├─ Guarda en generations
      └─ WAIT 1.5s (Heartbeat delay)
      
      Slot 2: CREATIVE
      ├─ Compila prompt
      ├─ temp: 0.8, seed: random
      ├─ LaoZhang genera
      ├─ Guarda en generations
      └─ Done
   
   c) Retorna: "BATCH_PROCESSING"
        ↓
4. Frontend muestra: "Procesando... puedes cerrar la app"
        ↓
5. Usuario guarda móvil (Pocket Mode)
        ↓
6. 10 minutos después → Usuario abre app
        ↓
7. Archives muestra 2 variantes
        ↓
8. Usuario elige la mejor → Unlock
```

---

### 4.3 FLUJO: Smart Anchors (Reusar Preset)

```
1. Usuario ya tiene preset "Restaurante Lujoso"
   - anchor_preferences: {background: true, lighting: true}
   - reference_image_url: "data:image/..." (foto del restaurante)
        ↓
2. Usuario sube NUEVA FOTO (de él en casa)
        ↓
3. Selecciona preset "Restaurante Lujoso"
        ↓
4. POST /api/v41/generate con preset
   
   Backend detecta anchors:
   ├─ background: true → Inyecta en prompt:
   │   "[SMART ANCHOR: BACKGROUND] Preserve environment from reference."
   ├─ lighting: true → Inyecta:
   │   "[SMART ANCHOR: LIGHTING] Match lighting from reference."
   └─ Añade reference_image a LaoZhang (multi-imagen)
        ↓
5. LaoZhang recibe:
   - Imagen 1: Nueva foto del usuario
   - Imagen 2: Reference image (restaurante)
   - Prompt con instrucciones de anclaje
        ↓
6. LaoZhang fusiona:
   - Toma al usuario de imagen 1
   - Toma el fondo del restaurante de imagen 2
   - Toma la iluminación de imagen 2
   - Genera: Usuario EN el restaurante con la luz dramática
        ↓
7. Resultado: El usuario se ve a sí mismo teletransportado al restaurante
```

---

## 🔧 PARTE 5: ADAPTACIÓN A TU ESTRUCTURA

### 5.1 SI TIENES SUPABASE DIFERENTE

**Opción A: Crear tablas nuevas (recomendado)**

1. Ejecuta: `/app/backend/migrations/v41_01_create_tables.sql`
2. Ejecuta: `/app/backend/migrations/v41_02_rls_policies.sql`
3. Pobla datos:
   ```bash
   python /app/backend/insert_sliders_v41.py
   python /app/backend/data/v41_all_data_insert.py
   ```

**Opción B: Adaptar a tus tablas existentes**

Si ya tienes tablas de usuarios, ajusta las referencias:

```python
# En vision_orchestrator_v41.py línea ~45
# Cambiar:
profile_response = supabase_db.client.table('profiles')...

# Por:
profile_response = supabase_db.client.table('TU_TABLA_USUARIOS')...
```

**Mapeo de campos:**
```
LuxScaler v41          → Tu estructura
-----------------        ---------------
profiles.tier          → users.subscription_type
profiles.token_balance → users.credits
uploads.biopsy_urls    → images.metadata
generations.config_used → jobs.parameters
```

---

### 5.2 SI USAS OTRA API DE IMÁGENES (No LaoZhang)

**Archivo a modificar:** `/app/backend/services/laozhang_service.py`

**Ejemplo con OpenAI DALL-E:**
```python
async def generate_with_openai(self, prompt, image_base64, config):
    import openai
    
    response = openai.Image.create_variation(
        image=base64.b64decode(image_base64),
        n=1,
        size="1024x1024",
        response_format="b64_json"
    )
    
    return {
        "success": True,
        "image_base64": response.data[0].b64_json
    }
```

**Ejemplo con Replicate:**
```python
async def generate_with_replicate(self, prompt, image_base64, config):
    import replicate
    
    output = replicate.run(
        "stability-ai/sdxl:...",
        input={
            "prompt": prompt,
            "image": f"data:image/jpeg;base64,{image_base64}",
            "strength": config.get('strength', 0.65)
        }
    )
    
    return {
        "success": True,
        "image_base64": output[0]
    }
```

---

### 5.3 SI NO QUIERES BIOMETRY ENGINE

El Biopsy Engine es opcional. Si quieres subir la imagen completa:

**Modificar:** `/app/frontend/src/services/v41Service.ts`

```typescript
// En vez de:
const biopsyPayload = await generateBiopsyPayload(file);
await analyzeImage(userId, biopsyPayload);

// Usar:
const base64 = await fileToBase64(file);
await analyzeImage(userId, {
  thumbnail_base64: base64,
  center_base64: base64,
  shadow_base64: base64,
  detail_base64: base64
});
```

---

## 📖 PARTE 6: EJEMPLOS DE USO

### 6.1 EJEMPLO: Cambiar Comportamiento de un Slider

**Escenario:** Quieres que p3 (nitidez) sea más agresivo en nivel FORCE

**Pasos:**
1. Ve a Supabase → Table Editor → slider_definitions
2. Busca fila donde slider_key = 'p3'
3. Edita campo `instruction_force`:
   ```
   Antes: "MASTER LENS SIMULATION..."
   Después: "ULTRA SHARP ZEISS OTUS. MAXIMUM ACUTANCE. CRYSTALLINE."
   ```
4. Guarda
5. **¡Listo!** Próxima generación usará el nuevo texto (sin restart)

---

### 6.2 EJEMPLO: Añadir Nueva Categoría

**Escenario:** Quieres detectar "Fotos de Comida"

**Pasos:**
1. INSERT en taxonomy_definitions:
```sql
INSERT INTO taxonomy_definitions (
  code, category_name, category_group,
  visual_description, strategy, slider_config
) VALUES (
  'CAT22',
  'FOOD_PHOTOGRAPHY',
  'PRODUCTOS',
  'Platos de comida, close-up, colores vibrantes',
  'SUCCULENCE ENHANCEMENT. Sharpen textures. Warm colors.',
  '{"p3": "HIGH", "s9": "FORCE", "l5": "HIGH"}'::jsonb
);
```

2. **¡Listo!** Gemini Vision ahora puede detectar CAT22

---

### 6.3 EJEMPLO: Crear Preset con Smart Anchors

**Frontend (después de generar imagen):**
```typescript
const handleSavePreset = async () => {
  const presetData = {
    userId: currentUser.id,
    uploadId: currentUpload.id,
    presetName: "Mi Restaurante",
    description: "Iluminación dramática interior",
    userAnchors: {
      background: true,   // ✓ Mantener fondo de restaurante
      lighting: true,     // ✓ Mantener luz
      clothes: false,     // ✗ Usar mi ropa actual
      pose: false
    },
    currentSliders: {p1: 5, s5: 10, l1: 9},
    thumbnailBase64: generatedImage
  };
  
  const response = await fetch('/api/v41/save-preset', {
    method: 'POST',
    body: JSON.stringify(presetData)
  });
};
```

**Backend detecta automáticamente:**
```python
# s5=10 (Fondo FORCE) y l1=9 (Luz HIGH) → Creativo
# strength: 0.85, guidance: 4.0
```

**Próxima foto + preset:**
```typescript
const response = await fetch('/api/v41/generate', {
  body: JSON.stringify({
    prompt: compiledPrompt,
    imageBase64: nuevaFoto,
    preset: {
      reference_image_url: "data:image/..." (restaurante),
      anchor_preferences: {background: true, lighting: true},
      nano_params: {strength: 0.85, guidance_scale: 4.0}
    }
  })
});

// LaoZhang recibe 2 imágenes:
// - nuevaFoto del usuario
// - reference del restaurante
// Resultado: Usuario EN el restaurante
```

---

## 🚀 PARTE 7: GUÍA DE INTEGRACIÓN PASO A PASO

### Paso 1: Supabase

```bash
# En Supabase SQL Editor:

# 1. Crear tablas
[Pegar contenido de: /app/backend/migrations/v41_01_create_tables.sql]
Run

# 2. Aplicar RLS
[Pegar contenido de: /app/backend/migrations/v41_02_rls_policies.sql]
Run

# 3. Verificar
SELECT COUNT(*) FROM tier_config;          -- Debe ser 4
SELECT COUNT(*) FROM taxonomy_definitions;  -- Debe ser 21
SELECT COUNT(*) FROM slider_definitions;    -- Debe ser 27
```

### Paso 2: Backend

```bash
# 1. Copiar archivos
cp /app/backend/services/vision_orchestrator_v41.py tu_proyecto/backend/services/
cp /app/backend/services/prompt_compiler_v41.py tu_proyecto/backend/services/
cp /app/backend/services/laozhang_service.py tu_proyecto/backend/services/
cp /app/backend/routes/v41_routes.py tu_proyecto/backend/routes/

# 2. Registrar rutas en server.py
from routes import v41_routes
app.include_router(v41_routes.router)

# 3. Instalar dependencias
pip install requests  # Para LaoZhang API

# 4. Configurar .env
LAOZHANG_API_KEY=sk-aduYr9zcGnV39Vpj238041B0Af384432BeFf37C5E8F8Bf24
GOOGLE_API_KEY=AIzaSy... (para Vision)
```

### Paso 3: Frontend

```bash
# 1. Copiar componentes
cp /app/frontend/src/components/SimplePillarControl.tsx tu_proyecto/frontend/src/components/
cp /app/frontend/src/components/MacroSliderGallery.tsx tu_proyecto/frontend/src/components/
cp /app/frontend/src/components/MicroSliderGrid.tsx tu_proyecto/frontend/src/components/
cp /app/frontend/src/components/SavePresetModal.tsx tu_proyecto/frontend/src/components/
cp /app/frontend/src/utils/biopsyEngine.ts tu_proyecto/frontend/src/utils/
cp /app/frontend/src/services/v41Service.ts tu_proyecto/frontend/src/services/
cp /app/frontend/src/hooks/useV41Upload.ts tu_proyecto/frontend/src/hooks/

# 2. Configurar .env
VITE_BACKEND_URL=https://tu-backend.com
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Paso 4: Integrar en tu App

```typescript
// En tu componente de upload:
import { useV41Upload } from './hooks/useV41Upload';
import { SimplePillarControl } from './components/SimplePillarControl';

function YourUploadPage() {
  const { processImage, isProcessing, result } = useV41Upload(userId, 'USER');
  
  const handleFileUpload = async (file: File) => {
    const sliderConfig = {p1: 5, s1: 5, l1: 5};  // Defaults
    const result = await processImage(file, sliderConfig);
    
    if (result.success) {
      showImage(result.imageBase64);
    }
  };
  
  return (
    <>
      <input type="file" onChange={(e) => handleFileUpload(e.target.files[0])} />
      
      {isProcessing && <div>Procesando...</div>}
      
      {result && <img src={`data:image/jpeg;base64,${result.imageBase64}`} />}
    </>
  );
}
```

---

## 🔑 PARTE 8: CONCEPTOS CLAVE

### 8.1 SISTEMA DATA-DRIVEN

**¿Qué significa?**
- NO hay prompts hardcodeados en el código
- TODO viene de Supabase
- Cambiar comportamiento = Editar DB

**Ventajas:**
- Cambios sin deploy
- A/B testing fácil
- Versionado de prompts
- Control granular

**Ejemplo:**
```sql
-- Cambio instantáneo sin tocar código:
UPDATE slider_definitions 
SET instruction_force = 'NUEVO COMPORTAMIENTO...'
WHERE slider_key = 'p3';
```

---

### 8.2 SMART ANCHORS

**¿Qué son?**
- Guardar la "esencia visual" de una foto exitosa
- Reusar en futuras fotos diferentes

**Anchors disponibles:**
1. **background:** Mantiene ambiente/locación
2. **lighting:** Mantiene esquema de iluminación
3. **style:** Mantiene color grading
4. **clothes:** Mantiene vestuario
5. **pose:** Mantiene postura

**Implementación técnica:**
- Frontend: Checkboxes en SavePresetModal
- Backend: Inyecta instrucciones en prompt
- LaoZhang: Multi-imagen fusion (hasta 14 referencias)

---

### 8.3 SMART STAGGERING

**¿Qué es?**
- Delay de 1.5s entre requests de generación
- Evita saturar la API (rate limiting)

**Implementación:**
```python
for index, item in enumerate(batch_config):
    # Genera imagen
    generate(...)
    
    # Heartbeat delay
    if index < len(batch_config) - 1:
        await asyncio.sleep(1.5)
```

---

## 📍 PARTE 9: UBICACIÓN DE TODO

### Backend:
```
/app/backend/services/vision_orchestrator_v41.py    (370 líneas)
/app/backend/services/prompt_compiler_v41.py        (180 líneas)
/app/backend/services/laozhang_service.py           (220 líneas)
/app/backend/routes/v41_routes.py                   (300 líneas)
/app/backend/routes/slider_definitions_v41.py       (35 líneas)
```

### Frontend:
```
/app/frontend/src/utils/biopsyEngine.ts             (220 líneas)
/app/frontend/src/components/SavePresetModal.tsx    (250 líneas)
/app/frontend/src/components/SimplePillarControl.tsx(150 líneas)
/app/frontend/src/components/MacroSliderGallery.tsx (200 líneas)
/app/frontend/src/components/MicroSliderGrid.tsx    (150 líneas)
/app/frontend/src/components/UserSettings.tsx       (300 líneas)
/app/frontend/src/services/v41Service.ts            (180 líneas)
/app/frontend/src/hooks/useV41Upload.ts             (80 líneas)
```

### Documentación:
```
/app/luxv41/
├── 00_MASTER_PROTOCOL_v41.md
├── API_REFERENCE.md
├── DEPLOYMENT_STATUS.md
├── IMPLEMENTATION_COMPLETE.md
├── INTEGRATION_GUIDE.md
├── SHOOT_POCKET_REVIEW.md
├── 01luxv41sql.md (Schema SQL completo)
├── 02luxv41edge.md (Backend/API)
├── 03luxv31logic.md (Frontend/UX)
└── 04luxv41_presets_anchors_addon.md
```

### Migrations:
```
/app/backend/migrations/v41_01_create_tables.sql
/app/backend/migrations/v41_02_rls_policies.sql
/app/backend/insert_sliders_v41.py
/app/backend/data/v41_all_data_insert.py
```

---

## ⚡ PARTE 10: TROUBLESHOOTING

### Error: "No taxonomy definitions loaded"

**Causa:** Tabla taxonomy_definitions vacía
**Solución:**
```bash
python /app/backend/data/v41_all_data_insert.py
```

### Error: "LaoZhang API error 401"

**Causa:** API key incorrecta
**Solución:**
```python
# En laozhang_service.py
self.api_key = "sk-TU_KEY_AQUI"
```

### Error: "Could not find relationship generations/variations"

**Causa:** historyService busca tabla que no existe
**Solución:** Ya está arreglado en `/app/frontend/src/services/historyService.ts`

---

## 📊 RESUMEN DE DATOS

```
TABLAS: 11
FILAS DE CONFIG: 74
  - tier_config: 4
  - taxonomy_definitions: 21
  - diagnosis_definitions: 10
  - slider_definitions: 27
  - macro_definitions: 12

ENDPOINTS: 7
COMPONENTES FRONTEND: 8
ARCHIVOS NUEVOS: 19
LÍNEAS DE CÓDIGO: ~2,500
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

```
□ Crear 11 tablas en Supabase
□ Poblar 74 filas de datos
□ Aplicar RLS policies
□ Copiar 5 archivos backend
□ Copiar 7 archivos frontend
□ Configurar .env (LAOZHANG_API_KEY, GOOGLE_API_KEY)
□ Registrar rutas en server
□ Instalar dependencias
□ Test: GET /api/v41/macro-definitions/PRO
□ Test: GET /api/slider-definitions
□ Test: Upload completo
□ Test: Save preset
□ Test: Smart Anchors
```

---

## 🎯 CONCLUSIÓN

**Este sistema es:**
- ✅ 100% data-driven (editable desde Supabase)
- ✅ Modular (cada pieza independiente)
- ✅ Escalable (añadir categorías/sliders fácilmente)
- ✅ Flexible (adaptar a cualquier estructura)

**Documentación completa en:** `/app/luxv41/`

**Para más detalles:** Lee los 10 documentos en `/app/luxv41/`
