### 🏛️ TABLA 5: `vision_trigger_overrides` (MASTER STRUCTURE)

**Responsabilidad:** Traducir el diagnóstico JSON (`ForensicBlueprint`) en acciones SQL ejecutables (`FORCE_SLIDER`, `ENABLE_RULE`).

#### 1. DDL (Definición de Tabla)

He diseñado esta tabla para que sea un **Router Lógico**. Mapea una ruta JSON específica (ej: `technical_audit.signal`) a una acción de base de datos específica.

SQL

```
DROP TABLE IF EXISTS vision_trigger_overrides;

CREATE TABLE vision_trigger_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 👁️ INPUT: EL DISPARADOR (JSON PATTERN MATCHING)
  -- El sistema busca esta combinación exacta en el ForensicBlueprint.json
  json_category VARCHAR(50) NOT NULL,     -- Ej: 'technical_audit', 'classification'
  json_key VARCHAR(50) NOT NULL,          -- Ej: 'signal', 'distortion', 'primary'
  json_value_match VARCHAR(100) NOT NULL, -- Ej: 'Underexposed_Clipped_Shadows', 'HUMAN'

  -- ⚡ OUTPUT: LA ACCIÓN (SQL COMMAND)
  target_table VARCHAR(50) NOT NULL,      -- 'photoscaler_prompt_rules', 'lightscaler_prompt_rules'

  -- Tipos de Acción:
  -- 'SET_SLIDER_MIN': Sube el slider a X si el usuario lo tiene bajo.
  -- 'FORCE_SLIDER_EXACT': Clava el slider en X (override total).
  -- 'ACTIVATE_HIDDEN_RULE': Activa una regla específica (ej: corrección de lente) sin mover sliders.
  action_type VARCHAR(50) NOT NULL,

  -- Parámetros de Ejecución
  forced_slider_value INT,                -- El valor numérico a imponer (1-10)
  forced_style_slug VARCHAR(50),          -- Si la acción fuerza un estilo ('rembrandt')

  -- 🛡️ PRIORIDAD Y CONTROL
  override_priority INT DEFAULT 10,       -- 10 = Standard, 20 = Critical (Safety)
  is_active BOOLEAN DEFAULT true,
  description VARCHAR(255),               -- Explicación para el log de auditoría

  created_at TIMESTAMP DEFAULT NOW()
);

-- Índice compuesto para búsqueda instantánea durante el análisis del JSON
CREATE INDEX idx_vision_match ON vision_trigger_overrides(json_category, json_key, json_value_match);
```

---

#### 2. DML (INSERCIÓN DE LÓGICA FORENSE v15)

Aquí programamos la **Inteligencia Reactiva**. Estos son los "reflejos" del sistema.

#### A. CASO CRÍTICO: FOTO SUBEXPUESTA (The Zone System Trigger)

*Fuente: Prompt v15 [Source 50-53, 91-94] "If input is Underexposed... Aggressively lift Zones 1-3".*

SQL

```
-- Si EdgeVision dice "Underexposed", forzamos el slider SOMBRAS a mínimo 9.
INSERT INTO vision_trigger_overrides (
  json_category, json_key, json_value_match,
  target_table, action_type, forced_slider_value,
  override_priority, description
) VALUES (
  'technical_audit', 'signal', 'Underexposed_Clipped_Shadows',
  'lightscaler_prompt_rules', 'SET_SLIDER_MIN', 9, -- Fuerza protocolo Zone System
  20, -- Prioridad Alta
  'CRITICAL: Input is dark. Force Lightscaler to Level 9 (Zone System Recovery) to prevent black crush.'
);
```

#### B. CASO CRÍTICO: FOTO MOVIDA / BORROSA (The Trepidation Trigger)

*Fuente: Prompt v15 [Source 4, 5, 69, 70] "If input exhibits ANY camera shake... STOP being faithful".*

SQL

```
-- Si EdgeVision detecta "Motion Blur", forzamos ACUTANCIA a 10 (Forensic Re-shoot).
-- Esto activa la "Virtual Camera 1/8000s" y descarta los pixeles originales.
INSERT INTO vision_trigger_overrides (
  json_category, json_key, json_value_match,
  target_table, action_type, forced_slider_value,
  override_priority, description
) VALUES (
  'restoration_priority', 'damage_detected', 'Motion_Blur',
  'photoscaler_prompt_rules', 'SET_SLIDER_MIN', 10, -- Fuerza Forensic Re-shoot
  20,
  'CRITICAL: Trepidation detected. Force Photoscaler to Level 10 (Virtual Re-shoot) to kill blur.'
);
```

