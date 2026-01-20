# 📘 BBLA: ARQUITECTURA TÉCNICA BACKEND & LUXSCALER ENGINE (2026-01-04)

> **PROPÓSITO:** Documentación técnica profunda del núcleo de Luxifier/LuxScaler.
> **FUENTE DE VERDAD:** `lux-logic.ts` (vFinal), Edge Functions, SQL Schemas.

---

## 1. 🧠 LUXSCALER OPTICAL ENGINE (El Corazón)

El núcleo de la lógica reside en `_shared/lux-logic.ts`. Este archivo define cómo se traducen las imágenes y solicitudes de usuario en prompts de ingeniería óptica para Gemini.

### 1.1 "The Equation" (Los 4 Motores)

Todo prompt se construye mediante la mezcla (`LuxMixer`) de 4 motores independientes:

1. **PHOTOSCALER (Forensic Architect):**
    * Responsable de la geometría, distorsión de lente y restauración física.
    * Detecta tipos de plano (`SELFIE`, `ARCH`, `PRODUCT`) para aplicar correcciones específicas (ej: aplanar distorsión de teléfono en selfies).
    * *Niveles 0-10*.

2. **STYLESCALER (Art Director):**
    * Controla la dirección de arte, vestuario y consistencia de identidad.
    * **Protocolo de Identidad:** Si el sujeto es humano, bloquea cambios faciales estructurales para preservar la identidad biométrica.
    * *Niveles 0-10*.

3. **LIGHTSCALER (Director of Photography):**
    * Controla la física de la luz, niebla volumétrica y simulaciones de cuerpos de cámara (Sensor/Lente/Iluminación).
    * Simula stacks tecnológicos reales (ej: Phase One IQ4 + Rodenstock).
    * *Niveles 0-10*.

4. **UPSCALER (Print Lab):**
    * Controla la "alucinación de textura" (poros, fibras).
    * Define la resolución objetivo (2K, 4K, 8K, 16K Master Print).
    * *Index 0-3*.

### 1.2 Flujo de Prompting (Deep Think)

La función `buildDeepThinkPrompt` orquesta estos motores, inyectando directivas XML estrictas (`<SYSTEM_DIRECTIVE>`, `<IDENTITY_ANCHOR_PROTOCOL>`, `<VIRTUAL_HARDWARE>`) que obligan al modelo a comportarse como un equipo de producción fotográfica.

---

## 2. ⚡ EDGE FUNCTIONS (Microservicios)

La arquitectura es 100% Serverless sobre Deno (Supabase Edge runtime).

### 2.1 `preview-generator` (v86)

* **Función:** Genera 6 variaciones rápidas (HD) basadas en una imagen de entrada.
* **Modelo:** `gemini-2.5-flash-image`.
* **Protocolo:** Serializado (Parallel Promises).
* **Salida:** Stream NDJSON para feedback en tiempo real al frontend.
* **Key Rotation:** Usa `key-rotator.ts` para balancear carga entre nodos de Google Cloud.

### 2.2 `master-sculptor` (v40)

* **Función:** "The Velvet Rope". Genera la versión final 4K/16K.
* **Modelo:** `gemini-3-pro-image-preview` (Thinking Mode).
* **Entrada:** Toma el `seed` y `prompt` de una variación aprobada.
* **Salida:** WebP optimizado (90% calidad).

### 2.3 `admin-actions` (Admin Tool)

* **Seguridad:** Requiere `is_admin = true` en tabla `profiles`.
* **Acciones:**
  * `approve_waitlist`: Crea usuario auth, asigna créditos y aprueba en DB.
  * `delete_storage_files`: Limpieza profunda de buckets (bypasea RLS estándar usando Service Role).

### 2.4 `storage-compressor` (Utility)

* **Función:** Optimización inteligente de storage.
* **Lógica:** Resize (max 4K) -> WebP (80%) -> Restore Format (si es necesario).
* **Librería:** `imagescript` (WASM).

---

## 3. 🛡️ SEGURIDAD & INFRAESTRUCTURA

### 3.1 Key Pool & Rotación

* **Tabla:** `private.api_keys_pool`.
* **Lógica:** Round Robin (`last_used_at ASC`).
* **Bóveda:** Las llaves NO están en .env (excepto fallback de emergencia). Están en DB en esquema privado.

### 3.2 Base de Datos (PostgreSQL)

* **Schema Públic:** `profiles`, `generations`, `variations`, `beta_waitlist`.
* **Schema Private:** `api_keys_pool`, `admin_audit_logs`.
* **RLS (Row Level Security):**
  * `profiles`: Users can read own.
  * `variations`: Public read (para compartir), pero solo Auth users create.
  * `beta_waitlist`: Admin read only.

### 3.3 Storage Buckets

* `lux-storage`: Bucket principal.
* **Políticas:**
  * `Public Read`: Todo el mundo puede ver los resultados (marketing viral).
  * `Authenticated Upload`: Solo usuarios logueados pueden subir inputs.
  * `Service Role Delete`: Solo admins/funciones pueden borrar.

---

## 4. 🚀 DESPLIEGUE (The Golden Command)

Para actualizar el backend, siempre usa flags explícitos para evitar sobrescribir con defaults peligrosos.

```powershell
npx supabase functions deploy preview-generator master-sculptor admin-actions storage-compressor --no-verify-jwt --project-ref pjscnzymofaijevonxkm
```

> **NOTA:** `--no-verify-jwt` se usa actualmente porque validamos el JWT *dentro* del código de la función para tener control granular de errores y roles, pero se debe evaluar activar la validación nativa en V2.0.

---

*Documento generado automáticamente por Antigravity tras sincronización LuxScaler 2026.*
