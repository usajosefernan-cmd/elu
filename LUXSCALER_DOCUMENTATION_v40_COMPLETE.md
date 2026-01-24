# ================================================================
# LUXSCALER v40.2 - DOCUMENTACIÓN COMPLETA DEL SISTEMA DE PROMPTS
# ================================================================
# Fecha: 24 de Enero 2025
# Versión: v40 Cinematic + Dictator Prompt

## 🎯 RESUMEN EJECUTIVO

LuxScaler utiliza un sistema de compilación de prompts sofisticado que convierte 27 sliders 
numéricos en instrucciones precisas para Gemini 3 Pro Image Preview (NANOBANANPRO).

### Arquitectura del Sistema:
```
27 Sliders → Veto Engine → Block Injector → Sanitizer → Identity Lock → DNA Anchor → Gemini
```

---

## 📊 LOS 27 SLIDERS (3 PILARES)

### PILAR 1: PHOTOSCALER (9 sliders) - Color: CYAN
Gestiona la restauración técnica y óptica de la imagen.

1. **limpieza_artefactos** - Limpieza de Señal
2. **geometria** - Corrección Técnica
3. **optica_nitidez** - Definición Cristalina
4. **chronos** - Congelar Acción
5. **senal_raw** - Rango Dinámico
6. **sintesis_adn** - Textura Táctil
7. **grano_filmico** - Emulsión Fílmica
8. **apertura_bokeh** - Profundidad de Campo
9. **resolucion** - Escala Inteligente

### PILAR 2: STYLESCALER (9 sliders) - Color: PINK
Controla el estilismo, grooming y dirección de arte.

1. **styling_piel** - Grooming Facial
2. **styling_pelo** - Estilismo Capilar
3. **styling_ropa** - Sastrería Digital
4. **maquillaje** - MUA Profesional
5. **limpieza_entorno** - Set Design
6. **reencuadre_ia** - Composición Pro
7. **atmosfera** - Profundidad Aérea
8. **look_cine** - Etalonaje (Color)
9. **materiales_pbr** - Reflectancia PBR

### PILAR 3: LIGHTSCALER (9 sliders) - Color: AMBER
Maneja el esquema de iluminación cinematográfica.

1. **key_light** - Luz Principal
2. **fill_light** - Luz de Relleno
3. **rim_light** - Contraluz
4. **volumetria** - Rayos de Luz
5. **temperatura** - Temperatura Color
6. **contraste** - Curva de Contraste
7. **sombras** - Densidad Sombras
8. **estilo_autor** - Estilo de Iluminación
9. **reflejos** - Brillo de Piel

---

## 🎬 SISTEMA DE PROMPTS CINEMATOGRÁFICOS

Cada slider tiene 5 niveles de intensidad:
- **OFF (0)**: Sin aplicar / Original
- **LOW (1-3)**: Cambio sutil
- **MED (4-6)**: Cambio estándar comercial
- **HIGH (7-8)**: Cambio agresivo / Editorial
- **FORCE (9-10)**: 🔥 **EL DICTADOR** - Reescribe la realidad

### Ejemplo de Prompts por Nivel:

**limpieza_artefactos** (Limpieza de Señal):
```
OFF:   "PRESERVE PATINA. Treat sensor noise as essential texture."
LOW:   "CHROMA DENOISE. Remove only color noise."
MED:   "SIGNAL POLISH. Clean smooth surfaces but protect texture."
HIGH:  "COMMERCIAL CLEANUP. High-end editorial denoising."
FORCE: "PRISTINE HASSELBLAD MEDIUM FORMAT SENSOR. ZERO ARTIFACTS."
```

**key_light** (Luz Principal):
```
OFF:   "AMBIENT ONLY. Use available light."
LOW:   "REFLECTOR FILL. Bounce light back to face."
MED:   "SOFTBOX (OCTA). Commercial beauty light."
HIGH:  "FRESNEL (HARD). Hollywood spotlight."
FORCE: "CINEMATIC REMBRANDT LIGHTING. DRAMATIC SHAFT FROM 45°. 
        NETFLIX DRAMA LOOK. PROFOTO STUDIO STROBE QUALITY."
```

---

## 🧠 TEMPLATE DEL SYSTEM PROMPT