#### C. CASO GEOMÉTRICO: DISTORSIÓN DE LENTE (The Rectilinear Trigger)

*Fuente: Prompt v15 [Source 6, 71, 38] "If input has barrel distortion... ACTIVATE RECTILINEAR CORRECTION".*

SQL

```
-- Si EdgeVision detecta "Barrel Distortion" (Ojo de pez/GoPro), activamos corrección geométrica.
-- Nota: Aquí usamos SET_SLIDER_MIN a 8, donde vive la lógica de "Lens Substitution".
INSERT INTO vision_trigger_overrides (
  json_category, json_key, json_value_match,
  target_table, action_type, forced_slider_value,
  override_priority, description
) VALUES (
  'technical_audit', 'distortion', 'Minor_Barrel',
  'photoscaler_prompt_rules', 'SET_SLIDER_MIN', 8,
  15,
  'GEOMETRY: Barrel distortion detected. Force Rectilinear Correction logic.'
);
```

#### D. CASO SEMÁNTICO: RETRATO HUMANO (The Identity Trigger)

*Fuente: Prompt v15 [Source 17-19, 82-84] "You MUST apply Portrait-Level attention... Prevent Melted Faces".*

SQL

```
-- Si la foto es de una PERSONA, aseguramos que el Identity Lock no esté apagado.
-- Forzamos un mínimo de seguridad para evitar caras deformes.
INSERT INTO vision_trigger_overrides (
  json_category, json_key, json_value_match,
  target_table, action_type, forced_slider_value,
  override_priority, description
) VALUES (
  'classification', 'primary', 'HUMAN',
  'lightscaler_prompt_rules', 'SET_SLIDER_MIN', 7, -- Activa "Preserve Characteristics"
  10,
  'CONTEXT: Human subject detected. Ensure Identity Lock is at least Level 7 to prevent melted faces.'
);
```

#### E. CASO DE MATERIAL: COMIDA (The Appetizing Trigger)

*Lógica específica para Food Porn: necesita brillo y textura, no corrección geométrica agresiva.*

SQL

```
-- Si es COMIDA, priorizamos Stylescaler (Textura) sobre Photoscaler.
INSERT INTO vision_trigger_overrides (
  json_category, json_key, json_value_match,
  target_table, action_type, forced_slider_value,
  override_priority, description
) VALUES (
  'classification', 'primary', 'FOOD',
  'stylescaler_prompt_rules', 'SET_SLIDER_MIN', 8, -- Activa "Massive Texture Injection"
  10,
  'CONTEXT: Food photography. Force high texture detail for appetizing look.'
);
```

---

### 3. EXPLICACIÓN DE LA LÓGICA DE EJECUCIÓN (EL PILOTO AUTOMÁTICO)

**Escenario Real:** El usuario sube una selfie oscura y movida tomada en una fiesta.

1. **Input Usuario:** `Acutancia: 5` (Usuario optimista, cree que la foto está "bien").

2. **EdgeVision Analysis:**
   
   - `technical_audit.signal`: "Underexposed"
   
   - `restoration_priority.damage_detected`: "Motion_Blur"

3. **Consulta a Tabla 5 (Overrides):**
   
   - Match 1 ("Underexposed"): → `Action: LIGHTSCALER SET_MIN 9`.
   
   - Match 2 ("Motion_Blur"): → `Action: PHOTOSCALER SET_MIN 10`.

4. **Resultado ("Effective Sliders"):**
   
   - El sistema ignora el 5 del usuario.
   
   - Ejecuta la generación con **Acutancia 10** y **Sombras 9**.

5. **Feedback al Usuario (UI):**
   
   - En la interfaz, los sliders se mueven solos y aparece un aviso: *"⚠️ Sistema Forense Activado: Se detectó oscuridad severa y movimiento. Valores ajustados automáticamente para reconstrucción v15."*

Esta tabla es lo que diferencia a NanoBananaPro de un editor tonto. **El sistema sabe más que el usuario.**
