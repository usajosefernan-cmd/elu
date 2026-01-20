# 📘 GUÍA TÉCNICA: FREEPIK API (ASSET RESOURCES)

> **Dominio:** Assets & Resources
> **Estado:** 🟡 Planned / Reference
> **Documentación Oficial:** <https://www.freepik.com/api/documentation>

## 1. RESUMEN EJECUTIVO

La API de Freepik permite el acceso programático a millones de recursos gráficos (fotos, vectores, PSDs) para enriquecer el flujo de trabajo de generación de contenido.

## 2. CAPACIDADES PRINCIPALES

* **Search:** Búsqueda avanzada de recursos por keywords, filtros (vector, psd, photo), y ordenamiento.
* **Download:** Obtención de enlaces de descarga directa para recursos premium y gratuitos.
* **Daily Content:** Acceso a los vectores y fotos más populares del día.

## 3. IMPLEMENTACIÓN (FUTURA)

### Configuración Requerida

Para integrar Freepik en LuxScaler, se requerirá:

1. **API Key:** Obtener en el [Developer Portal](https://www.freepik.com/api/developers).
2. **Variable de Entorno:** `FREEPIK_API_KEY` en Supabase Secrets.

### Endpoint Base

`https://api.freepik.com/v1`

### Ejemplo de Búsqueda (Curl)

```bash
curl -X GET \
  'https://api.freepik.com/v1/resources?locale=en-US&page=1&limit=10&order=latest&term=cyberpunk' \
  -H 'Accept-Language: en-US' \
  -H 'X-Freepik-API-Key: YOUR_API_KEY'
```

## 4. ENLACES ÚTILES

* **Portal de Desarrolladores:** [Freepik API Developers](https://www.freepik.com/api/developers)
* **Pricing:** [API Pricing Plans](https://www.freepik.com/api/pricing)
