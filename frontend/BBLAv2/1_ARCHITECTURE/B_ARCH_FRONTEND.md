# 📘 BBLA: ARQUITECTURA FRONTEND & UX (2026-01-10)

> **PROPÓSITO:** Documentación del stack visual y estructura de la App LuxScaler.
> **ESTADO ACTUAL:** React SPA consolidada en directorio `/frontend`.

---

## 1. 📂 ESTRUCTURA DE DIRECTORIOS (SSOT)

A diferencia de versiones anteriores, el desarrollo se ha centralizado en la subcarpeta `/frontend` para asegurar coherencia con el servidor de desarrollo.

- `/frontend/App.tsx`: Orquestador principal de motores (Photoscaler, Stylescaler, Lightscaler, Upscaler).
- `/frontend/components/`:
  - `HeroGallery.tsx`: Home Premium (Punto de entrada).
  - `AdminDashboard.tsx`: Panel técnico del "Forensic Lab".
  - `ProductShowcase.tsx`: Galería pública de motores.
- `/frontend/services/`: Capa de API (Auth, Gemini, Payments).
- `/frontend/utils/`: Utilidades críticas como el `imageUtils.ts` (Universal Loader).

---

## 2. 🎨 DISEÑO "NUEVO HOME PREMIUM"

La identidad visual ha evolucionado hacia una estética cinematográfica de alta gama:

- **Efectos:** Glassmorphism profundo, bordes con degradados animados y Cinematic Glow.
- **Interactividad:** Navegación gestual y transiciones suaves entre motores de procesado.
- **Mobile First:** Diseño optimizado para el viewport móvil con controles ergonómicos.

---

## 3. 🛠️ ESPECIFICACIONES TÉCNICAS (SOP)

### 3.1 Puertos

- **8081**: Desarrollo Frontend (Vite).
- **8082**: Local Backend Proxy.

### 3.2 Carga de Imágenes (Robust Loader)

La aplicación utiliza un cargador universal que intercepta errores de CORS y repara formatos Base64 corruptos, asegurando que el Laboratorio Forense reciba datos limpios.

### 3.3 Segmentación Forense

El proceso de upscaling masivo se realiza mediante segmentación física en el cliente (Canvas) e inyección de contexto original (`contextData`) para garantizar la "Perfect Coherence" en el ensamblado final.

---

*Documento Maestro de Arquitectura - Sincronizado por Antigravity tras la Gran Migración.*
