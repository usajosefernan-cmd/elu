---

### 🏛️ TABLA 7: `prompt_audit_log` (INFRAESTRUCTURA COMPLETA)

**Nota para el Programador:** Esta tabla no lleva `INSERT INTO` de datos iniciales. Se llena sola. Lo que necesitas ejecutar es la **Estructura** y los **Disparadores (Triggers)** que vigilan a las otras 6 tablas.

#### 1. ESTRUCTURA (DDL)

SQL

```
DROP TRIGGER IF EXISTS audit_photoscaler_changes ON photoscaler_prompt_rules;
DROP TRIGGER IF EXISTS audit_lightscaler_changes ON lightscaler_prompt_rules;
DROP TRIGGER IF EXISTS audit_stylescaler_changes ON stylescaler_prompt_rules;
DROP TRIGGER IF EXISTS audit_semantic_changes ON semantic_material_rules;
DROP TRIGGER IF EXISTS audit_vision_changes ON vision_trigger_overrides;
DROP TRIGGER IF EXISTS audit_global_changes ON global_prompt_config;
DROP FUNCTION IF EXISTS log_prompt_changes();
DROP TABLE IF EXISTS prompt_audit_log;

CREATE TABLE prompt_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 📍 QUÉ SE TOCÓ
  table_name VARCHAR(50) NOT NULL,
  record_id UUID NOT NULL,
  operation VARCHAR(10) NOT NULL,         -- 'INSERT', 'UPDATE', 'DELETE'

  -- 🔍 EVIDENCIA FORENSE (JSON BINARIO)
  old_values JSONB,                       -- El registro ANTES del cambio
  new_values JSONB,                       -- El registro DESPUÉS del cambio

  -- 👤 RESPONSABILIDAD
  changed_by VARCHAR(100) DEFAULT auth.uid()::text, -- Captura ID de Supabase Auth
  change_reason TEXT,                     -- Opcional: Justificación del cambio
  client_info JSONB,                      -- IP o User Agent si disponible

  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para búsqueda rápida en logs masivos
CREATE INDEX idx_audit_table_record ON prompt_audit_log(table_name, record_id);
CREATE INDEX idx_audit_created_at ON prompt_audit_log(created_at DESC);
CREATE INDEX idx_audit_changed_by ON prompt_audit_log(changed_by);
```

#### 2. LA INTELIGENCIA (FUNCTION)

SQL

```
CREATE OR REPLACE FUNCTION log_prompt_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO prompt_audit_log (
    table_name,
    record_id,
    operation,
    old_values,
    new_values,
    changed_by
  )
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
    current_user -- O auth.uid() si estás en entorno autenticado
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 3. CONEXIÓN NEURAL (LOS 6 TRIGGERS)

*Aquí está la parte que faltaba. Copia y pega todo este bloque para activar la vigilancia en todo el sistema v15.*

SQL

```
-- 1. VIGILANCIA DE PHOTOSCALER
CREATE TRIGGER audit_photoscaler_changes
AFTER INSERT OR UPDATE OR DELETE ON photoscaler_prompt_rules
FOR EACH ROW EXECUTE FUNCTION log_prompt_changes();

-- 2. VIGILANCIA DE LIGHTSCALER
CREATE TRIGGER audit_lightscaler_changes
AFTER INSERT OR UPDATE OR DELETE ON lightscaler_prompt_rules
FOR EACH ROW EXECUTE FUNCTION log_prompt_changes();

-- 3. VIGILANCIA DE STYLESCALER
CREATE TRIGGER audit_stylescaler_changes
AFTER INSERT OR UPDATE OR DELETE ON stylescaler_prompt_rules
FOR EACH ROW EXECUTE FUNCTION log_prompt_changes();

-- 4. VIGILANCIA DE MATERIALES (SEMANTIC)
CREATE TRIGGER audit_semantic_changes
AFTER INSERT OR UPDATE OR DELETE ON semantic_material_rules
FOR EACH ROW EXECUTE FUNCTION log_prompt_changes();

-- 5. VIGILANCIA DE VISION TRIGGERS (OVERRIDES)
CREATE TRIGGER audit_vision_changes
AFTER INSERT OR UPDATE OR DELETE ON vision_trigger_overrides
FOR EACH ROW EXECUTE FUNCTION log_prompt_changes();

-- 6. VIGILANCIA DE GLOBAL CONFIG
CREATE TRIGGER audit_global_changes
AFTER INSERT OR UPDATE OR DELETE ON global_prompt_config
FOR EACH ROW EXECUTE FUNCTION log_prompt_changes();
```

---

### 📝 NOTA FINAL PARA EL PROGRAMADOR

Ahora sí es "completa".

- Las Tablas 1-6 definen **CÓMO SE GENERA** la imagen (Configuración).

- La Tabla 7 define **CÓMO SE PROTEGE** el sistema (Auditoría).

Con este script ejecutado, si alguien borra accidentalmente la regla de "Forensic Re-shoot", tendrás un registro exacto en `prompt_audit_log` con el JSON completo de lo que se borró (`old_values`), permitiéndote restaurarlo en segundos. Sin esto, un `DELETE` accidental es fatal.
