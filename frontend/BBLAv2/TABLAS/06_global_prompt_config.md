### 🏛️ TABLA 6: `global_prompt_config` (MASTER STRUCTURE)

**Responsabilidad:** Inyección de parámetros de salida obligatorios (Format, Ratio, Quality) y restricciones negativas universales.

#### 1. DDL (Definición de Tabla)

A diferencia de las tablas anteriores, esta no necesita disparadores de sliders. Funciona por **Inyección Directa**. Sin embargo, he añadido un campo `exclusion_tags` para que el sistema sea inteligente: si estamos generando un "Cartoon", el sistema sabrá desactivar el negativo de "illustration style".

SQL

```
DROP TABLE IF EXISTS global_prompt_config;

CREATE TABLE global_prompt_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 🔑 IDENTIFICADOR ÚNICO
  config_key VARCHAR(50) UNIQUE NOT NULL, -- 'v15_master_negative', 'v15_output_specs', 'v15_safety_guidelines'

  -- 📄 EL CONTENIDO (TEXTO MASIVO)
  prompt_text TEXT NOT NULL,

  -- ⚙️ LÓGICA DE APLICACIÓN
  -- Array de tags que, si están presentes en la imagen (EdgeVision), DESACTIVAN esta regla.
  -- Ej: Si vision detecta 'SKETCH', desactivamos el negativo 'drawing, sketch'.
  exclusion_tags TEXT[], 

  -- Peso del token en la generación (para Negative Prompts suele ser 1.0 o superior)
  token_weight FLOAT DEFAULT 1.0,

  -- Control de Versiones
  version VARCHAR(10) DEFAULT 'v15.0',
  is_active BOOLEAN DEFAULT true,
  description VARCHAR(255),

  created_at TIMESTAMP DEFAULT NOW()
);

-- Índice para recuperar configuraciones rápidamente por clave
CREATE INDEX idx_global_config_key ON global_prompt_config(config_key);
```

---

#### 2. DML (INSERCIÓN DE DATOS DE PRODUCCIÓN)

Estos son los datos exactos del **Protocolo v15**. He consolidado las fuentes duplicadas (Source 48-49 y 117-118) en un bloque maestro y he separado los "Specs" técnicos.

#### A. V15 MASTER NEGATIVE (El Escudo Anti-Alucinación)

Fuente: "Negative Prompt: damaged photo, torn photo... plastic skin... bad anatomy..."

SQL

```
-- =================================================================================
-- CONFIG: MASTER NEGATIVE PROMPT (Protocolo v15 Forense)
-- Objetivo: Evitar daños, piel falsa y errores geométricos.
-- =================================================================================
INSERT INTO global_prompt_config (
  config_key,
  prompt_text,
  token_weight,
  description
) VALUES (
  'v15_master_negative',

  -- Usamos $$ para manejar el bloque de texto masivo sin problemas de comillas
  $$damaged photo, torn photo, white spots, chemical burns, missing pixels, scratched, dirty, 
  changing aspect ratio, cropping subject, shifting position, misaligned comparison, 
  faithful to bad source, preserving blur, motion blur, camera shake, trepidation, 
  melted faces, smudged faces, faceless people, distorted eyes, merged teeth, 
  plastic skin, wax skin, neon red skin, sunburned, oversaturated, crushed shadows, 
  blocked blacks, underexposed foreground, silhouetted buildings, dark blobs, flat lighting, 
  noisy, grainy, jpeg artifacts, bad anatomy, floating limbs, double vision, ghosting, 
  blurry table, blurry crowd, clipped highlights, solarized sky, foggy lens, steam patch, 
  dirty lens, light leak, unwanted lens flare, washed out colors, milky overlay, 
  low contrast haze, barrel distortion, curved walls, fish-eye effect, chromatic aberration, 
  purple fringing, wide angle distortion, big nose distortion, tilted horizon, crooked lines, 
  leaning buildings, distorted perspective, flat histogram, grey blacks, banding, posterization, 
  floating green dots, blue sensor ghosts, internal lens reflection, unwanted halos, 
  technical glare, dirty sensor spots, ugly artifacts, wrong white balance, sterile lighting, 
  HDR halos, washed out shadows, illustration, painting, drawing, sketch, anime, 3d render.$$
  ,
  1.0, -- Peso estándar
  'Universal negative prompt to enforce photorealism and prevent signal degradation.'
);
```