```plaintext
[SYSTEM OVERRIDE: UNIVERSAL FORENSIC RE-SHOOT & OPTICAL SYNTHESIS PROTOCOL v29.0]
[ROLE: REALITY RECONSTRUCTION ENGINE]
[USER_PROFILE: {profile_type}]

=== CRITICAL INSTRUCTION: LOGICAL CONFLICT RESOLUTION ===
If the instructions below contain contradictory elements (e.g., "Fog" AND "Sharpness"), 
YOU MUST PRIORITIZE THE LAST INSTRUCTION IN THE LIST and ignore the conflicting previous one.
DO NOT attempt to merge contradictory styles. Pick one distinct path.
When in doubt, choose COHERENCE over literal interpretation.

INPUT CONTEXT:
Category: {category}
Technical Score: Noise={noise_level}, Blur={blur_level}
Target Vision: {target_vision}

=== PHASE 0: STRUCTURAL INTEGRITY (IDENTITY LOCK) ===
{identity_block}

=== PHASE 1: CORE DIAGNOSIS & RE-SYNTHESIS STRATEGY ===
IF INPUT IS BLURRY/NOISY/DAMAGED -> ACTIVATE "COMPLETE RE-SYNTHESIS".
IGNORE source artifacts. HALLUCINATE high-frequency details from context.
VIRTUAL RE-SHOOT: Simulate 1/8000s shutter speed (zero motion blur).

=== PHASE 2: SUBJECT & ANATOMY ===
[INSTRUCTION: Restore faces with Portrait-Level fidelity. Preserve character.]
{stylescaler_block}

=== PHASE 3: OPTICS, PHYSICS & LIGHTING ===
GEOMETRY & RESTORATION:
{photoscaler_block}

LIGHTING & TONE:
{lightscaler_block}

=== NEGATIVE PROMPT ===
damaged, blurry, noisy, distorted faces, bad anatomy, text, watermarks, 
jpeg artifacts, shifting eyes, morphing features, different pose.

=== QUALITY GATES ===
- Output resolution: 19.5MP (4800x4200px equivalent) → 4K
- Color depth: 24-bit sRGB
- Format: JPEG, quality 95
- Compression: Minimal (preserve fine details)
```

---

## 🔒 IDENTITY LOCK SYSTEM

**Qué es:** Un sistema dinámico que varía el nivel de restricción biométrica según 
los sliders activos.

### Niveles de Constraint:

**STRICT** (cuando styling_piel > 6 o styling_pelo > 6):
```
[IDENTITY CONSTRAINT: STRICT]
ABSOLUTE BIOMETRIC LOCK.
DO NOT change bone structure, eye distance, nose shape, lip proportions.
DO NOT shift face angle, expression, or pose.
DO NOT reinterpret identity or features.
```

**MODERATE** (cuando styling_piel 3-6):
```
[IDENTITY CONSTRAINT: MODERATE]
Maintain facial identity and structure.
You may enhance quality (remove blemishes, smooth skin) but keep the person.
```

**PERMISSIVE** (cuando styling_piel < 3):
```
[IDENTITY CONSTRAINT: PERMISSIVE]
Identity should remain recognizable but creative interpretation is allowed.
```

---

## 🎭 THE DICTATOR PROMPT (v40)

**Concepto:** Cuando un slider está en 9-10, su estilo domina y sobrescribe el contexto 
original de la imagen.

### Ejemplo:

Si el usuario tiene:
- `limpieza_entorno = 10` (FORCE)
- `atmosfera = 9` (FORCE)

El sistema genera un **style_lock_prompt** que dice:

```
BACKGROUND OVERRIDE: The environment MUST BE a cyberpunk neon-lit cityscape 
with wet asphalt reflections. The original location is IRRELEVANT.
```

Este prompt se guarda en el preset y se reutiliza en futuras imágenes para mantener 
consistencia estilística.

### Locked Sliders:
Cuando guardas un preset con sliders dominantes (>8), esos sliders se "bloquean":
- Aparecen deshabilitados en la UI
- Tienen un ícono de candado 🔒
- No se pueden modificar sin resetear el preset

---

## 🧬 DNA ANCHOR (Multimodal)

**Qué es:** Un recorte del rostro que se envía junto al prompt para garantizar 
consistencia facial.

### Proceso:
1. La imagen original se analiza con `gemini-2.5-flash`
2. Si detecta cara, recorta la región facial
3. Se convierte a base64
4. Se envía como segunda imagen al modelo junto al prompt

### Formato Gemini:
```python
[
  {"text": compiled_prompt},
  {"inline_data": {"mime_type": "image/jpeg", "data": original_image_base64}},
  {"inline_data": {"mime_type": "image/jpeg", "data": face_crop_base64}}
]
```

---

## ⚡ SMART MODE SWITCH

**Lógica Automática:**

### FORENSIC MODE (Restauración Alta Fidelidad):
- **Trigger:** Si el usuario solo toca sliders de PHOTOSCALER
- **Config:** `temperature=0.1`, `seed=42`
- **Objetivo:** Máxima fidelidad al original

### SHOWMAN MODE (Reimaginación Creativa):
- **Trigger:** Si el usuario toca sliders de STYLESCALER o LIGHTSCALER
- **Config:** `temperature=0.75`, `seed=random`
- **Objetivo:** Creatividad y estilo

---

## 🔄 VETO ENGINE

**Qué hace:** Resuelve conflictos lógicos entre sliders contradictorios.

### Ejemplo de Veto:
```python
Si grano_filmico > 7 Y limpieza_artefactos > 7:
  → Reducir limpieza_artefactos a 5 (para preservar el grano)
```

Reglas comunes:
- Grano vs Limpieza
- Bokeh vs Nitidez Global
- Atmósfera vs Nitidez
- Sombras vs Brillo

---

