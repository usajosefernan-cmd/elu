# PROTOCOLO SUPABASE (AGENTIC MCP & NO-DOCKER)

> **ESTADO:** ACTIVO (GOLD STANDARD)
> **OBJETIVO:** Gestión 100% Cloud-Direct de Supabase. Cero dependencia de Docker local.
> **HERRAMIENTA:** `fast_sync.ps1` (Centro de Comando).

---

## 1. REGLA SUPREMA: NO-DOCKER ("CLOUD DIRECT")

**PROHIBIDO:** Usar `supabase start`, `db drive`, o cualquier comando que requiera Docker Desktop.
**OBLIGATORIO:** Operar directamente contra el Proyecto en la Nube (`pjscnzymofaijevonxkm`).

**¿Por qué?**

1. **Memoria:** Ahorramos 4GB+ de RAM al no correr contenedores.
2. **Estabilidad:** Eliminamos problemas de "Zombie Ports" y conflictos de red WSL.
3. **Realidad:** Lo que pruebas es lo que el usuario final ve.

---

## 2. CENTRO DE COMANDO: `fast_sync.ps1`

Toda operación debe pasar por el script unificado. No ejecutes scripts sueltos si no es necesario.

**Comando:**

```powershell
.\scripts\fast_sync.ps1
```

**Menú de Operaciones:**

| Opción | Acción | Descripción |
| :--- | :--- | :--- |
| **1. Apply SQL Migration** | `DML/DDL` | Sube cambios de estructura BD via Túnel Seguro. |
| **2. Deploy Edge Function** | `Backend` | Despliega lógica TypeScript a la red global. |
| **3. Set Environment Secrets** | `Config` | Inyecta API Keys (Gemini, Stripe) en producción. |
| **4. Sync TypeScript Types** | `Frontend` | Actualiza `database.types.ts` para Intellisense. |
| **5. Get Edge Function Logs** | `Debug` | Trae logs reales de ejecución en la nube. |

---

## 3. WORKFLOW DE DESARROLLO (Paso a Paso)

### PASO A: Desarrollo Frontend

* Ejecuta `npm run dev`.
* El frontend (Vite) se conecta directo a Supabase Cloud con las Keys de `.env`.

### PASO B: Cambios en Base de Datos

1. Crea tu archivo `.sql` en `supabase/migrations`.
2. **IMPORTANTE:** Guardar como **UTF-8 SIN BOM**.
3. Ejecuta `fast_sync.ps1` -> **Opción 1**.

### PASO C: Backend (Edge Functions)

1. Edita código en `supabase/functions/`.
2. Ejecuta `fast_sync.ps1` -> **Opción 2**.
3. *Tip:* Si la función usa nuevas variables, usa la **Opción 3** para setearlas.

---

## 4. DETALLES TÉCNICOS CRÍTICOS

### 4.1 Migration Tunnel (`migration-runner`)

* No usamos conexión directa psql (puerto 5432 bloqueado a veces).
* Usamos una Edge Function especial (`migration-runner`) que recibe el SQL y lo ejecuta.
* **Seguridad:** Si esta función se borra, el sistema de migraciones cae.

### 4.2 API Keys & Secretos

* **Google/Gemini:** Usar llaves tipo `AIza...` (Gemini Developer API).
  * Validar con: `.\scripts\mcp\simple_test.ps1`
* **LaoZhang:** Usar `LAOZHANG_API_KEY`.

### 4.3 Logs & Debugging

* Si falla una función, NO adivines.
* Ejecuta `fast_sync.ps1` -> **Opción 5** y lee el error real ("Error: 401", "Constraint Violation", etc.).

---

## 5. SOLUCIÓN DE PROBLEMAS

* **"Error: Docker not found"** -> Estás usando CLI nativo. **DETENTE**. Usa `fast_sync.ps1`.
* **"Syntax Error at '?'"** -> Tu archivo SQL tiene BOM. Guárdalo como UTF-8 limpio.
* **"Unauthorized / 401"** -> Tus secretos expiraron. Usa Opción 3 para renovarlos.

---
*Fin del Protocolo Unificado v2.0*