#### B. V15 OUTPUT SPECS (La Definición del Formato)

Fuente: "Native 4K, 8K UHD... Zero digital noise... STRICT ASPECT RATIO..."

SQL

```
-- =================================================================================
-- CONFIG: OUTPUT SPECIFICATIONS (Calidad de Salida)
-- Objetivo: Forzar la máxima resolución y el respeto al ratio de aspecto.
-- =================================================================================
INSERT INTO global_prompt_config (
  config_key,
  prompt_text,
  token_weight,
  description
) VALUES (
  'v15_output_specs',

  $$OUTPUT SPECS: Native 4K, 8K UHD, Photorealistic RAW. 
  Zero digital noise. Maximum Acutance. Perfect Geometry. 
  Full Histogram Range (Solid Blacks, Clean Whites). 
  STRICT ASPECT RATIO & ALIGNMENT: The Output MUST match the Input Format and Aspect Ratio EXACTLY. 
  The structural composition (position of eyes, subject boundaries, key landmarks) MUST ALIGN PERFECTLY with the source.$$
  ,
  1.2, -- Peso ligeramente superior para asegurar el cumplimiento del formato
  'Technical requirements for file quality and geometric alignment.'
);
```

#### C. V15 IDENTITY SAFETY (Protección de Integridad)

Fuente: "Identity Preservation: The people must look like themselves..."

SQL

```
-- =================================================================================
-- CONFIG: IDENTITY SAFETY NET
-- Objetivo: Asegurar que, incluso con estilos agresivos, la persona sea reconocible.
-- =================================================================================
INSERT INTO global_prompt_config (
  config_key,
  prompt_text,
  token_weight,
  description
) VALUES (
  'v15_identity_safety',

  $$IDENTITY INTEGRITY PROTOCOL: The subjects must look like themselves, but "in Ultra High Definition". 
  Correct proportions and perfect skin tones. 
  Do not alter bone structure unless "Rectilinear Correction" is active. 
  Prevent "Melted" Faces: Reconstruct anatomically perfect eyes (distinct iris/pupil), distinct noses, and separated teeth.$$
  ,
  1.1,
  'Base rules for human subject reconstruction.'
);
```

---

### 3. LÓGICA DE INTEGRACIÓN (SQL BUILDER)

El `sqlPromptBuilder.ts` trata esta tabla como la **Capa Base**. Siempre se inyecta, pero al final de la cadena de prompts positivos y negativos.

**Flujo de Construcción:**

1. **Positive Stack:** `[Photoscaler]` + `[Lightscaler]` + `[Stylescaler]` + `[Materials]` + **`[v15_output_specs]`** + **`[v15_identity_safety]`**. *(Nota: Los specs globales van al final del prompt positivo para reforzar la instrucción final al modelo).*

2. **Negative Stack:** **`[v15_master_negative]`** + `[Stylescaler Negative]` + `[Materials Negative]`.

**Mecanismo de Exclusión:** Si EdgeVision detecta que el usuario subió un dibujo (`classification: SKETCH`), el Builder consulta el campo `exclusion_tags` (si lo hubiera configurado más complejo) o simplemente la lógica de negocio decide no inyectar ciertos negativos. Sin embargo, para **"Forensic Re-shoot"**, la tabla anterior es inamovible: **siempre** queremos evitar "plastic skin" y "bad anatomy".

Esta tabla garantiza la consistencia de marca ("NanoBanana Look") sin importar qué locura haga el usuario con los sliders.
