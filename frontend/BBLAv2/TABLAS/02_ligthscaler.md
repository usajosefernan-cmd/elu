### 🏛️ TABLA 2: `lightscaler_prompt_rules` (MASTER STRUCTURE)

**Responsabilidad:** Director de Fotografía (DoP) y Colorista. Controla el histograma, la temperatura de color y la física de la luz.

#### 1. DDL (Definición de Tabla)

Observa las nuevas columnas `TEXT`. Separamos la **"Recuperación Técnica"** (salvar una foto oscura) del **"Grading Creativo"** (darle un look "Blue Hour" o "Teal/Orange").

SQL

```
DROP TABLE IF EXISTS lightscaler_prompt_rules;

CREATE TABLE lightscaler_prompt_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 🎚️ CONTROL DE ACTIVACIÓN
  slider_name VARCHAR(50) NOT NULL,       -- 'sombras', 'identity', 'lighting_style'
  slider_value_min INT,                   -- Para sliders lineales (1-10)
  slider_value_max INT,
  style_slug VARCHAR(50),                 -- Para presets específicos ('rembrandt_v32', 'neon_noir')
  on_off BOOLEAN DEFAULT true,

  -- 💡 MÓDULOS DEL PROTOCOLO V15 (TEXTO RAW)

  -- 1. Base Protocol: Diagnóstico y estrategia de exposición.
  -- Ej: "[SUB-PROTOCOL: LOW-LIGHT RECOVERY & ATMOSPHERIC TONE MAPPING]"
  protocol_header TEXT,

  -- 2. Zone System Logic: Cómo manejar el histograma (negros y blancos).
  -- Ej: "STRICTLY Anchor Black Point at (0,0,0). Aggressively lift Zones 1-3..."
  zone_system_logic TEXT,

  -- 3. Dynamic Range Strategy: Compresión de luz (HDR).
  -- Ej: "CONCEPTUAL TONE MAPPING (HDR 2.0). Ensure Cinematic Visibility..."
  dynamic_range_strategy TEXT,

  -- 4. Color Science & Grading: Teoría del color aplicada.
  -- Ej: "BLUE HOUR AESTHETIC. Force 'Warm Tungsten' vs 'Cool Daylight'..."
  color_science_grading TEXT,

  -- 5. Light Source Physics: Simulación de fuentes de luz.
  -- Ej: "Simulate Rayleigh scattering. Re-render scene with Softbox 5ft..."
  light_source_physics TEXT,

  -- 6. Volumetrics: Atmósfera y profundidad.
  -- Ej: "Inject subtle Blue Hour Mist. Separate planes with atmospheric depth."
  volumetric_atmosphere TEXT,

  -- 7. White Balance Strategy: Temperatura técnica vs. artística.
  -- Ej: "CONTEXTUAL WHITE BALANCE. Remove tint but preserve 'Golden Hour' warmth."
  white_balance_logic TEXT,

  -- 👤 META-VARIABLES DE IDENTIDAD (IDENTITY LOCK)
  face_fidelity_weight FLOAT DEFAULT 0.0, -- Peso para ip-adapter (0.0 - 1.0)
  codeformer_strength FLOAT DEFAULT 0.0,  -- Fuerza de restauración facial

  priority_weight INT DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_light_slider ON lightscaler_prompt_rules(slider_name, slider_value_min, slider_value_max);
CREATE INDEX idx_light_style ON lightscaler_prompt_rules(slider_name, style_slug);
```

---

#### 2. DML (INSERCIÓN DE DATOS DE PRODUCCIÓN)

Aquí verás cómo la tabla maneja dos bestias diferentes:

1. **El Slider "Sombras" (Forensic Recovery):** Implementa el protocolo v15 de recuperación de luz.

2. **El Selector "Lighting Style" (Author Simulation):** Implementa los estilos de grandes producciones.

#### A. SLIDER SOMBRAS (Recuperación Forense v15)

SQL

