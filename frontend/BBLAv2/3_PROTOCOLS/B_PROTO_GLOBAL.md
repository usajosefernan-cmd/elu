# ANTIGRAVITY GLOBAL PROTOCOLS (MASTER GUIDE)

> **ESTADO:** ACTIVO
> **APLICA A:** Todos los Agentes (Aba, Neo, etc) y **HUMANOS**.
> **PRIORIDAD:** ROOT (Kernel Level).

> **NUEVA NORMA (MANDATORIO):** ANTES de tocar nada de Backend/DB, **LEER OBLIGATORIAMENTE** `BBLAv2/3_PROTOCOLS/B_PROTO_SUPABASE_MCP.md`.
> **NUEVA NORMA (AI AGENTS):** Toda edición de documentos largos debe seguir el protocolo semántico `BBLAv2/3_PROTOCOLS/B_PROTO_AI_ENGINEERING.md`.

---

## 🗺️ 0. MAPA DEL ECOSISTEMA (LEER PRIMERO)

Si eres nuevo (IA o Humano), **EMPIEZA AQUÍ**. Así es como funciona la aplicación:

### 🧩 Arquitectura de APIs (Quién hace qué)

| Función | Proveedor | Modelo Principal | Dónde está la Key | Costo Aprox |
| :--- | :--- | :--- | :--- | :--- |
| **CHAT / TEXTO** | Google (Gemini) | `gemini-2.0-flash` | Supabase Secrets (`GEMINI_API_KEY`) | Gratuito (Limitado) |
| **GEN. IMÁGENES** | LaoZhang API | `seedream-4-0` / `gemini-3` | `.env` (`VITE_LAOZHANG_API_KEY`) | $0.025/img |
| **FOTO FORENSE** | Vertex AI (Google) | `imagen-3.0` | Supabase Secrets | Enterprise |
| **BASE DE DATOS** | Supabase Cloud | PostgreSQL | Hardcoded en Scripts + `.env` | Tier Pro |

### 📍 Dónde están las Cosas (Configuración)

| Componente | Ubicación Archivo | Dónde se Edita / Gestiona |
| :--- | :--- | :--- |
| **Frontend Keys** | `luxscaler_v2/.env` | Editar archivo local `.env` |
| **Backend Keys** | `Config Secreta` | **Script:** `fast_sync.ps1` (Opción 3) |
| **Database Schema** | `supabase/migrations/*.sql` | **Script:** `fast_sync.ps1` (Opción 1) |
| **Backend Logic** | `supabase/functions/*/index.ts` | **Script:** `fast_sync.ps1` (Opción 2) |
| **Google Cloud** | N/A (Consola Web) | [Google Cloud Console](https://console.cloud.google.com) (Proyecto: `luxifier-node...`) |

### ⚡ Cómo Actualizar Supabase (Backend)

**NO USAR COMANDOS NATIVOS.** Usa exclusivamente el orquestador:
`.\scripts\fast_sync.ps1`

---

## 1. ORDEN SUPREMA DE DIRECTORIOS (THE ISLAND)

LuxScaler v2 opera como una unidad independiente.

### 1.1 Estructura Única (Single Root)

Todo el proyecto vive en la raíz de **`luxscaler_v2`**.

* **`/src`**: Código fuente React/Vite (Frontend).
* **`/supabase`**: Lógica de Backend (Functions) y Base de Datos (Migrations).
* **`/scripts`**: Herramientas de automatización Powershell (.ps1).
* **`/BBLAv2`**: Fuente de Verdad (Documentación y Protocolos).

**JAMÁS** referenciar archivos fuera de esta carpeta.

---

## 2. PROTOCOLO DE PUERTOS (PORT SECURITY)

### 2.1 El Puerto Sagrado: 8081

La aplicación **DEBE** correr en el puerto **8081**. Si está ocupado, el script de arranque lo limpiará.

### 2.2 Procedimiento de Arranque (Clean Start)

Comando único para desarrolladores:

```powershell
npm run dev
# Esto instala dependencias, mata procesos zombies y levanta el servidor.
```

---

## 3. HIGIENE DE CÓDIGO

* **TypeScript Estricto:** Nada de `any`. Tipar todo correctamente.
* **Rutas Relativas:** Usa `@/` (alias de `./src`) para imports internos.
* **Idiomas:** Todo texto visible debe usar `i18next`.

---

## 4. PROTOCOLO DE SUPABASE & NO-DOCKER

> **Ver Detalle Completo:** `BBLAv2/3_PROTOCOLS/B_PROTO_SUPABASE_MCP.md`

Toda interacción con infraestructura (Migraciones, Deploys, Secrets) se hace a través de: `.\scripts\fast_sync.ps1`.

* **Opción 1:** Migraciones SQL.
* **Opción 2:** Despliegue de Funciones.
* **Opción 3:** Gestión de Secretos (API Keys).
* **Opción 7:** Limpieza de Procesos (Si el PC va lento).

---

## 5. PROTOCOLO DE ONBOARDING (NUEVOS AGENTES)

1. **Lee el Mapa:** La Sección 0 de este documento.
2. **Identifica Estado:** Lee `task.md` (Artifacts) para ver tareas pendientes.
3. **Arranca:** `npm run dev` en la terminal.

---

## 6. GESTIÓN DE ALMACENAMIENTO (STORAGE)

Estructura de archivos en Buckets:
`{USER_ID}/{CONTEXT}/{YYYY-MM-DD}/{SESSION_ID}/{FILENAME}`

* **Naming:** `snake_case`. Sin espacios ni caracteres especiales.
* **Versiones:** Usar sufijos `_v1`, `_v2` o `_FINAL`.

---

## 7. EDGE FUNCTIONS (REGLAS CRÍTICAS)

### 7.1 JWT Verification (GLOBAL FIX)

**Por defecto**, Supabase requiere JWT válido para invocar Edge Functions. Esto causa error 401 en llamadas públicas.

**Solución Global (Permanente):**

```powershell
# Despliega TODAS las funciones sin JWT (usar siempre este script)
.\scripts\deploy_all_functions.ps1
```

**O manualmente:**

```bash
npx supabase functions deploy <nombre> --no-verify-jwt
```

### 7.2 Modelo de Chat (Gemini)

| Modelo | Estado | Uso |
|:---|:---|:---|
| `gemini-2.0-flash` | ✅ ACTIVO | Chat (lux-chat) - *Usa v1beta con remapeo de 'function' a 'user'.* |
| `gemini-1.5-flash` | ⚠️ VOLÁTIL | Posibles 404 en v1beta. |
| `gemini-3-pro-image-preview` | ✅ ACTIVO | Generación de imágenes (lux-logic via LaoZhang) |

---

*Fin del Protocolo Global v3.1 (JWT Global Fix Edition)*
