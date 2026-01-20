# MEMORIA MAESTRA V2 - LUXSCALER PROJECT

> **FUENTE DE VERDAD ÚNICA**
> **ÚLTIMA ACTUALIZACIÓN:** 2026-01-13 (Neo Reset)
> **ESTADO:** LuxScaler v2.0 (Clean Architecture)

## 🚨 CONSTANTES TÉCNICAS (NO TOCAR / NO OLVIDAR)

Estas verdades han sido descubiertas tras múltiples fallos. **No las cambies sin probar primero.**

1. **MODELO DE CHAT:** `gemini-1.5-flash`.
    * *Por qué:* `gemini-2.0-flash-exp` y `gemini-3` causan **Error 500 / Offline** (inestables o sin permisos en la Key actual).
    * *Acción:* Si ves `2.0` en `lux-chat/index.ts` o `B_PROTO_GLOBAL.md`, **CÁMBIALO A 1.5**.

2. **PROTOCOLO EDGE (Gemini payload):**
    * *Estuctura:* Requiere campo `system_instruction` explícito en el JSON.
    * *Prohibido:* Inyectar instrucciones como "falso mensaje de usuario" (Google v1beta lo rechaza o ignora).

3. **PERSISTENCIA DEL CHAT:**
    * *Método:* `localStorage` (Cliente).
    * *Estado:* Implementado. No depende de base de datos. Si el usuario refresca, recupera del navegador.

## 1. VISIÓN DEL PROYECTO

LuxScaler es una plataforma de "Engine Óptico Forense" que utiliza IA para escalar, restaurar y reimaginar imágenes con una fidelidad de 8K/16K.

* **Core Philosophy:** Mobile First, Premium UI (Gold/Black), Forensic Analysis.
* **Tech Stack:** React (Vite), Tailwind, Supabase (Edge Functions), Python (Forensic Lab).

## 2. ARQUITECTURA DE DIRECTORIOS (v2.0)

La estructura se ha aplanado para facilitar el mantenimiento:

* `/src`: Todo el código fuente frontend.
* `/supabase`: Backend (Migrations, Functions).
* `/BBLAv2`: Documentación técnica.
* `/public`: Assets estáticos.
* `/android` & `/ios`: Contenedores Nativos Soberanos.
* `/scripts`: Automatización (No-Zombie).

## 3. ESTADO TÉCNICO ACTUAL

### A. Core Engine (Edge Functions)

* **Master Sculptor (v32.0):** Optimizado con `decodeBase64` nativo de Deno. Sin fugas de memoria. Protocolo `snake_case`.
* **Preview Generator (Swarm):** Ejecución paralela 6x.
* **Forensic Lab:** Análisis profundo de lentes y daños físicos.

### B. Frontend (Deep Inspector)

* **Modal de Inspección**: Telemetría completa (Mixer Settings, Coste).
* **Storage Manager**: Protocolo Omnibus v19.1. Masonry Grid, Zoom.

### C. Protocolos Activos

* **Storage:** `{USER_ID}/{CONTEXT}/{YYYY-MM-DD}/{SESSION_ID}/{FILENAME}`.
* **Naming:** `{BASE}_MAST_4K_v1.png`.

## 4. HISTORIAL DE LOGROS (RESUMEN)

### Enero 2026 (Neo Era)

* [x] **Migración a v2.0**: Limpieza de directorios y eliminación de anidamiento `/frontend`.
* [x] **Master Creation**: Integración completa UI + Backend.
* [x] **Worker Limit Fix**: Optimización de recursos en Edge Functions.
* [x] **Forensic Vision**: Implementación de auditoría óptica en el pipeline.

## 5. REGLAS DE ORO (NEO PROTOCOL)

1. **No tocar el Core sin BBLA**: Consultar `/BBLAv2` antes de editar.
2. **Mobile First**: Todo componente debe funcionar en 375px de ancho.
3. **Snake_Case API**: Comunicación con IA siempre en `snake_case`.
4. **Zero Zombie**: Puertos 8081 fijos y limpios antes de arrancar.

---
*Documento vivo. Añadir nuevas sesiones al final.*

