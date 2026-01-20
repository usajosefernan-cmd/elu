### 🏛️ TABLA 3: `stylescaler_prompt_rules` (MASTER STRUCTURE)

**Responsabilidad:** Inyección de Textura, Estilo Cinematográfico (Anamórfico), Escenografía y Styling.

#### 1. DDL (Definición de Tabla)

He añadido columnas específicas para **Environment** y **Styling** como pediste en la corrección del plan. Esto permite que el sistema no solo mejore la foto, sino que "re-vista" la escena si el nivel de creatividad es alto.

SQL

```
DROP TABLE IF EXISTS stylescaler_prompt_rules;

CREATE TABLE stylescaler_prompt_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 🎚️ CONTROL DE ACTIVACIÓN
  slider_name VARCHAR(50) NOT NULL,       -- 'detalle', 'creatividad', 'style_strength'
  slider_value_min INT,                   -- 1-10
  slider_value_max INT,
  on_off BOOLEAN DEFAULT true,

  -- 🎨 MÓDULOS DEL PROTOCOLO V15 (TEXTO RAW)

  -- 1. Art Direction Base: El "Vibe" general.
  -- Ej: "CINEMATIC EDITORIAL AESTHETIC. Vogue Italia Mood..."
  art_direction_header TEXT,

  -- 2. Texture Engine (High Frequency): La instrucción de detalle microscópico.
  -- Ej: "INJECT MASSIVE HIGH-FREQUENCY DETAIL. Hallucinate pores, fabric threads..."
  texture_quality_prompt TEXT,

  -- 3. Anamorphic Optics (The Cinema Look): Carácter de lente artístico (vs. técnico).
  -- Ej: "ANAMORPHIC OPTICS. Oval Bokeh, Horizontal Blue Flares, Panavision look."
  anamorphic_optics_prompt TEXT,

  -- 4. Environment & Scenography: Contexto espacial.
  -- Ej: "LUXURY STUDIO BACKGROUND. Velvet curtains, textured concrete, atmospheric depth."
  environment_prompt TEXT,

  -- 5. Styling & Props: Maquillaje, ropa y objetos.
  -- Ej: "HIGH FASHION STYLING. Wet skin look, couture fabrics, intricate jewelry."
  styling_prompt TEXT,

  -- 6. Negative Style Constraints: Lo que NO queremos estéticamente.
  -- Ej: "No plastic skin, no AI smoothing, no amateur lighting."
  style_negative_constraints TEXT,

  -- 🤖 PARÁMETROS DE IA (CONTROL DE ALUCINACIÓN)
  guidance_scale FLOAT DEFAULT 7.5,       -- Qué tan literal es la IA (CFG Scale)
  hallucination_density FLOAT DEFAULT 0.0,-- Creatividad permitida (0.0 = Nada, 1.0 = Inventa todo)

  priority_weight INT DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_style_slider ON stylescaler_prompt_rules(slider_name, slider_value_min, slider_value_max);
```

---

#### 2. DML (INSERCIÓN DE DATOS DE PRODUCCIÓN)

Aquí definimos cómo escala la "mentira creativa".

- **Nivel 1-3:** Realismo documental. Cero invención.

- **Nivel 8-10:** "Drama Club" & "Reality Warp". Cine puro, texturas hiperreales y look anamórfico.

SQL

