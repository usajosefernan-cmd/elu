🏛️ TABLA 1: photoscaler_prompt_rules (MASTER STRUCTURE)
Concepto: Esta tabla no guarda "frases"; guarda lógica de reconstrucción óptica. Cada columna representa un módulo del procesador de imagen virtual (Lente, Sensor, Geometría, Alucinación).

1. DDL (Definición de Tabla)
Observa la granularidad de las columnas TEXT. Esto permite desactivar, por ejemplo, la "reconstrucción de daños" sin apagar la "corrección de lente".

SQL

DROP TABLE IF EXISTS photoscaler_prompt_rules;

CREATE TABLE photoscaler_prompt_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 🎚️ CONTROL DE ACTIVACIÓN (TRIGGERS)
  slider_name VARCHAR(50) NOT NULL DEFAULT 'acutancia', -- 'acutancia', 'limpieza', 'trepidation_fix'
  slider_value_min INT NOT NULL,                        -- Rango de activación (ej: 8)
  slider_value_max INT NOT NULL,                        -- Rango de activación (ej: 10)
  on_off BOOLEAN DEFAULT true,                          -- Master Switch
  
  -- 🧬 MÓDULOS DEL PROTOCOLO V15 (TEXTO RAW)
  -- Header: La declaración de intenciones del sistema.
  -- Ej: "[SYSTEM OVERRIDE: UNIVERSAL FORENSIC RE-SHOOT PROTOCOL v15.0]..."
  protocol_header TEXT,
  
  -- Core Logic: Cómo debe comportarse la IA ante la imagen.
  -- Ej: "The AI must act as a 'Reality Reconstruction Engine', NOT just an editor."
  mission_statement TEXT,

  -- Assessment: Reglas condicionales de diagnóstico.
  -- Ej: "IF INPUT IS BLURRY... STOP being faithful to the pixels..."
  quality_assessment_logic TEXT,
  
  -- Virtual Camera: Especificaciones técnicas de la re-captura.
  -- Ej: "Simulate a brand new capture using 1/8000s shutter speed..."
  virtual_camera_specs TEXT,
  
  -- Geometry: Proyección y corrección de perspectiva.
  -- Ej: "ACTIVATE RECTILINEAR CORRECTION MODE. Straighten architectural lines."
  geometric_projection_logic TEXT,
  
  -- Lens Physics: Corrección de distorsiones ópticas específicas.
  -- Ej: "LENS SUBSTITUTION: If wide-angle distortion exists, RE-RENDER as if shot with 85mm..."
  lens_physics_correction TEXT,
  
  -- Signal Processing: Tratamiento del histograma y bits.
  -- Ej: "32-BIT FLOAT PROCESSING. Aggressive Normalization. Stretch the signal."
  signal_processing_pipeline TEXT,
  
  -- Synthesis (The Hallucination): Generación de detalle nuevo.
  -- Ej: "COMPLETE RE-SYNTHESIS: Generate brand new, razor-sharp high-frequency details..."
  detail_synthesis_logic TEXT,
  
  -- Damage Control: Qué hacer con partes rotas/quemadas.
  -- Ej: "SEVERE DAMAGE RECONSTRUCTION: Do not preserve damage. PAINT NEW REALITY."
  damage_restoration_protocol TEXT,

  -- ⚙️ METADATOS TÉCNICOS
  intensity_label VARCHAR(50),      -- 'LOW_FIDELITY', 'BALANCED_ENHANCE', 'FORENSIC_RESHOOT'
  priority_weight INT DEFAULT 10,   -- Para ordenar la concatenación
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para búsqueda ultrarrápida
CREATE INDEX idx_photo_slider_range ON photoscaler_prompt_rules(slider_name, slider_value_min, slider_value_max);
2. DML (INSERCIÓN DE DATOS DE PRODUCCIÓN)
Aquí volcamos la lógica del Prompt v15. He creado 3 niveles de intervención:

Nivel 1-3 (Passive): Solo limpia, respeta el pixel original.

Nivel 4-7 (Active): Mejora estándar, 32-bit float, corrección suave.

