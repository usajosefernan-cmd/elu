# ================================================================
# LUXSCALER v41.0 - INSTRUCCIONES DE MIGRACIÓN
# ================================================================

## 🎯 OBJETIVO

Implementar el sistema modular de prompts basado en 3 tablas de Supabase:
- `photoscaler_prompt_rules` (Óptica y sensor)
- `lightscaler_prompt_rules` (Iluminación y color)
- `stylescaler_prompt_rules` (Textura y estilo)

---

## 📋 PASO 1: EJECUTAR MIGRACIONES EN SUPABASE

### Accede a tu Supabase Dashboard:

```
URL: https://uxqtxkuldjdvpnojgdsh.supabase.co
```

### En el SQL Editor, ejecuta EN ORDEN:

**1. Crear las tablas (DDL):**
```
Archivo: /app/backend/migrations/v41_prompt_tables_supabase.sql
```

Copia todo el contenido y pégalo en SQL Editor → Run

**2. Poblar con datos (DML):**
```
Archivo: /app/backend/migrations/v41_prompt_tables_data.sql
```

Copia todo el contenido y pégalo en SQL Editor → Run

---

## ✅ PASO 2: VERIFICAR TABLAS CREADAS

Ejecuta en SQL Editor:

```sql
SELECT COUNT(*) FROM photoscaler_prompt_rules;
SELECT COUNT(*) FROM lightscaler_prompt_rules;
SELECT COUNT(*) FROM stylescaler_prompt_rules;
```

**Debes ver:**
- photoscaler_prompt_rules: 3 filas
- lightscaler_prompt_rules: 5 filas  
- stylescaler_prompt_rules: 3 filas

---

## 🔧 PASO 3: ACTUALIZAR BACKEND

Una vez creadas las tablas, el backend usará el nuevo servicio:

```python
# /app/backend/services/sql_prompt_builder.py

# En vez de hardcodear prompts:
prompt_text = "FORCE this style..."  ❌

# Ahora consulta Supabase:
rule = await sql_prompt_builder.get_photoscaler_rules('limpieza_artefactos', 9)
prompt_text = assemble_block(rule)  ✅
```

---

## 🎨 VENTAJAS DEL NUEVO SISTEMA

### 1. Control Granular
```
Antes: Cambiar prompt requiere editar código
Ahora: UPDATE en Supabase cambia comportamiento
```

### 2. Separación Modular
```
photoscaler_prompt_rules:
  ├─ protocol_header
  ├─ mission_statement
  ├─ quality_assessment_logic
  ├─ virtual_camera_specs
  ├─ geometric_projection_logic
  ├─ lens_physics_correction
  ├─ signal_processing_pipeline
  ├─ detail_synthesis_logic
  └─ damage_restoration_protocol

Puedes desactivar solo "damage_restoration" sin tocar el resto:
UPDATE SET damage_restoration_protocol = NULL WHERE id = '...'
```

### 3. Estilos de Autor
```
Antes: Hardcoded en código
Ahora: Tabla con presets ('rembrandt_v32', 'neon_noir_v32', etc.)

Añadir nuevo estilo:
INSERT INTO lightscaler_prompt_rules (
  slider_name, style_slug,
  protocol_header,
  light_source_physics,
  ...
) VALUES ('lighting_style', 'nuevo_estilo', ...)
```

### 4. Parámetros de IA Dinámicos
```
stylescaler_prompt_rules incluye:
- guidance_scale: Qué tan literal es la IA
- hallucination_density: Creatividad permitida

Nivel 1-3: guidance=5.0, hallucination=0.1 (conservador)
Nivel 8-10: guidance=12.0, hallucination=0.8 (creativo)
```

---

## 📊 ESTRUCTURA DE DATOS

### Ejemplo de fila en photoscaler_prompt_rules:

```json
{
  "id": "uuid",
  "slider_name": "limpieza_artefactos",
  "slider_value_min": 8,
  "slider_value_max": 10,
  "intensity_label": "FORENSIC_RESHOOT_v15",
  "protocol_header": "[SYSTEM OVERRIDE: FORENSIC RE-SHOOT...]",
  "mission_statement": "Reality Reconstruction Engine...",
  "quality_assessment_logic": "IGNORE SOURCE ARTIFACTS...",
  "virtual_camera_specs": "Simulate 1/8000s shutter...",
  "detail_synthesis_logic": "HALLUCINATE razor-sharp details...",
  "priority_weight": 30
}
```

---

## 🔄 FLUJO DEL SISTEMA

```
1. Usuario ajusta slider: limpieza_artefactos = 9
         ↓
2. Backend consulta Supabase:
   SELECT * FROM photoscaler_prompt_rules 
   WHERE slider_name = 'limpieza_artefactos'
   AND slider_value_min <= 9 
   AND slider_value_max >= 9
         ↓
3. Obtiene regla con todos los módulos
         ↓
4. Ensambla bloques en orden:
   protocol_header →
   mission_statement →
   quality_assessment_logic →
   damage_restoration_protocol →
   virtual_camera_specs →
   geometric_projection_logic →
   detail_synthesis_logic →
   signal_processing_pipeline
         ↓
5. Inyecta en system prompt final
         ↓
6. Envía a Gemini
```

---

## 🧪 TESTING

Una vez ejecutadas las migraciones, prueba:

```bash
cd /app/backend
python -c "
import asyncio
import sys
sys.path.insert(0, '/app/backend')
from services.sql_prompt_builder import sql_prompt_builder

async def test():
    config = {
        'photoscaler': {'limpieza_artefactos': 9},
        'lightscaler': {'sombras': 9},
        'stylescaler': {'styling_piel': 8}
    }
    result = await sql_prompt_builder.build_prompt_from_sliders(config, has_person=True)
    print(f'✅ Rules loaded from Supabase:')
    print(f'   Photoscaler: {result[\"metadata\"][\"photoscaler_rules_count\"]} rules')
    print(f'   Lightscaler: {result[\"metadata\"][\"lightscaler_rules_count\"]} rules')
    print(f'   Stylescaler: {result[\"metadata\"][\"stylescaler_rules_count\"]} rules')
    print(f'   Guidance: {result[\"guidance_scale\"]}')

asyncio.run(test())
"
```

---

## 📚 ARCHIVOS CREADOS

```
✅ /app/backend/migrations/v41_prompt_tables_supabase.sql
   - DDL: Crea las 3 tablas

✅ /app/backend/migrations/v41_prompt_tables_data.sql
   - DML: Puebla con datos iniciales

✅ /app/backend/services/sql_prompt_builder.py
   - Servicio que consulta y ensambla prompts

✅ /app/backend/migrations/run_migration_v41.py
   - Runner de migración
```

---

## 🚀 PRÓXIMOS PASOS

1. **TÚ ejecutas SQL en Supabase** (yo no tengo conectividad)
2. Verificar que las tablas existen
3. Integrar `sql_prompt_builder` en el flujo de generación
4. Testear con diferentes combinaciones de sliders
5. Ajustar reglas directamente en Supabase según necesites

---

## 💡 BENEFICIOS

✅ **Flexibilidad:** Cambiar comportamiento sin tocar código
✅ **Modularidad:** Desactivar módulos específicos
✅ **Escalabilidad:** Añadir nuevos estilos fácilmente
✅ **A/B Testing:** Comparar diferentes versiones de prompts
✅ **Versionado:** Mantener múltiples versiones de reglas

---

**¡El sistema modular de prompts está listo para implementar!** 🎉