```
-- =================================================================================
-- NIVEL 1-3: DOCUMENTAL / FIDELIDAD (Cero Alucinación)
-- Estrategia: "What you see is what you get". Solo limpieza.
-- =================================================================================
INSERT INTO stylescaler_prompt_rules (
  slider_name, slider_value_min, slider_value_max,
  art_direction_header,
  texture_quality_prompt,
  anamorphic_optics_prompt,
  hallucination_density,
  guidance_scale
) VALUES (
  'detalle', 1, 3,
  '[STYLE: DOCUMENTARY REALISM]',
  'Maintain original texture frequency. Do not add artificial grain or sharpness.',
  'Standard spherical lens characteristics. No stylized flares or bokeh.',
  0.1,  -- Mínima invención
  5.0   -- Guidance bajo para ser muy fiel al input
);

-- =================================================================================
-- NIVEL 4-7: EDITORIAL CLEAN (Mejora Comercial)
-- Estrategia: "Glossy Magazine". Piel perfecta, fondo limpio.
-- =================================================================================
INSERT INTO stylescaler_prompt_rules (
  slider_name, slider_value_min, slider_value_max,
  art_direction_header,
  texture_quality_prompt,
  styling_prompt,
  environment_prompt,
  hallucination_density,
  guidance_scale
) VALUES (
  'detalle', 4, 7,
  '[STYLE: HIGH-END COMMERCIAL EDITORIAL]',
  'Enhance micro-contrast in key areas (eyes, jewelry). Clean skin texture without blurring.',
  'Professional grooming. Tidy hair, hydrated lips.',
  'Clean up background distractions. Unify environmental lighting.',
  0.4,  -- Invención moderada para arreglar defectos
  7.5   -- Guidance estándar
);

-- =================================================================================
-- NIVEL 8-10: DRAMA CLUB & REALITY WARP (El Protocolo v15 Completo)
-- Estrategia: Cine, Textura Extrema, Lentes Anamórficas.
-- =================================================================================
INSERT INTO stylescaler_prompt_rules (
  slider_name, slider_value_min, slider_value_max,

  -- 1. Art Direction (Source 60-62)
  art_direction_header,

  -- 2. Texture Engine (Source 9, 46, 115)
  texture_quality_prompt,

  -- 3. Anamorphic Optics (Source 63, 64, 108)
  anamorphic_optics_prompt,

  -- 4. Environment (Drama Club Context)
  environment_prompt,

  -- 5. Styling (High Fashion)
  styling_prompt,

  -- AI Params (Strict Guidance for High Detail)
  hallucination_density,
  guidance_scale
) VALUES (
  'detalle', 8, 10,

  -- Header: "Drama Club" (Alto contraste y emoción)
  '$$[STYLE OVERRIDE: CINEMATIC DRAMA CLUB & REALITY WARP]. The goal is NOT stock photography. We seek high contrast, emotion, and a surreal "dream-like" clarity.$$',

  -- Texture: Inyección masiva de detalle (Re-Síntesis)
  '$$INJECT MASSIVE HIGH-FREQUENCY DETAIL: You must HALLUCINATE organic roughness (skin pores, vellus hair, fabric threads, brick imperfections) to kill the "plastic/mobile" look. Every surface must have tactile weight.$$',

  -- Optics: El Look Hollywood (Anamórfico)
  '$$ANAMORPHIC OPTICS ("HOLLYWOOD LOOK"): Simulate Panavision C-Series Anamorphic Lens characteristics. Create subtle oval bokeh in out-of-focus areas. Allow controlled horizontal flares (blue/gold) if light hits the lens directly. Instant cinematic feel.$$',

  -- Environment: Atmósfera densa
  '$$SCENOGRAPHY ENHANCEMENT: If background is dull, inject "Cinematic Atmosphere". Add depth cues, subtle haze, and rich textures to walls/floors. Avoid sterile white walls.$$',

  -- Styling: "Dead Sharp" subjects
  '$$STYLING PRIORITY: Subjects must look "Dead Sharp" and professionally styled. Reconstruct makeup texture, fabric folds, and accessories with macro-level definition.$$',

  0.8,  -- Alta densidad de alucinación (80% creatividad en texturas)
  12.0  -- Guidance MUY ALTO (12.0) para forzar que la IA obedezca el prompt complejo
);
```

### 3. EXPLICACIÓN DE LA INTELIGENCIA (SQL BUILDER)

Esta tabla es crítica porque maneja el **`guidance_scale`**.

Cuando el usuario sube el slider `Detalle` a 10:

1. **Cambio de Texto:** El prompt se llena de instrucciones agresivas ("INJECT MASSIVE DETAIL", "ANAMORPHIC").

2. **Cambio de Parámetro IA:** El `guidance_scale` salta de 7.5 a **12.0**.
   
   - *Por qué:* A mayor complejidad del prompt (instrucciones anamórficas, texturas específicas), necesitas que la IA se ciña más estrictamente al texto y menos a su propia aleatoriedad. Un guidance bajo con este prompt resultaría en una imagen caótica.

**Diferencia Clave con Photoscaler:**

- `Photoscaler` (Tabla 1) dice: *"La línea del horizonte está recta"*. (Geometría).

- `Stylescaler` (Tabla 3) dice: *"La luz en el horizonte hace un flare azul horizontal"*. (Arte).

Esta separación permite que un usuario pueda tener una **Geometría Perfecta** (Photoscaler 10) pero un **Estilo Documental Sobrio** (Stylescaler 3), o una **Geometría Rota/Artística** y un **Estilo Cyberpunk**. Control tota
