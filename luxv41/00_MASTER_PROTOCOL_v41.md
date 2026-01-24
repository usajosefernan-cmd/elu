# LUXSCALER v41 - MASTER PROTOCOL
# Protocolo Completo de la Aplicación

## 🎯 ARQUITECTURA GENERAL

### Sistema 100% Data-Driven
```
Frontend (React/Vite/TS)
    ↓
Backend FastAPI
    ↓
Supabase PostgreSQL (11 tablas)
    ├─ Definiciones: taxonomy, diagnosis, sliders, macros, tiers
    ├─ Operaciones: uploads, analysis, generations, presets
    └─ Smart Anchors: reference images + preferences
    ↓
LaoZhang API (Nano Banana Pro)
    └─ gemini-3-pro-image-preview (4K, $0.05/edit)
```

---

## 📊 BASE DE DATOS (11 Tablas)

### Definiciones (Read-Only):
1. **tier_config** (4 filas): AUTO, USER, PRO, PRO_LUX
2. **taxonomy_definitions** (21 filas): CAT01-CAT21 categorías de imágenes
3. **diagnosis_definitions** (10 filas): IN02-IN11 defectos detectables
4. **slider_definitions** (27 filas): p1-p9, s1-s9, l1-l9 con 5 niveles cada uno
5. **macro_definitions** (12 filas): 3 macros USER + 9 macros PRO

### Operaciones (Read-Write):
6. **profiles**: Perfil del usuario (tier, token_balance)
7. **uploads**: Registro de subidas con biopsy
8. **analysis_results**: Resultados de Vision (cat_code, defects, auto_settings)
9. **generations**: Imágenes generadas (prompt, config, URLs)
10. **user_presets_v41**: Presets con Smart Anchors
11. **user_upload_workflows**: Configuración de workflows

---

## 🔄 FLUJO COMPLETO

### 1. UPLOAD
```
Usuario selecciona imagen
    ↓
Biopsy Engine (Frontend)
    ├─ Thumbnail: 1024px (contexto completo)
    ├─ Center: 512x512 (zona central)
    ├─ Shadow: 512x512 (región más oscura)
    └─ Detail: 512x512 (mayor entropía/textura)
    ↓
POST /api/v41/vision-orchestrator
    ├─ Crea registro en 'uploads'
    ├─ Obtiene tier del usuario
    └─ Ejecuta análisis
```

### 2. VISION ANALYSIS
```
Gemini Vision (gemini-2.5-flash)
    ↓
Clasificación
    ├─ Consulta taxonomy_definitions (21 categorías)
    ├─ Consulta diagnosis_definitions (10 defectos)
    └─ Retorna: {cat_code, detected_defects, severity_score}
    ↓
Motor de Mezcla
    ├─ Lee slider_config de taxonomy
    ├─ Lee slider_config de cada diagnosis
    ├─ Mezcla configs (último gana si conflicto)
    └─ Genera auto_settings
    ↓
Guarda en analysis_results
    ↓
Respuesta según TIER:
    - AUTO → BATCH_PROCESSING
    - USER/PRO/PRO_LUX → REVIEW_REQUIRED
```

### 3. USER REVIEW (USER/PRO/PRO_LUX)
```
Frontend muestra componente según tier:
    - USER → SimplePillarControl (3 sliders macro)
    - PRO → MacroSliderGallery (9 macros temáticos)
    - PRO_LUX → MicroSliderGrid (27 sliders individuales)
    ↓
Usuario ajusta sliders
    ↓
POST /api/v41/prompt-compiler
```

### 4. PROMPT COMPILATION
```
Prompt Compiler v41
    ↓
Para cada slider activo:
    ├─ Lee slider_definitions desde Supabase
    ├─ Determina nivel: OFF/LOW/MED/HIGH/FORCE
    └─ Obtiene instruction_xxx correspondiente
    ↓
Agrupa por pilar:
    ├─ PHOTOSCALER operations
    ├─ STYLESCALER operations
    └─ LIGHTSCALER operations
    ↓
BIOMETRIC LOCK (si hay rostro):
    └─ Inyecta reglas de preservación facial
    ↓
Ensambla prompt final
```

### 5. GENERATION
```
POST /api/v41/generate
    ↓
Si usa preset con Smart Anchors:
    ├─ Lee anchor_preferences
    ├─ Inyecta instrucciones de anclaje
    ├─ Añade reference_image como multi-imagen
    └─ Usa nano_params del preset
    ↓
LaoZhang Nano Banana Pro
    ├─ Model: gemini-3-pro-image-preview
    ├─ Resolution: 4K
    ├─ Multi-image: hasta 14 referencias
    └─ Config: strength, guidance_scale del preset
    ↓
Guarda en generations
    ↓
Retorna image_base64
```

### 6. SAVE PRESET (Smart Anchors)
```
Usuario satisfecho → Click "Guardar"
    ↓
SavePresetModal
    ├─ Nombre del preset
    ├─ Descripción
    └─ Checkboxes: background, lighting, style, clothes, pose
    ↓
POST /api/v41/save-preset
    ↓
Detector de Modo:
    ├─ Si sliders creativos (s3, s5, s8, l1) > 5 → Showman
    └─ Si sliders bajos → Forense
    ↓
Guarda en user_presets_v41:
    ├─ sliders_config: {p1: 5, s1: 7, ...}
    ├─ nano_params: {strength: 0.85, guidance: 4.0, seed: 123}
    ├─ anchor_preferences: {background: true, lighting: true}
    ├─ reference_image_url: URL de la imagen generada
    └─ prompt_text: backup del prompt
```

