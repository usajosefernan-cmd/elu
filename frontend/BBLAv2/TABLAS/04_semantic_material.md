### 🏛️ TABLA 4: `semantic_material_rules` (MASTER STRUCTURE)

**Responsabilidad:** Asignación de propiedades físicas (PBR) basadas en la segmentación semántica de EdgeVision.

#### 1. DDL (Definición de Tabla)

He añadido columnas específicas para el **Modelo de Reflexión** y **Restricciones Negativas**, ya que el v15 es muy estricto sobre lo que *no* debe parecer un material (ej: "plastic skin", "wax skin").

SQL

```
DROP TABLE IF EXISTS semantic_material_rules;

CREATE TABLE semantic_material_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 👁️ TRIGGER (INPUT DE EDGEVISION)
  material_tag VARCHAR(50) NOT NULL,      -- 'SKIN', 'IRIS', 'FABRIC', 'METAL', 'FOOD'
  detected_attribute VARCHAR(50),         -- Variantes: 'WET', 'DRY', 'SILK', 'WOOL', 'RUST'

  -- ⚛️ MOTOR DE FÍSICA (PROMPT PBR)

  -- 1. Physics & Interaction: Cómo la luz penetra o rebota.
  -- Ej: "Subsurface Scattering (SSS) strength 1.0. Epidermal translucency enabled."
  physics_logic_prompt TEXT,

  -- 2. Surface Micro-Detail: La textura táctil (Bump Map).
  -- Ej: "Hallucinate pores, vellus hair (peach fuzz), organic imperfections."
  surface_texture_prompt TEXT,

  -- 3. Reflection Model: Palabras clave técnicas para el renderizador neuronal.
  -- Ej: "Anisotropic reflection, GGX Specular, Fresnel effect."
  reflection_model_prompt TEXT,

  -- 4. Negative Material Constraints: Lo que este material NO debe ser.
  -- Ej: "No plastic, no wax, no smooth blur, no overly polished."
  negative_material_prompt TEXT,

  -- ⚙️ CONFIGURACIÓN
  priority_weight INT DEFAULT 5,          -- 10 = Override total sobre el estilo global
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índice para búsqueda rápida por tag (lo que hace el loop de EdgeVision)
CREATE INDEX idx_material_tag ON semantic_material_rules(material_tag, detected_attribute);
```

---

#### 2. DML (INSERCIÓN DE DATOS DE PRODUCCIÓN)

Estos datos implementan las reglas del v15 sobre **"Organic Roughness"** , **"Iris Trabeculae"** y la prohibición de **"Plastic Skin"**.

#### A. PIEL HUMANA (El Santo Grial)

*Si EdgeVision detecta `class: HUMAN`, inyectamos esto.*

SQL

```
-- =================================================================================
-- MATERIAL: SKIN (Generic/Human)
-- Lógica v15: Matar el look "plástico" usando SSS y Vellus Hair.
-- =================================================================================
INSERT INTO semantic_material_rules (
  material_tag, detected_attribute,
  physics_logic_prompt,
  surface_texture_prompt,
  reflection_model_prompt,
  negative_material_prompt
) VALUES (
  'SKIN', 'DEFAULT',

  -- Physics (SSS)
  '$$SUBSURFACE SCATTERING (SSS) ENABLED: Simulate light penetrating the epidermis to create a fleshy, organic warm glow. Skin must behave like translucent tissue, NOT opaque plastic.$$',

  -- Texture (Source 46, 115)
  '$$ORGANIC MICRO-DETAIL: Hallucinate visible skin pores, fine wrinkles, and VELLUS HAIR (peach fuzz) on cheeks/jawline. Skin texture must have irregular, organic roughness.$$',

  -- Reflection
  '$$SPECULARITY: Natural skin oils reflection. Dual-layer specular lobe (oily T-zone vs matte cheek).$$',

  -- Negative (Source 48, 117)
  '$$plastic skin, wax skin, airbrushed skin, blurred pores, smooth porcelain doll effect, overly polished, makeup caking.$$'
);
```

#### B. OJOS / IRIS (Fidelidad Biométrica)

*Crítico para primeros planos (Source 19, 74).*

SQL

