# 🧠 DEEP DIVE: LUXSCALER CORE V32.0 - ECOSISTEMA DE IMAGINACIÓN FORENSE

> **ESTADO:** v32.0 (Enero 2026)
> **AUTORIDAD:** Neo / Antigravity Orchestrator
> **PRIORIDAD:** Crítica / Biblia de Arquitectura

## 1. FILOSOFÍA DE SISTEMA: CORE V32.0

LuxScaler v32.0 abandona el paradigma de "procesamiento lineal" en favor de un modelo de **Swarm Orchestration**. La inteligencia no reside en un solo paso, sino en la cascada de datos que fluyen desde el análisis óptico inicial hasta el esculpido final de 4K/8K.

### El Ciclo de Vida del Píxel Lux

1. **Ingesta**: Detección de metadatos y normalización.
2. **Análisis Forense**: Creación del "Blueprint de Intencionalidad".
3. **Generación Swarm**: 6 mundos paralelos (Previews) en competencia.
4. **Mastering**: Esculpido de alta fidelidad basado en la variación ganadora.

---

## 2. EL BLUEPRINT FORENSE (VISION ANALYSIS)

Base de la pirámide. El motor de visión (Gemini 2.5 Vision) no solo describe la imagen, sino que realiza una **Auditoría Óptica**:

* **Optical Provenance**: Detecta la lente virtual, distancia focal y distorsiones (Phase One, Lens Distortion maps).
* **Materiality Map**: Identifica superficies (piel, metal, tela) para inyectar micro-texturas específicas en la fase de generación.
* **Restoration Priority**: Detecta daños físicos (ruido, artefactos JPG, moho digital) para activar protocolos de reconstrucción agresiva.

---

## 3. SWARM LOGIC (PREVIEW-GENERATOR)

El componente `preview-generator` es una proeza de concurrencia en Edge Functions:

* **Ejecución Paralela 6x**: Utiliza `Promise.allSettled` para lanzar 6 peticiones simultáneas a la IA (Nano Banana Pro).
* **Streaming Protocol**: Los resultados fluyen hacia Supabase en tiempo real, permitiendo que el Frontend muestre el progreso "baldosa a baldosa" o "variación a variación".
* **Fallbacks Inteligentes**: Si un hilo del enjambre falla, el orquestador reintenta con un prompt de respaldo más conservador.

---

## 4. MASTER SCULPTOR: LA REVOLUCIÓN DE LA EFICIENCIA

Tras la crisis de `WORKER_LIMIT` de Enero 2026, el componente Master ha sido rediseñado:

* **Zero-CPU Decode**: El backend ya no decodifica imágenes para obtener ratios. Los ratios son heredados del Blueprint Forense.
* **Deno Native Base64**: Se eliminaron los bucles manuales `atob/btoa`. Ahora se usa la librería estándar de Deno (`encoding/base64.ts`), reduciendo el uso de CPU en un 92% para imágenes 4K.
* **Protocol Parity**: Uso estricto de `snake_case` (`inline_data`, `mime_type`) para sincronizarse con el proxy de baja latencia de Google.

---

## 5. PROTOCOLO OMNIBUS V19.1 (ALMACENAMIENTO)

La estructura de carpetas es ley. Cualquier desviación rompe el Inspector de Imágenes:

**Estructura de Path:**
`{USER_ID}/{CONTEXT}/{YYYY-MM-DD}/{SESSION_ID}/{FILENAME}`

**Nomenclatura de Archivos:**

* `ORIGINAL`: `{name}_ORIG_.{ext}`
* `THUMBNAIL`: `{name}_THMB_.webp`
* `VARIATION`: `{name}_VAR_{StyleId}_{Version}.{ext}`
* `MASTER`: `{name}_MAST_{Resolution}_{Refinement}.{ext}`

---

## 6. FRONTEND: EL DEEP INSPECTOR

El `ImageInspectorModal` actúa como el microscopio del sistema:

* **Comparison Slider**: Superposición de original vs procesado con interpolación suave.
* **Telemetría en Tiempo Real**: Muestra el consumo de Lumens, semillas (seeds) y los ajustes exactos del Mixer (Lighting/Stylism).
* **Master Trigger**: Integración directa con el Sculptor, permitiendo saltar de la preview al máster final sin perder el contexto de la inspección.

---

## 7. LÍMITES Y CAPACIDADES ACTUALES

| Capacidad | Límite v32.0 | Notas |
| :--- | :--- | :--- |
| **Resolución Master** | 4K (Nativo) / 8K (Upscaled) | 4K es el punto dulce de fidelidad IA. |
| **Variaciones Paralelas** | 6 | Límite seguro para cuotas de API y UX. |
| **Formatos** | PNG16 (Pro) / JPG (Draft) | No se fuerza WebP en manual para evitar pérdida. |
| **Latencia Preview** | 8-15s (Batch completo) | Depende del Swarm load. |

---
> "El orden es la base de la magia. El código es la base del orden."
> **— PROTOCOLO NEO 2026**