## 📦 CONTEXT CACHING (Vertex AI)

**Qué es:** Almacena el System Prompt en caché para reducir costos.

### Ahorro:
- **Primera generación:** ~4000 tokens
- **Generaciones siguientes:** ~500 tokens (90% ahorro)

### Tiempo de vida:
- 1 hora de validez
- Se actualiza automáticamente si cambia el system prompt

---

## 🎨 BATCH PROCESSING

**Capacidad:** Procesar múltiples imágenes con la misma configuración de estilo.

### Flujo:
1. Usuario selecciona múltiples archivos
2. Sistema analiza cada imagen (en paralelo)
3. Aplica el mismo preset/configuración a todas
4. Genera todas las imágenes en secuencia

### Ventaja del Dictator Prompt:
Si guardas un preset con style_lock_prompt, TODAS las imágenes del batch 
recibirán el mismo tratamiento estilístico, sin importar sus contextos originales.

---

## 📏 CONFIGURACIÓN DE GENERACIÓN

```python
generation_config = {
    "temperature": 0.1 o 0.75,  # Según modo
    "seed": 42 o random,         # Según modo
    "top_k": 40,
    "top_p": 0.9,
    "max_output_tokens": 8192,
    "response_mime_type": "image/jpeg"
}
```

---

## 🎯 CALIDAD DE SALIDA

**Resolución Objetivo:** 4K (19.5MP)
- **Dimensiones aproximadas:** 4800x4200px
- **Modelo:** `gemini-3-pro-image-preview` (NANOBANANPRO)
- **Capacidad:** Genera imágenes de ultra alta resolución

---

## 📄 UBICACIÓN DE ARCHIVOS CLAVE

```
/app/backend/data/slider_definitions_v40_cinematic.json
  → Definiciones de los 27 sliders con prompts cinematográficos

/app/backend/services/prompt_compiler_service.py
  → Motor principal de compilación

/app/backend/services/conflict_veto_engine.py
  → Resolución de conflictos

/app/backend/services/dictator_prompt_builder.py
  → Generador de style_lock_prompt

/app/backend/migrations/user_presets_v40_dictator.sql
  → Schema de la tabla user_presets (NO APLICADO AÚN)

/app/LUXSCALER_TABLA_SLIDERS_v40_CINEMATIC.xlsx
  → Tabla Excel con todos los sliders y niveles
```

---

## 🔐 CREDENCIALES SUPABASE

**Ubicación:** `/app/BBLA/CREDENTIALS.json`

```json
{
  "project_ref": "uxqtxkuldjdvpnojgdsh",
  "project_url": "https://uxqtxkuldjdvpnojgdsh.supabase.co",
  "anon_key": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "service_role_key": "sbp_0d9969a3b1c2a9a997b8f9ec171445ce490c8ec4",
  "db_connection_string": "postgres://postgres:EVG7avwllhmF1QR8@db.uxqtxkuldjdvpnojgdsh.supabase.co:6543/postgres"
}
```

---

## 🚀 ESTADO ACTUAL DEL PROYECTO

### ✅ Completado:
- Sistema de prompts cinematográficos
- Smart Mode Switch
- Batch Processing
- Dictator Prompt (backend completo)
- Locked Sliders (backend + frontend básico)
- Optimización de Vision Service (~5s)

### 🟡 En Progreso:
- **P0:** Frontend de Locked Sliders (90% completo, falta testing)

### ⏳ Pendiente:
- **P1:** Migración de DB (`user_presets` table)
- **P2:** UI mejorada en ArchivesDashboard
- **P3:** Full prompt visibility en Archives
- DNA Anchor (implementado pero no testeado)
- Context Caching (implementado pero requiere Vertex AI)

---

## 📊 MÉTRICAS DE PERFORMANCE

- **Análisis de visión:** 5-7 segundos (optimizado)
- **Generación 4K:** ~15-30 segundos (según Gemini API)
- **Compilación de prompt:** <100ms
- **Batch de 5 imágenes:** ~2-3 minutos

---

## 🎓 NOTAS TÉCNICAS

1. **Todos los prompts están en INGLÉS** aunque la UI esté en español
2. Los sliders usan **snake_case** internamente pero **PascalCase** en UI
3. El sistema tolera **variaciones de nombres** (geometria vs geometria_distorsion)
4. Los valores de sliders son **0-10** pero se mapean a 5 niveles discretos
5. **FORCE (9-10)** es el nivel más potente y puede sobrescribir contexto original

---

## 🔮 VISIÓN FUTURA

1. **Multimodal DNA Anchor** completamente funcional
2. **Biopsy Engine** para análisis profundo
3. **Context Caching** en producción con Vertex AI
4. **Presets Compartidos** entre usuarios
5. Integración con **Stripe** para pagos

---

**FIN DEL DOCUMENTO**

Para más detalles, revisa:
- `/app/LUXSCALER_TABLA_SLIDERS_v40_CINEMATIC.xlsx` (tabla completa)
- `/app/backend/data/slider_definitions_v40_cinematic.json` (definiciones JSON)
