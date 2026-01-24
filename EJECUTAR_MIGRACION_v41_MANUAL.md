# ================================================================
# 🚀 INSTRUCCIONES PARA IMPLEMENTAR v41 EN SUPABASE
# ================================================================

## ⚠️ IMPORTANTE

El contenedor de desarrollo NO tiene conectividad directa con tu Supabase.
Por eso, TÚ debes ejecutar estos scripts en el Supabase SQL Editor.

---

## 📋 PASO A PASO (5 minutos)

### 1️⃣ Accede a tu Supabase Dashboard

```
URL: https://uxqtxkuldjdvpnojgdsh.supabase.co
```

Login con tus credenciales de Supabase.

---

### 2️⃣ Abre SQL Editor

En el menú lateral:
```
SQL Editor → New Query
```

---

### 3️⃣ Ejecuta el DDL (Crear Tablas)

**Copia TODO el contenido de este archivo:**
```
/app/backend/migrations/v41_prompt_tables_supabase.sql
```

**Pégalo en el SQL Editor y presiona RUN**

Deberías ver:
```
✅ Success. No rows returned.
```

Esto crea 3 tablas:
- `photoscaler_prompt_rules`
- `lightscaler_prompt_rules`
- `stylescaler_prompt_rules`

---

### 4️⃣ Ejecuta el DML (Insertar Datos)

**Copia TODO el contenido de este archivo:**
```
/app/backend/migrations/v41_prompt_tables_data.sql
```

**Pégalo en el SQL Editor y presiona RUN**

Deberías ver:
```
✅ Success. Rows inserted: 11
```

Esto inserta las reglas de prompts iniciales.

---

### 5️⃣ Verifica que Todo Funcione

**Ejecuta este query en SQL Editor:**

```sql
-- Verificar tablas
SELECT COUNT(*) as photoscaler_rules FROM photoscaler_prompt_rules;
SELECT COUNT(*) as lightscaler_rules FROM lightscaler_prompt_rules;
SELECT COUNT(*) as stylescaler_rules FROM stylescaler_prompt_rules;

-- Ver algunas reglas
SELECT slider_name, slider_value_min, slider_value_max, intensity_label 
FROM photoscaler_prompt_rules;

SELECT slider_name, style_slug 
FROM lightscaler_prompt_rules;
```

**Resultado esperado:**
```
photoscaler_rules: 3
lightscaler_rules: 5
stylescaler_rules: 3
```

---

## ✅ CONFIRMACIÓN

Una vez ejecutados los 2 archivos SQL, responde aquí:

```
"✅ Migración ejecutada"
```

Y yo continuaré integrando el sistema en el backend.

---

## 📁 ARCHIVOS A EJECUTAR (EN ORDEN)

```
1. /app/backend/migrations/v41_prompt_tables_supabase.sql
   → Crea las 3 tablas

2. /app/backend/migrations/v41_prompt_tables_data.sql
   → Inserta 11 reglas iniciales
```

---

## 🆘 SI HAY PROBLEMAS

**Error: "permission denied"**
→ Asegúrate de usar una cuenta con permisos de admin en Supabase

**Error: "table already exists"**
→ Las tablas ya fueron creadas, solo ejecuta el archivo de datos (paso 4)

**Error: "syntax error"**
→ Asegúrate de copiar TODO el archivo, incluyendo comentarios

---

## 💡 QUÉ SUCEDERÁ DESPUÉS

Una vez creadas las tablas, el backend:

1. **Consultará Supabase** en vez de usar prompts hardcodeados
2. **Ensamblará prompts dinámicamente** según sliders activos
3. **Permitirá cambiar comportamiento** sin tocar código
4. **Soportará A/B testing** de diferentes versiones de prompts

---

## 🎯 BENEFICIOS

✅ **Flexibilidad:** Cambiar prompts editando la DB
✅ **Modularidad:** Desactivar módulos específicos (ej: damage_restoration)
✅ **Escalabilidad:** Añadir nuevos estilos de iluminación fácilmente
✅ **Versionado:** Mantener múltiples versiones de reglas
✅ **Sin deployments:** Cambios en DB son instantáneos

---

**¿Listo para ejecutar?** Ve a Supabase y ejecuta los 2 archivos SQL 🚀