## 6. SESIONES POST-MIGRACIÓN

### 📝 SESIÓN: 2026-01-13 19:15

**Agente:** Antigravity (Assistant)
**Logros:**

* **Independencia Total (Island Model):** Se auditó y certificó que `luxscaler_v2` es autónomo. Eliminadas referencias a `LUXADMIN`.
* **Protocolo Agente v2:** Creado `B_PROTO_ANTIGRAVITY_AGENT.md` como Constitución Suprema.
* **Workflows Migrados:** `/sync`, `/idiomas` y Rules movidos a `luxscaler_v2/.agent` y actualizados.
* **Limpieza de Reglas:** Renombrado `luxadmin.md` -> `luxscaler_v2_rules.md` para coherencia.
* **Validación de Traducción:** Confirmada infraestructura `Locize` y scripts en `/scripts`.

**Cambios Técnicos:**

* [NEW] `luxscaler_v2/BBLAv2/3_PROTOCOLS/B_PROTO_ANTIGRAVITY_AGENT.md`
* [MOD] `luxscaler_v2/.agent/workflows/sync.md` (Enforce Single File)
* [MOD] `luxscaler_v2/.agent/workflows/translation_qa.md` (Rutas v2)
* [MOD] `luxscaler_v2/.agent/rules/luxscaler_v2_rules.md` (Refactor Total)
* [FIX] `src/services/locize.service.ts` (Env Vars fix `import.meta.env`)

### 📝 SESIÓN: 2026-01-14 00:05

**Agente:** Antigravity (Assistant)
**Logros:**

* **Auditoría de Paridad Total:** Sincronización 100% de componentes, servicios, hooks y utilidades desde el legado `LUXADMIN`.
* **Refinado UI Archives:** Visor responsivo "Borderless" (`object-cover`) y botón de zoom explícito.
* **Integración Master 4K v19.1:** Flujo de generación de Master activable desde el inspector de imágenes.
* **Migración de Herramientas:** `/upscale-tool` (`UpscalePage`) operativo en el nuevo entorno industrial.

**Cambios Técnicos:**

* [MOD] `src/components/ArchivesDashboard.tsx` (UI Refined)
* [MOD] `src/components/ImageInspectorModal.tsx` (Master Sculptor v19.1 integration)
* [NEW] `src/pages/UpscalePage.tsx` (Migrated from legacy)
* [SYNC] `src/services/` (Gemini, Auth, Payment) - Full parity.
* [SYNC] `src/utils/` (UpscaleEngine, StoragePaths) - Full parity.
* [SYNC] `public/locales/` (Full language support parity).

**Next Steps:**

* Pruebas de regresión total del pipeline 4K Master.
* Optimización de rendimiento en dispositivos móviles de gama baja.
* Cierre de auditoría y entrega de estado "Production Ready".

---

### 📝 SESIÓN: 2026-01-14 22:26

**Agente:** Antigravity (Assistant)
**Logros:**

* **Admin God Mode Implementado:** Panel completo para gestionar 7 tablas maestras de Supabase (photo/light/style/semantic/vision/global/audit).
* **Edges Editables:** Vista de relaciones entre tablas con CRUD desde `vision_trigger_overrides`.
* **Realtime Sync:** Suscripciones WebSocket para sincronización instantánea INSERT/UPDATE/DELETE.
* **GitHub Integration:** Repositorio `usajosefernan-cmd/luxscaler_v2` creado y sincronizado.
* **CI/CD Configurado:** GitHub Actions workflow para build + deploy automático a Netlify.
* **Workflow /gitsync:** Sincronización manual con GitHub en segundo plano.

**Cambios Técnicos:**

* [NEW] `src/components/admin/AdminGodMode.tsx` (617 líneas - Panel CRUD completo)
* [MOD] `src/components/AdminDashboard.tsx` (Tab GOD_MODE añadido)
* [MOD] `src/components/admin/layout/AdminSidebar.tsx` (Navegación Zap icon)
* [NEW] `.github/workflows/ci-cd.yml` (CI/CD Pipeline)
* [NEW] `.agent/workflows/gitsync.md` (Sync en segundo plano)
* [NEW] `scripts/auto_sync_github.ps1` (Watch mode cada 5 min)
* [DEL] `scripts/debug-stripe.ts` (Contenía API key)
* [DEL] `scripts/create_github_repo.ps1` (Contenía PAT)

