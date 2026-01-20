# 📘 GUÍA TÉCNICA: REPLICATE INTEGRATION (UPSCALER ENGINE)

> **Dominio:** AI Computing / Upscaling
> **Fuente de Verdad:** LUXSCALER v3.2 (Recuperado)
> **Estado:** Production (Cog Container)

## 1. RESUMEN TÉCNICO

Motor de inferencia para el escalado de imágenes y generación HDR. Se ejecuta en GPUs NVIDIA A40/A100 a través de Replicate.

* **Modelo:** `r8.im/josfer/luxscaler-v32`
* **Función:** Upscaling Inteligente + Exportación HDR (EXR/TIFF 32-bit).
* **Base:** Custom Cog Container (Python 3.10 + Torch + OpenEXR).

## 2. API ENDPOINTS & CONFIGURACIÓN

### 🔑 Credenciales

Configurar en `supabase secrets` y `.env` local.

| Variable | Descripción |
| :--- | :--- |
| **REPLICATE_API_TOKEN** | Token de acceso (Formato `r8_...`) |
| **MODEL_VERSION** | Hash del deploy (ej: `abcd1234...`) |

### 🚀 Ejecución de Predicciones

**Endpoint Standard:**
`POST https://api.replicate.com/v1/predictions`

**Payload JSON:**

```json
{
  "version": "r8.im/josfer/luxscaler-v32:LATEST_HASH",
  "input": {
    "tile_input": "https://url-to-source-tile.png",
    "global_reference": "https://url-to-context.png",
    "output_format": "exr", 
    "hdr_boost": 1.5,
    "fractality": 1.2
  }
}
```

**Parámetros de Entrada:**

* `tile_input`: URL de la imagen (tile) a procesar.
* `output_format`: `webp` (web), `png` (16-bit), `tiff` (32-bit), `exr` (HDR).
* `hdr_boost`: Multiplicador de rango dinámico (Defecto: 1.0).

## 3. DESPLIEGUE (COG)

Para actualizar el modelo de IA:

1. **Estructura del Proyecto:**
   * `predict.py` (Lógica de inferencia)
   * `cog.yaml` (Definición de entorno Docker)
   * `hdr_exporter.py` (Módulo de 32-bit float)

2. **Comandos de Deploy:**

   ```bash
   cog login
   cog push r8.im/josfer/luxscaler-v32
   ```

3. **Dependencias Críticas (System Packages):**
   * `libopenexr-dev` (Para manejo de EXR)
   * `libtiff-dev` (Para TIFF flotante)

## 4. COSTOS Y RENDIMIENTO

* **Hardware:** Nvidia A40 (Large)
* **Tiempo Promedio:** 3-5s por Tile (1024x1024)
* **Costo Estimado:** ~$0.0023 por segundo.
* **Escalabilidad:** Auto-scaling nativo de Replicate.

---
> [!NOTE]
> Este servicio es invocado por el orquestador (Cloudflare Worker) para procesar cada "baldosa" de la imagen maestra.