```
-- =================================================================================
-- NIVEL 1-3: MANTENIMIENTO (Luz Natural)
-- Estrategia: No tocar si no está roto.
-- =================================================================================
INSERT INTO lightscaler_prompt_rules (
  slider_name, slider_value_min, slider_value_max,
  protocol_header, zone_system_logic, dynamic_range_strategy, white_balance_logic
) VALUES (
  'sombras', 1, 3,
  '[MODE: NATURAL LIGHT FIDELITY]',
  'Preserve original contrast curve. Do not lift shadows artificially.',
  'Maintain scene linearity. No HDR tone mapping.',
  'Correct only severe color casts (green/magenta tint). Keep temperature neutral.'
);

-- =================================================================================
-- NIVEL 8-10: FORENSIC LOW-LIGHT RECOVERY (El Protocolo v15 Completo)
-- Estrategia: "Zone System" y "Blue Hour Injection" (Source 51-60, 91-105)
-- =================================================================================
INSERT INTO lightscaler_prompt_rules (
  slider_name, slider_value_min, slider_value_max,
  protocol_header,
  zone_system_logic,
  dynamic_range_strategy,
  color_science_grading,
  light_source_physics,
  volumetric_atmosphere,
  white_balance_logic
) VALUES (
  'sombras', 8, 10,

  -- Header (Source 50, 91)
  '$$[SUB-PROTOCOL: LOW-LIGHT RECOVERY & ATMOSPHERIC TONE MAPPING]. DIAGNOSIS: If input is Underexposed/Dark: DO NOT wash out the image.$$',

  -- Zone System (Source 51-53, 92-94)
  '$$ZONE SYSTEM RECOVERY: STRICTLY Anchor the Black Point at absolute zero (0,0,0). Aggressively lift Zones 1-3 (Deep Shadows) to reveal latent textures (fabric weave, brick details) currently hidden. Maintain rich, deep blacks where physically appropriate.$$',

  -- HDR Strategy (Source 54, 55, 95, 96)
  '$$CONCEPTUAL TONE MAPPING (HDR 2.0): Apply "Local Tone Mapping" to compress dynamic range intelligently. Ensure visibility in dark areas without destroying global contrast. Avoid "halo effect". Goal is "Cinematic Visibility".$$',

  -- Color Science (Source 56-58, 97-99)
  '$$BLUE HOUR AESTHETIC INJECTION: Global Ambience: Simulate "Civil Twilight" lighting physics. Ambient fill light must be cool/blue (6500K-8000K). Contrast Lighting: Force artificial sources to "Warm Tungsten" (3200K). Create Complementary Color Contrast (Teal/Orange).$$',

  -- Light Physics (Derived from v15 context)
  '$$Simulate Rayleigh scattering from upper atmosphere. Treat input as 32-bit floating-point RAW to prevent banding during exposure lift.$$',

  -- Volumetrics (Source 59, 99)
  '$$VOLUMETRICS: Inject subtle "Blue Hour Mist" in the background to separate planes and add depth.$$',

  -- White Balance (Source 26-29, 100-101)
  '$$CONTEXTUAL WHITE BALANCE: NEUTRALIZE technical color casts (sickly green fluorescent, muddy yellow) but PRESERVE ATMOSPHERIC TONE. Do not force sterile 5500K white if it destroys the mood.$$'
);
```

#### B. SLIDER IDENTITY (Bloqueo de Identidad)

SQL

```
-- =================================================================================
-- IDENTITY LOCK: STRICT (Nivel 9-10)
-- Estrategia: Preservación ósea total + Textura de piel v15
-- =================================================================================
INSERT INTO lightscaler_prompt_rules (
  slider_name, slider_value_min, slider_value_max,
  protocol_header,
  light_source_physics, -- Usamos este slot para instrucciones de piel/luz
  face_fidelity_weight,
  codeformer_strength
) VALUES (
  'identity', 9, 10,
  '[IDENTITY OVERRIDE: STRICT BONE STRUCTURE LOCK]',
  'IDENTITY PRESERVATION: The people must look like themselves, but "in Ultra High Definition". Reconstruct anatomically perfect eyes (distinct iris/pupil). Prevent "Melted" Faces. SKIN PHYSICS: Apply Subsurface Scattering to face mesh.',
  1.0, -- Max IP-Adapter
  0.9  -- Max Restoration
);
```