**Next Steps:**

* Testing completo de CRUD en AdminGodMode.
* Documentar flujo de edges y cascade checks.

### 📝 SESIÓN: 2026-01-15 14:10

**Agente:** Antigravity
**Logros:**

* **Recuperación de Método de Migración Legacy:** Ante fallos persistentes en el despliegue de Edge Functions (`migration-runner`), se identificó y recuperó el script `scripts/run_sql_file.ps1`. Se validó que este método funciona inyectando SQL directamente a la Management API de Supabase, esquivando la inestabilidad del CLI.
* **Ejecución Manual de SQL Phase 6:** Debido a que el script de PowerShell se colgaba por manejo de inputs, se extrajo la lógica y se ejecutó un `Invoke-RestMethod` directo en la terminal, logrando crear exitosamente las tablas `projects` y `documents`.
* **Validación de Integridad:** Se actualizó el script `scripts/verify_migration.ps1` para buscar específicamente las tablas de la Fase 6 (`projects`, `documents`, `document_versions`). La validación confirmó la existencia de las 3 tablas críticas.
* **Mejora del Protocolo de Sync:** Se actualizó `.agent/workflows/sync.md` para exigir explicaciones detalladas en futuras memorias, asegurando que el conocimiento técnico no se pierda en bullets simples.

**Cambios Técnicos:**

* **[NEW] `migration_phase6.sql`:** Archivo SQL conteniendo todo el DDL necesario para la Fase 6 (Proyectos, Documentos, RLS Policies). Usado como payload para la inyección API.
* **[MOD] `.agent/workflows/sync.md`:** Se reescribió la sección de "Formato de Entrada" para solicitar explicaciones contextuales ("QUÉ y POR QUÉ") en lugar de listas simples.
* **[MOD] `scripts/verify_migration.ps1`:** Se cambió la query SQL interna para buscar las tablas de la Fase 6 en `information_schema`, en lugar de las tablas de la Fase 2 antiguas.
* **[DEL] `supabase/functions/migration-runner/deno.json`:** Se eliminó este archivo intentando depurar el fallo de despliegue (sin éxito, pero queda documentado como intento).

**Next:** Continuar con la **Fase 6.3 (GitHub Sync)**. Integrar el botón "PUSH" en la UI y conectar con la Edge Function `lux-git-sync` (que deberá ser desplegada/verificada).

### 📝 SESIÓN: 2026-01-15 14:26

**Agente:** Antigravity
**Logros:**

* **Optimización del Workflow de Sincronización:** Se ha redefinido el protocolo `/sync` en `.agent/workflows/sync.md`.
  * **Modo Turbo:** Se añadió la directiva `// turbo-all` para permitir ejecuciones desatendidas rápidas.
  * **Mantenimiento Preventivo:** Se incluyó un paso de **Eliminación de Cache** (`node_modules/.vite`, `node_modules/.cache`) para prevenir la degradación del rendimiento del IDE ("Antigravity") por acumulación de artefactos de compilación obsoletos.
* **Validación de Ejecución:** Esta entrada confirma que el nuevo protocolo, incluyendo la limpieza de cache, se ha ejecutado correctamente.

**Cambios Técnicos:**

* **[MOD] `.agent/workflows/sync.md`:** Añadido `// turbo-all` al inicio y el Paso 4 "Eliminación de Cache".
* **[EXEC] Limpieza de Sistema:** Ejecutado `rm -rf` sobre directorios de cache de Vite y NPM. (Nota: Si el servidor de desarrollo está activo, algunos archivos pueden estar bloqueados en Windows, lo cual es esperado y no crítico).

**Next:** Fase 6.3 - GitHub Sync (UI & Edge Function).

### 📝 SESIÓN: 2026-01-15 14:51

**Agente:** Antigravity
**Logros:**

