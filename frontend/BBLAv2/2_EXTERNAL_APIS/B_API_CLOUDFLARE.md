# 📘 GUÍA TÉCNICA: CLOUDFLARE INTEGRATION (TILES SYSTEM)

> **Dominio:** Infraestructura & Storage
> **Fuente de Verdad:** B_22_tiles cloudfare-NOTOCAR.txt (Recuperado)
> **Estado:** Production (V3 Worker)

## 1. RESUMEN EJECUTIVO

Sistema de procesamiento de imágenes serverless que elimina la dependencia de Supabase para archivos pesados. Utiliza Cloudflare Workers y R2 para cortar, almacenar y ensamblar imágenes de ultra-alta resolución (tiles).

* **Worker:** `tile-assembler` (v3) - Motor Sharp.js
* **Storage:** R2 Bucket `antigravity-tiles`
* **Cache:** Cloudflare Edge (TTL 24h)

## 2. CREDENCIALES (PRODUCCIÓN)

> [!WARNING]
> Credenciales críticas. No rotar sin detener el servicio.

| Configuración | Valor | Nota |
| :--- | :--- | :--- |
| **Account ID** | `9d248b8b5baed3559e743ef138d25b64` | Josferestudio |
| **API Token** | `sUxhNcYWyBekYEhx5Hs9Clb7nStz0iz0fsBc_AGn` | Permisos: Workers, R2, KV |
| **Worker URL** | `https://tile-assembler.josferestudio.workers.dev` | Public Endpoint |
| **R2 Bucket** | `antigravity-tiles` | Coste: $0.015/GB/mes |

## 3. API ENDPOINTS

El Worker expone 3 endpoints principales para la gestión de tiles:

### A. Upload & Slice

**POST** `/upscaler/final/{id}/upload-image`

* **Payload:** Binary Image Data (PNG/JPG).
* **Acción:**
  1. Recibe imagen (ej: 4000x6000).
  2. Corta en tiles de 1000x1000px (4x6 grid).
  3. Guarda tiles en R2 + `manifest.json`.
  4. Retorna metadata JSON.

### B. Get Master (Assembly)

**GET** `/upscaler/final/{id}/master.webp`

* **Acción:**
  1. Lee `manifest.json`.
  2. Descarga tiles desde R2.
  3. Ensambla "on-the-fly" usando Sharp.js.
  4. Retorna imagen completa WebP.
  5. **Cache:** 24h en CDN.

### C. Cleanup

**DELETE** `/upscaler/final/{id}/cleanup`

* **Acción:** Borra todos los tiles y el manifiesto de R2 para ahorrar costes.

## 4. ESTRUCTURA DE ALMACENAMIENTO (R2)

```text
antigravity-tiles/
├── {session_id}/
│   ├── manifest.json       (Metadata: rows, cols, size)
│   ├── 0_0.webp            (Tile 0,0)
│   ├── 0_1.webp            (Tile 0,1)
│   ├── ...
│   └── {r}_{c}.webp        (Tile r,c)
```

## 5. NOTAS DE DESPLIEGUE

Para actualizar el worker (requiere `wrangler` instalado):

```bash
# Login
wrangler auth login

# Deploy con Token
wrangler deploy --token sUxhNcYWyBekYEhx5Hs9Clb7nStz0iz0fsBc_AGn
```

**Variables de Entorno (wrangler.toml):**

```toml
[[r2_buckets]]
binding = "TILES_BUCKET"
bucket_name = "antigravity-tiles"
```