#### C. ESTILOS DE AUTOR (Simulando Grandes Producciones)

*Esto es nuevo y exclusivo de Lightscaler. Se activa vía selector, no slider numérico.*

SQL

```
-- =================================================================================
-- ESTILO A: "THE REMBRANDT" (Drama Clásico)
-- =================================================================================
INSERT INTO lightscaler_prompt_rules (
  slider_name, style_slug,
  protocol_header,
  light_source_physics,
  color_science_grading,
  zone_system_logic
) VALUES (
  'lighting_style', 'rembrandt_v32',
  '[LIGHTING SETUP: CLASSIC CHIAROSCURO]',
  'KEY LIGHT: Single soft source at 45-degree angle (Rembrandt Patch). FILL LIGHT: Minimal (-3 EV). BACKLIGHT: None.',
  'COLOR PALETTE: Warm, oil-painting tones. Golden hour falloff.',
  'CONTRAST RATIO: High (8:1). Allow shadows to fall into deep darkness (Zone 1).'
);

-- =================================================================================
-- ESTILO B: "NEON NOIR" (Blade Runner Aesthetic)
-- =================================================================================
INSERT INTO lightscaler_prompt_rules (
  slider_name, style_slug,
  protocol_header,
  light_source_physics,
  color_science_grading,
  volumetric_atmosphere
) VALUES (
  'lighting_style', 'neon_noir_v32',
  '[LIGHTING SETUP: CYBERPUNK ATMOSPHERE]',
  'KEY LIGHT: Harsh, colored gels (Cyan/Magenta). PRACTICAL LIGHTS: Neon signs and street lamps reflecting on wet surfaces.',
  'COLOR PALETTE: Dual-tone split lighting. Deep Blues vs Hot Pinks.',
  'VOLUMETRICS: Heavy steam, rain haze, diffusion filters (ProMist 1/4).'
);

-- =================================================================================
-- ESTILO C: "SOFT COMMERCIAL" (Alta Cosmética)
-- =================================================================================
INSERT INTO lightscaler_prompt_rules (
  slider_name, style_slug,
  protocol_header,
  light_source_physics,
  white_balance_logic,
  dynamic_range_strategy
) VALUES (
  'lighting_style', 'commercial_beauty_v32',
  '[LIGHTING SETUP: HIGH-END BEAUTY]',
  'KEY LIGHT: Large Octabox (butterfly lighting) directly above camera. FILL: White bounce cards from below (Clamshell setup).',
  'WHITE BALANCE: Perfectly neutral (5600K). Clean, sterile whites.',
  'DYNAMIC RANGE: Low contrast, high key. Lift shadows to Zone 6. No deep blacks.'
);
```

### 3. LÓGICA DE ENSAMBLAJE (SQL BUILDER)

Cuando el sistema detecta que el usuario activa **"Sombras: 10"** y selecciona el estilo **"Neon Noir"**, el builder hace dos queries y fusiona la lógica:

1. **Query 1 (Sombras=10):** Trae el "Low-Light Recovery Protocol" (Recupera la información técnica oculta).

2. **Query 2 (Style='neon_noir'):** Trae el "Cyberpunk Atmosphere" (Tiñe esa información recuperada con luces de neón).

**Orden de Inyección en Prompt Final:** `[PROTOCOL HEADER]` -> `[ZONE SYSTEM]` -> `[LIGHT PHYSICS (Author)]` -> `[COLOR SCIENCE (Author + Blue Hour)]` -> `[VOLUMETRICS]`.

De esta forma, la **Tabla 2** actúa como un director de fotografía que sabe:

1. Cómo exponer correctamente la película (Zone System).

2. Cómo iluminar artísticamente la escena (Estilos de Autor).