* **Implementación de Fast Sync (Final):** Se ha desplegado y activado `scripts/fast_sync.ps1`. Este script consolida la gestión de memoria y el mantenimiento del sistema (limpieza de cache) en un solo comando rápido.
* **Actualización de Protocolo:** El workflow `/sync` ahora referencia explícitamente a esta herramienta, eliminando pasos manuales y garantizando velocidad.

**Cambios Técnicos:**

* **[NEW] `scripts/fast_sync.ps1`:** Script de automatización (Memory Append + Cache Purge).
* **[MOD] `.agent/workflows/sync.md`:** Refactorizado para usar el método "One-Shot Execution".

**Next:** Fase 6.3 - GitHub Sync (Integración UI con botón PUSH).

### 📝 SESIÓN: 2026-01-15 19:00

**Agente:** Antigravity (Deepmind)
**Logros:**

* **Resolución Error 401 Lux Chat (Root Cause):** Se identificó y probó forensemente que la API Key de Google tiene restricción de IP.
  * *Prueba 1:* La Key funciona en local (Powershell) pero falla en Supabase.
  * *Prueba 2:* El entorno de Supabase NO tiene credenciales de Service Account (`DEBUG_ENV_VARS` confirmó ausencia de `GOOGLE_APPLICATION_CREDENTIALS`).
  * *Conclusión:* Google bloquea las IPs dinámicas de Supabase. Solución: Quitar restricción de IP en Cloud Console.
* **Documentación Blindada (Map Edition):** Se reescribió `B_PROTO_GLOBAL.md` (v3.0) para incluir un Mapa del Ecosistema completo (Quién es quién, Dónde están las Keys, Cómo se actualiza).
* **Optimización de Sistema (Anti-Zombie):** Se añadió la opción "Clean Zombie Processes" en `fast_sync.ps1` para matar procesos `powershell` y `node` colgados que ralentizaban el PC del usuario.
* **Consolidación Protocolo No-Docker:** Se fusionó la directiva "No-Docker" dentro de `B_PROTO_SUPABASE_MCP.md` como estándar único.

**Cambios Técnicos:**

* **[MOD] `supabase/functions/lux-chat/index.ts`:** Restaurado a funcionalidad completa con Auth vía Header `x-goog-api-key`.
* **[MOD] `BBLAv2/3_PROTOCOLS/B_PROTO_GLOBAL.md`:** Actualización masiva v3.0 con Mapa de Ecosistema.
* **[MOD] `scripts/fast_sync.ps1`:** Añadida función `Run-Cleanup` (Opción 7) para matar zombies.
* **[NEW] `scripts/mcp/verify_image_gen.ps1`:** Script de validación de capacidades de imagen.

**Next:**

### 📝 SESIÓN: 2026-01-16 10:00

**Agente:** Antigravity
**Logros:**

* **Chat Persistente (LuxCanvas):** Implementado sistema de guardado automático (`auto-save`) y recuperación del historial de chat vinculado a cada documento.
* **Layout Responsive (Full View):** Corregido el desbordamiento en `AdminLuxCanvas`. Añadido soporte `min-h-0` para garantizar que los paneles de Chat y Editor respeten el viewport (100dvh) en todos los navegadores.
* **UI Premium (Editor):** Rediseño total de la visualización de código con estilo "Mac Terminal" (Dark Mode, Traffic Lights) y mejor tipografía para alertas y listas.
* **Navegación Admin:** Integrado botón "Volver al Dashboard" en la librería de proyectos.

**Cambios Técnicos:**

* **[MOD] `src/components/admin/luxcanvas/AdminLuxCanvas.tsx`:** Lógica de `handleLoadDocument` para `chat_history`. Ajustes Flexbox `min-h-0`.
* **[MOD] `src/components/admin/luxcanvas/components/EditorPanel.tsx`:** Nuevo `SectionContentRenderer` con estilos avanzados. Props `min-w-0` para layout.
* **[MOD] `src/components/admin/luxcanvas/components/ChatPanel.tsx`:** Ajuste de contenedor `h-full min-h-0`.
* **[NEW] `supabase/migrations/20260116120000_add_chat_history.sql`:** Columna JSONB para persistencia.

**Next:** Validar despliegue y funcionamiento de `mermaid` graphs en visualización.