---

## 🎨 PERFILES Y UI

### AUTO (Autopilot)
- No UI de sliders
- Batch automático de 1 preview
- Usa auto_settings de Vision

### USER (Simple)
- SimplePillarControl
- 3 sliders macro:
  - 💎 Calidad Imagen → p1-p9
  - ✨ Estética IA → s1-s9
  - 💡 Iluminación Pro → l1-l9

### PRO (Mesa de Mezclas)
- MacroSliderGallery
- 9 macros temáticos:
  - PHOTOSCALER: restauracion, fidelidad, caracter
  - STYLESCALER: presencia, pulido, cinematica
  - LIGHTSCALER: volumen, drama, atmosfera

### PRO_LUX (Control Total)
- MicroSliderGrid
- 27 sliders individuales
- Control granular completo

---

## 🔗 SMART ANCHORS

### Concepto:
Guardar no solo los sliders, sino la "esencia visual" de una generación exitosa.

### Anchors Disponibles:
1. **Background** → Mantiene ambiente/locación
2. **Lighting** → Mantiene esquema de iluminación
3. **Style** → Mantiene color grading/mood
4. **Clothes** → Mantiene vestuario
5. **Pose** → Mantiene postura

### Implementación:
- Frontend: Checkboxes en SavePresetModal
- Backend: Inyecta instrucciones en prompt
- LaoZhang: Multi-imagen fusion con reference_image

---

## 🎯 ENDPOINTS v41

```
POST /api/v41/vision-orchestrator
  → Analiza y clasifica imagen

POST /api/v41/prompt-compiler
  → Ensambla prompt desde DB

POST /api/v41/generate
  → Genera con LaoZhang Nano Banana Pro

POST /api/v41/save-preset
  → Guarda preset con Smart Anchors

GET /api/v41/presets/{userId}
  → Obtiene presets del usuario

GET /api/v41/macro-definitions/{tier}
  → Obtiene macros para un perfil
```

---

## 🔐 BIOMETRIC LOCK

### Regla Universal:
SI imagen tiene rostro humano → BIOMETRIC LOCK ACTIVO

### Elementos Protegidos:
- Estructura ósea facial
- Proporciones (ojos, nariz, labios)
- Expresión y tensión muscular
- Dirección de mirada
- Pose de cabeza
- Marcas distintivas (lunares, cicatrices)

### Operaciones Permitidas:
- Corrección de sensor (ruido, desenfoque)
- Color grading
- Iluminación
- Corrección de distorsión de lente (si geometria > 0)

---

## 📝 SLIDER SYSTEM

### 27 Sliders × 5 Niveles = 135 Instrucciones

**PHOTOSCALER (p1-p9):**
- p1: Limpieza de Señal
- p2: Corrección Técnica
- p3: Definición Cristalina
- p4: Congelar Acción
- p5: Rango Dinámico
- p6: Textura Táctil
- p7: Emulsión Fílmica
- p8: Profundidad de Campo
- p9: Densidad de Píxel

**STYLESCALER (s1-s9):**
- s1: Grooming Pro
- s2: Estilismo Capilar
- s3: Sastrería Digital
- s4: MUA Profesional
- s5: Set Design
- s6: Composición Pro
- s7: Profundidad Aérea
- s8: Etalonaje (Color)
- s9: Reflejos Físicos

**LIGHTSCALER (l1-l9):**
- l1: Luz Principal
- l2: Luz de Relleno
- l3: Luz de Recorte
- l4: Haces de Luz
- l5: Balance de Blancos
- l6: Curva de Tonos
- l7: Densidad de Negros
- l8: Esquema Dramático
- l9: Brillo de Piel

### Niveles:
- 0: OFF
- 1-3: LOW
- 4-6: MED
- 7-9: HIGH
- 10: FORCE

---

## 🔧 MAINTENANCE

### Editar Comportamiento:
```sql
-- En Supabase SQL Editor

UPDATE slider_definitions 
SET instruction_force = 'NUEVO TEXTO...'
WHERE slider_key = 'p3';

-- Cambio instantáneo sin restart
```

### Añadir Categoría:
```sql
INSERT INTO taxonomy_definitions (code, category_name, category_group, visual_description, strategy, slider_config)
VALUES ('CAT22', 'NUEVA', 'SERES VIVOS', '...', '...', '{"p3": "FORCE"}');
```

### Añadir Diagnóstico:
```sql
INSERT INTO diagnosis_definitions (code, diagnosis_name, visual_description, strategy, slider_config)
VALUES ('IN12', 'NUEVO_DEFECTO', '...', '...', '{"p1": "HIGH"}');
```

---

## FIN DEL MASTER PROTOCOL v41

Ver documentos completos en:
- 01luxv41sql.md (Base de datos)
- 02luxv41edge.md (Backend/API)
- 03luxv31logic.md (Frontend/UX)
- laozhang.md (Integración LaoZhang)