```
-- =================================================================================
-- MATERIAL: IRIS (Ojos)
-- Lógica v15: Estructura fibrosa y humedad.
-- =================================================================================
INSERT INTO semantic_material_rules (
  material_tag, detected_attribute,
  physics_logic_prompt,
  surface_texture_prompt,
  reflection_model_prompt,
  negative_material_prompt
) VALUES (
  'IRIS', 'DEFAULT',

  -- Physics
  '$$CORNEAL REFRACTION: Simulate the clear dome of the cornea with distinct specular highlights (catchlights).$$',

  -- Texture (Source 19, 74)
  '$$IRIS TRABECULAE: Generate high-definition fibrous patterns inside the iris. Distinct separation between pupil and iris. No smudging.$$',

  -- Reflection
  '$$WET SURFACE PHYSICS: The eye must look wet/hydrated. Sharp, hard reflections of light sources.$$',

  -- Negative (Source 48)
  '$$dead eyes, dull eyes, blurry iris, merged pupil, illustration style eyes, anime eyes.$$'
);
```

#### C. TELAS Y ROPA (Reconstrucción de Tejido)

*Si la IA ve ropa, debe saber si es seda o lana.*

SQL

```
-- =================================================================================
-- MATERIAL: FABRIC (Seda/Satén)
-- Lógica: Anisotropía (brillo cambia con el ángulo).
-- =================================================================================
INSERT INTO semantic_material_rules (
  material_tag, detected_attribute,
  physics_logic_prompt,
  surface_texture_prompt,
  reflection_model_prompt,
  negative_material_prompt
) VALUES (
  'FABRIC', 'SILK',
  '$$ANISOTROPIC SHEEN: Fabric interacts with light directionally. Soft, flowing highlights.$$',
  '$$MICRO-WEAVE: Ultra-fine thread count. Smooth but with visible woven structure at macro zoom.$$',
  '$$Velvet/Satin Shader logic.$$',
  '$$rough fabric, denim texture, wool texture, noisy pattern.$$'
);

-- =================================================================================
-- MATERIAL: FABRIC (Lana/Algodón)
-- Lógica: Rugosidad y fibras sueltas.
-- =================================================================================
INSERT INTO semantic_material_rules (
  material_tag, detected_attribute,
  physics_logic_prompt,
  surface_texture_prompt,
  reflection_model_prompt,
  negative_material_prompt
) VALUES (
  'FABRIC', 'WOOL',
  '$$LIGHT ABSORPTION: Matte surface with high roughness. No specular highlights.$$',
  '$$FIBER FRAYING: Visible loose threads and fuzz at edges. Coarse weave pattern reconstruction.$$',
  '$$Lambertian Diffuse Model.$$',
  '$$shiny plastic clothes, wet look fabric, smooth texture.$$'
);
```

#### D. METALES / PRODUCTO (Hard Surface)

*Para la categoría PRODUCT.*

SQL

```
-- =================================================================================
-- MATERIAL: METAL (Oro/Plata/Cromo)
-- Lógica: Micro-rayaduras y reflejos HDRI.
-- =================================================================================
INSERT INTO semantic_material_rules (
  material_tag, detected_attribute,
  physics_logic_prompt,
  surface_texture_prompt,
  reflection_model_prompt,
  negative_material_prompt
) VALUES (
  'METAL', 'POLISHED',
  '$$CONDUCTIVE MATERIAL: Colored reflections (for Gold/Copper) or uncolored (Chrome). High reflectivity.$$',
  '$$MICRO-SCRATCHES: Imperceptible surface scratches to break digital perfection. Realistic patina.$$',
  '$$GGX METALLIC: Sharp reflections. Fresnel edge brightening.$$',
  '$$diffuse grey, plastic looking metal, matte finish.$$'
);
```

---

### 3. EXPLICACIÓN DE FUNCIONAMIENTO (LOGIC BRIDGE)

**El problema:** Si pones `Acutancia: 10` y `Detalle: 10`, la IA intenta hacerlo todo nítido. Pero la piel humana **NO** es nítida de la misma manera que el metal. La piel dispersa la luz (es suave), el metal la rebota (es duro).

**La Solución (Tabla 4):** Cuando EdgeVision envía el mapa: `[{"type": "SKIN"}, {"type": "METAL"}]`, el SQL Builder inyecta estos prompts **después** de los prompts globales.

- Para los pixeles de **METAL**, aplica `GGX Metallic`.

- Para los pixeles de **PIEL**, aplica `Subsurface Scattering`.

Esto permite que el "Forensic Re-shoot" del v15 sea agresivo con los detalles (pestañas, poros) pero suave con la luz (piel orgánica), cumpliendo la regla v15: *"Hallucinate organic roughness... to kill plastic look"*.