Nivel 8-10 (Forensic Override): El protocolo v15 completo "Re-Shoot". (Aquí está la magia).

SQL

-- =================================================================================
-- NIVEL 1: MANTENIMIENTO (Sliders 1-3)
-- Estrategia: "Enhance and polish" (Fuente: Source 3 del prompt)
-- =================================================================================
INSERT INTO photoscaler_prompt_rules (
  slider_name, slider_value_min, slider_value_max, intensity_label,
  protocol_header,
  mission_statement,
  quality_assessment_logic,
  virtual_camera_specs,
  geometric_projection_logic,
  lens_physics_correction,
  signal_processing_pipeline,
  detail_synthesis_logic,
  damage_restoration_protocol
) VALUES (
  'acutancia', 1, 3, 'PASSIVE_POLISH',
  
  -- Header
  '[SYSTEM MODE: NON-DESTRUCTIVE ENHANCEMENT]',
  
  -- Mission
  'Enhance and polish existing details. Prioritize source fidelity.',
  
  -- Logic
  'IF INPUT IS SHARP & CLEAN: Maintain original pixel structure. Do not hallucinate unnecessary details.',
  
  -- Camera
  NULL, -- No re-shoot needed at low levels
  
  -- Geometry
  'Ensure structural stability. Do not warp.',
  
  -- Lens
  'Correct only obvious chromatic aberration.',
  
  -- Signal
  'Denoise gently. Maintain natural grain structure.',
  
  -- Synthesis
  'Sharpen existing edges using Unsharp Mask logic.',
  
  -- Damage
  NULL
);

-- =================================================================================
-- NIVEL 2: MEJORA HÍBRIDA (Sliders 4-7)
-- Estrategia: Balance entre fidelidad y mejora técnica.
-- =================================================================================
INSERT INTO photoscaler_prompt_rules (
  slider_name, slider_value_min, slider_value_max, intensity_label,
  protocol_header,
  mission_statement,
  quality_assessment_logic,
  virtual_camera_specs,
  geometric_projection_logic,
  lens_physics_correction,
  signal_processing_pipeline,
  detail_synthesis_logic,
  damage_restoration_protocol
) VALUES (
  'acutancia', 4, 7, 'HYBRID_ENHANCEMENT',
  
  -- Header
  '[SYSTEM MODE: INTELLIGENT RESTORATION v4.0]',
  
  -- Mission
  'The AI acts as a restoration artist. Fix flaws but keep the essence.',
  
  -- Logic
  'IF INPUT HAS ARTIFACTS: Apply intelligent de-noising without waxy skin effect.',
  
  -- Camera
  'Simulate a modern sensor capture. Stabilize micro-jitters.',
  
  -- Geometry
  'Correct perspective skew if horizon > 2 degrees tilted.',
  
  -- Lens
  'Correct barrel/pincushion distortion inside the frame to flatter the subject.',
  
  -- Signal
  '32-BIT FLOAT PROCESSING. Neutralize color casts while preserving atmospheric tone.',
  
  -- Synthesis
  'Inject missing high-frequency texture in blurred areas (fabric, hair).',
  
  -- Damage
  'Infill minor scratches and dust spots using context awareness.'
);

