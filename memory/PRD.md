# LuxScaler v28 - Product Requirements Document

## 📋 Resumen del Proyecto
LuxScaler es una aplicación de procesamiento de imágenes impulsada por IA que utiliza modelos de Google Gemini para mejorar, restaurar y estilizar fotografías.

---

## ✅ Funcionalidades Implementadas (Sesión 2026-01-21)

### CAMBIOS PRINCIPALES ESTA SESIÓN:

#### 1. **Sistema de Visión "Creative Director" (NUEVO)**
- Nuevo prompt de visión tipo "Director Creativo"
- Detecta 5 intents/titulares estilo revista (ej: "Vanity Fair Editorial", "Grunge Rock Portrait")
- Devuelve `auto_settings` con los 27 sliders pre-configurados
- Análisis de "gaps" Amateur vs Pro (Lighting, Set, Optics, Timing)

#### 2. **27 Sliders Actualizados en DB**
- Nuevas instrucciones para todos los niveles (OFF/LOW/MED/HIGH/FORCE)
- Escala 1-10 (no 0-10)
- Instrucciones tipo producción de cine ($100k look)

#### 3. **VisionConfirmModal Renovado**
- 3 modos: AUTO | ELEGIR | MANUAL
- AUTO: Usa la mejor configuración detectada automáticamente
- ELEGIR: Muestra 5 intents para seleccionar
- MANUAL: Escribir intent personalizado
- UI compacta y moderna

#### 4. **Fixes anteriores mantenidos:**
- ProcessingOverlay aparece inmediatamente
- Error de React Hooks corregido
- Menú simplificado (sin PHOTO/STYLE/LIGHT/UP)
- Navegación a /result solo con imagen generada
- Identity Lock mejorado (solo se desactiva con reencuadre_ia > 5)

### Pilares Actualizados:

**PHOTOSCALER (9 sliders):**
- limpieza_artefactos, geometria, optica, chronos, senal_raw, sintesis_adn, grano_filmico, enfoque, resolucion

**STYLESCALER (9 sliders):**
- styling_piel, styling_pelo, styling_ropa, maquillaje, limpieza_entorno, reencuadre_ia, atmosfera, look_cine, materiales_pbr

**LIGHTSCALER (9 sliders):**
- key_light, fill_light, rim_light, volumetria, temperatura, contraste, sombras, estilo_autor, reflejos

### 7. Modal de Confirmación de Visión (NUEVO)
- ✅ `VisionConfirmModal.tsx` - Muestra resultados del análisis
  - Score técnico (0-10)
  - Semantic anchors (elementos a preservar)
  - Problemas detectados
  - Perfil recomendado
  - Botones: Procesar / Personalizar / Cancelar

### 8. Flujo de Procesamiento v28
```
Subir imagen → Edge: vision-analysis → VisionConfirmModal → 
Usuario confirma → Edge: prompt-compiler → Edge: generate-image → Resultado
```

---

## 🗄️ Estructura de Base de Datos (Supabase)

### Tabla: `user_profiles`
```sql
- id: UUID (PK, FK a auth.users)
- email: TEXT
- user_mode: TEXT ('auto' | 'user' | 'pro' | 'prolux')
- tokens_balance: INTEGER (default 50)
- full_name: TEXT
- username: TEXT
- current_config: JSONB (configuración de sliders)
```

### Tabla: `slider_semantic_mappings` (v28)
```sql
- id: UUID
- pillar_name: TEXT ('photoscaler' | 'stylescaler' | 'lightscaler')
- slider_name: TEXT
- instruction_off: TEXT
- instruction_low: TEXT
- instruction_med: TEXT
- instruction_high: TEXT
- instruction_force: TEXT
```

---

## 📦 Edge Functions

### vision-analysis
- **Modelo**: `gemini-2.5-flash-preview-05-20`
- **Input**: imageUrl o imageBase64
- **Output**: technical_score, semantic_anchors, suggested_settings, detected_issues, recommended_profile

### prompt-compiler
- **Input**: slider config, visionAnalysis, userMode
- **Output**: compiled prompt con bloques PHOTOSCALER/STYLESCALER/LIGHTSCALER
- **Features**: Veto rules, Identity Lock

### generate-image
- **Modelo**: Según userMode (Flash para auto/user, Pro para pro/prolux)
- **Input**: imageUrl, compiledPrompt, outputType
- **Output**: generated image, tokens charged

