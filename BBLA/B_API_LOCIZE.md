# 📘 GUÍA TÉCNICA: LOCIZE (i18n)

> **Dominio:** Internacionalización
> **Fuente de Verdad:** BBLAv2
> **Estado:** Configuración Activa

## 1. CONFIGURACIÓN DEL PROYECTO

| Configuración | Valor |
| :--- | :--- |
| **Project ID (UUID)** | `b0b098f2-ad99-46c8-840d-f01dbc330e9a` |
| **Project ID (Slug)** | `eyfo2umc` |
| **API Key Admin** | `6779d3af-6d78-4c2b-ae81-99ca03fc8278` |
| **Version** | `latest` |
| **Namespace** | `translation` |
| **Idiomas** | Fuente: `en`. Destino: `es`, `ar`, `de`, `fr`, `ja`, `zh` |

## 2. AUTO-TRANSLATION (ACTIVADO)

El proyecto utiliza un flujo de traducción continua:

1. **Push:** Antigravity envía nuevas claves en inglés al crear componentes.
2. **Translate:** Locize AI detecta las nuevas claves y las traduce automáticamente a todos los idiomas destino.
3. **Pull:** El frontend descarga las traducciones actualizadas vía CDN al cargar.

## 3. SCRIPTS DE SINCRONIZACIÓN

Ubicados en `src/scripts/` (o raíz `scripts/` según estructura v2):

```bash
# Sincronización completa (Push keys + Verify)
npx tsx scripts/sync-locize-final.ts
```

## 4. ENDPOINTS (API)

**CDN (Lectura):**
`GET https://api.locize.app/b0b098f2-ad99-46c8-840d-f01dbc330e9a/latest/{LANG}/translation`

**API (Escritura):**
`POST https://api.locize.app/update/b0b098f2-ad99-46c8-840d-f01dbc330e9a/latest/en/translation`
(Requiere Bearer Admin Key)