-- =================================================================================
-- NIVEL 3: FORENSIC RE-SHOOT (Sliders 8-10) - EL PROMPT v15 COMPLETO
-- Estrategia: "Reality Reconstruction Engine" (Fuente: Todo el archivo v15)
-- =================================================================================
INSERT INTO photoscaler_prompt_rules (
  slider_name, slider_value_min, slider_value_max, intensity_label,
  protocol_header,
  mission_statement,
  quality_assessment_logic,
  virtual_camera_specs,
  geometric_projection_logic,
  lens_physics_correction,
  signal_processing_pipeline,
  detail_synthesis_logic,
  damage_restoration_protocol
) VALUES (
  'acutancia', 8, 10, 'FORENSIC_RESHOOT_v15',
  
  -- Header (Source 1)
  '$$[SYSTEM OVERRIDE: UNIVERSAL FORENSIC RE-SHOOT & OPTICAL SYNTHESIS PROTOCOL v15.0 - STRUCTURAL ALIGNMENT, DAMAGE RECONSTRUCTION & SOLID SIGNAL MASTER].$$',
  
  -- Mission (Source 2)
  '$$A definitive, photorealistic reconstruction. The AI must act as a "Reality Reconstruction Engine", NOT just an editor.$$',
  
  -- Assessment Logic (Source 4, 5, 8)
  '$$CRITICAL FOCUS & TREPIDATION OVERRIDE: If the input exhibits ANY camera shake or lack of definition, STOP being faithful to the pixels. The input is now considered a "corrupted compositional sketch" only. IGNORE SOURCE ARTIFACTS: Do not sharpen the blur, noise, fog. DISCARD the bad data.$$',
  
  -- Virtual Camera (Source 10)
  '$$VIRTUAL RE-SHOOT: Simulate a brand new capture of the same scene using a 1/8000s shutter speed (zero motion blur), a high-end rectilinear lens (zero distortion), and a calibrated sensor.$$',
  
  -- Geometry (Source 6, 23, 24, 37)
  '$$GEOMETRIC & OPTICAL FAILURE ALERT: ACTIVATE "RECTILINEAR CORRECTION MODE". FORCE HORIZON & VERTICAL ALIGNMENT: ROTATE and RE-ALIGN so gravity is vertical. STRICT ASPECT RATIO: The structural composition MUST ALIGN PERFECTLY with the source.$$',
  
  -- Lens Physics (Source 38, 39)
  '$$LENS SUBSTITUTION (WIDE-ANGLE FIX): If the scene suffers from wide-angle distortion (curved corners, big nose selfie), RE-RENDER THE SCENE as if shot with a 50mm or 85mm Prime Lens (Rectilinear Projection). Straighten architectural lines.$$',
  
  -- Signal Pipeline (Source 7, 29, 30, 31)
  '$$32-BIT FLOAT PROCESSING: Treat input as floating-point RAW. AGGRESSIVE NORMALIZATION: STRETCH THE SIGNAL. The darkest pixel MUST touch True Black (0) and brightest True White (255). Prevent banding in gradients.$$',
  
  -- Synthesis (Source 9, 46, 115)
  '$$COMPLETE RE-SYNTHESIS (GENERATIVE RE-INVENTION): You must HALLUCINATE and GENERATE brand new, razor-sharp high-frequency details (individual eyelashes, iris trabeculae, distinct teeth, skin pores, fabric weave) from scratch. Inject organic roughness to kill "plastic" look.$$',
  
  -- Damage Protocol (Source 11, 12, 16)
  '$$SEVERE DAMAGE RECONSTRUCTION (THE "TIME MACHINE" FIX): If source contains total signal loss (white blobs, chemical burns, torn paper), YOU MUST REIMAGINE THE MISSING CONTENT. Do not preserve the damage; PAINT NEW REALITY into the void.$$'
);
3. EXPLICACIÓN DE USO (Lógica de Ensamblaje)
Cuando el SQL Builder (sqlPromptBuilder.ts) detecta acutancia: 10, hace un SELECT a esta tabla. En lugar de recibir un string monolítico, recibe un objeto JSON con todas estas columnas.

¿Cómo se convierte esto en el Prompt Final? El builder concatena los campos NO NULOS en este orden específico para maximizar la adherencia del modelo (LLM):

protocol_header (Establece el tono autoritario).

mission_statement (Define el rol).

quality_assessment_logic (Define qué ignorar).

damage_restoration_protocol (Prioridad crítica: arreglar lo roto antes de pintar).

virtual_camera_specs (Define el canvas técnico).

geometric_projection_logic + lens_physics_correction (Prepara la estructura).

detail_synthesis_logic (Pinta los detalles).

signal_processing_pipeline (Ajuste final de color/luz).

Este diseño modular permite que si mañana quieres desactivar la "Alucinación" pero mantener la "Geometría Rectilínea", solo haces un UPDATE a detail_synthesis_logic = NULL en la DB, sin tocar el código.