---

## 🔧 Configuración Técnica

### Frontend
- **Framework**: React 19 + Vite + TypeScript
- **Styling**: TailwindCSS + Shadcn/UI
- **Auth**: Supabase Auth
- **Edge Calls**: `/services/edgeFunctionsService.ts`

### Backend (Fallback)
- **Framework**: FastAPI (Python)
- **AI**: Google Gemini API
- **DB**: Supabase (PostgreSQL)

### Credenciales
- **Supabase URL**: `https://uxqtxkuldjdvpnojgdsh.supabase.co`
- **Admin**: `usajosefernan@gmail.com` / `111111`

---

## 📝 Tareas Pendientes (Backlog)

### P0 - Alta Prioridad
- [x] Crear Edge Functions (vision-analysis, prompt-compiler, generate-image)
- [x] VisionConfirmModal con análisis de visión
- [ ] **DEPLOY Edge Functions** (requiere Docker en local) - Ver `/app/BBLA/DEPLOY_EDGE_FUNCTIONS.md`

### P1 - Media Prioridad  
- [ ] Poblar tabla `slider_semantic_mappings` con los 27 sliders
- [ ] Integración Stripe para pagos reales
- [ ] Sistema de presets de usuario

### P2 - Baja Prioridad
- [ ] In-painting y refining features
- [ ] Galería de imágenes del usuario
- [ ] API batch processing para PROLUX

---

## 📂 Archivos Clave

```
/app
├── frontend/src/
│   ├── components/
│   │   ├── VisionConfirmModal.tsx   # NUEVO: Confirmación de análisis
│   │   ├── ProfileConfigModal.tsx   # UI 4 perfiles
│   │   └── Navigation.tsx           # Balance sincronizado
│   ├── services/
│   │   ├── edgeFunctionsService.ts  # NUEVO: Cliente Edge Functions
│   │   ├── authService.ts
│   │   └── paymentService.ts
│   └── App.tsx                      # Flujo v28 integrado
├── supabase/functions/
│   ├── vision-analysis/index.ts     # NUEVO: Gemini 2.5 Flash
│   ├── prompt-compiler/index.ts     # NUEVO: Semantic compiler
│   └── generate-image/index.ts      # NUEVO: Image generation
└── BBLA/
    ├── DEPLOY_EDGE_FUNCTIONS.md     # NUEVO: Guía de deploy
    ├── maestro arqu.md              # Arquitectura v28
    └── PRICING.md                   # Sistema de pricing
```

---

## 📅 Changelog

### 2026-01-21 (Sesión Actual)
- ✅ **PROLUX UI Mejorada**: Nuevo diseño compacto tipo grid para los 27 sliders
  - Toggle entre modo "Compacto" (grid 3x9) y "Detallado" (acordeón con descripciones)
  - Controles rápidos (1, 5, 10) para ajuste rápido de valores
  - Indicadores de nivel con colores (gris/azul/púrpura/dorado)
- ✅ **Archives Viewer Corregido**: Slider de comparación antes/después perfectamente alineado
  - Imágenes forzadas a las mismas dimensiones usando `displaySize`
  - Zoom funcional con rueda del mouse
  - Pan funcional arrastrando con el mouse
  - Handlers separados para carga de imágenes antes/después

### 2026-01-20
- ✅ Corregido API key de Supabase (anon_key)
- ✅ Usuario admin configurado como PROLUX con 99999 tokens
- ✅ Balance de tokens sincronizado en navbar (999999 TKN)
- ✅ Click en tokens → navega a /pricing
- ✅ Panel Admin visible para usuarios PROLUX
- ✅ Página de Pricing actualizada con precios v28
- ✅ Creado `ProfileConfigModal` con 4 UIs de perfil
- ✅ **NUEVO**: Edge Function `vision-analysis` (Gemini 2.5 Flash)
- ✅ **NUEVO**: Edge Function `prompt-compiler` (Semantic mapping)
- ✅ **NUEVO**: Edge Function `generate-image`
- ✅ **NUEVO**: `VisionConfirmModal` para confirmación post-análisis
- ✅ **NUEVO**: `edgeFunctionsService.ts` para llamar Edge Functions
- ✅ **NUEVO**: Flujo v28 integrado en App.tsx
