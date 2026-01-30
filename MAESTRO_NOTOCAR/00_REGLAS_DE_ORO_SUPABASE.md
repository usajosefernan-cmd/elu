# REGLA DE ORO: SINCRONIZACIÓN SUPABASE-CÓDIGO (Protocolo de Paridad 100%)

## 1. LA VERDAD ESTÁ EN LA BASE DE DATOS (Single Source of Truth)
*   **Axioma**: El esquema SQL de Supabase (tablas, columnas, tipos) es la **única autoridad**.
*   **Consecuencia**: El código Frontend es solo un "visor" o "reflejo" de la base de datos.
*   **Regla**: Si un dato no tiene columna en SQL, **no puede existir** en el estado de la aplicación (`zustand`) ni en la UI.

## 2. PROTOCOLO DE MODIFICACIÓN DUAL (Dual-Mod)
Para cualquier feature o cambio, debes operar en **dos frentes simultáneamente**:

### FRENTE A (Backend/DB)
1.  Modificar `MAESTRO_NOTOCAR/01luxv41sql.md`.
2.  Ejecutar la migración SQL en Supabase.
3.  Actualizar la Edge Function correspondiente (`vision-orchestrator`, `generate-image`).

### FRENTE B (Frontend/Code)
4.  Actualizar interfaces TypeScript (`types.ts`).
5.  Actualizar el Store (`imageStore.ts`).
6.  Actualizar componentes UI.

**PROHIBIDO**: Escribir código Frontend "esperando" que el Backend se adapte después. El Backend lidera, el Frontend sigue.

## 3. CHEQUEO DE INTEGRIDAD CONSTANTE
*   Antes de escribir una sola línea de React, **lee** la definición de la tabla SQL.
*   Si añades un slider, verifica que existe en `slider_definitions`.
*   Si añades un modo de usuario, verifica que existe en `tier_config`.

## 4. DEBUGGING POR DESINCRONIZACIÓN
*   Si ves un error `undefined`, `null` o fallo de renderizado, asume inmediatamente que **el código local difiere de Supabase**.
*   **Solución**: Revisa el esquema SQL real vs tus Tipos.

---
*Copia este archivo en `.agent/rules/SUPABASE_SYNC.md` o añádelo a tu Prompt de Sistema.*
