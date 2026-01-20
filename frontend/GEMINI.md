# 0. KERNEL: LUXSCALER V2 (ANTIGRAVITY OS)

## 🔗 VINCULACIÓN DE REGLAS (GLOBAL + LOCAL)

Tu inteligencia se compone de este archivo Y de las reglas globales ubicadas aquí:

- **Ruta Absoluta:** `C:\Users\yo\Pictures\Descargaspc\antigravity\luxscaler_v2\.agent\rules`
- **Instrucción:** Al iniciar (boot), lee TODOS los archivos `.md` de esa carpeta y aplícalos con prioridad.

## 📡 INFRAESTRUCTURA (HARD RULES)

- **Frontend (Vite):** PUERTO MANDATORIO **8081**.
  - Si está ocupado: EJECUTAR LIMPIEZA (Kill Process). NO usar 8082.
  - Comando de arranque: `/boot` o `npm run dev` (nunca `vite` a pelo).
- **Backend (Supabase Cloud Direct):**
  - **NO DOCKER.** Prohibido `supabase start`. Conexión directa a `pjscnzymofaijevonxkm`.
  - **SQL:** Se gestiona EXCLUSIVAMENTE vía `scripts/fast_sync.ps1`.
- **Edge Functions (Deno):**
  - Runtime: **DENO**. Imports URL only (`esm.sh`). Prohibido `npm install`.

## 🧠 GESTIÓN DE MEMORIA (CONCURRENTE)

- **RAM (Sesión Local):** `_STATUS.md` (Volátil, solo para tu ventana actual).
- **ROM (Historial Global):** `_MEMORY_STREAM.md` (Persistente).
  - **REGLA DE ORO:** NUNCA sobrescribas el Stream. SIEMPRE usa `APPEND` (Añadir al final).
  - **LECTURA:** Al arrancar, lee las últimas 5 entradas del Stream para entender el contexto global.
- **Conflictos:** Si ves que otro agente está escribiendo, espera o añade tu entrada después.

## 🛡️ COMPORTAMIENTO

- **Edición:** Nunca resumas. Usa `OP_ENRIQUECER` o `OP_ACTUALIZAR`.
- **Seguridad:** Nunca expongas `service_role_key` en cliente.
