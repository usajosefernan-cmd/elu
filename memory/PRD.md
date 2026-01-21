# LuxScaler v28 - Product Requirements Document

## 📋 Resumen del Proyecto
LuxScaler es una aplicación de procesamiento de imágenes impulsada por IA que utiliza modelos de Google Gemini para mejorar, restaurar y estilizar fotografías.

---

## ✅ Funcionalidades Implementadas (Sesión 2026-01-21)

### FIXES CRÍTICOS ESTA SESIÓN:
1. **✅ ProcessingOverlay aparece INMEDIATAMENTE** - Movido fuera del bloque condicional
2. **✅ Error de React Hooks corregido** en ProfileConfigModal.tsx
3. **✅ Menú limpio** - Eliminados enlaces PHOTO, STYLE, LIGHT, UP
4. **✅ Sistema de notificaciones mejorado** - Toast con iconos y duración variable
5. **✅ Navegación a /result** solo cuando hay imagen generada (evita grid vacío)
6. **✅ Mobile-first** - Dock inferior con Inicio | Upload | Archivo

### 1. Sistema de Autenticación (Supabase)
- **Login/Registro** funcional con Supabase Auth
- **Perfil de usuario** almacenado en tabla `user_profiles`
- **Admin user**: `usajosefernan@gmail.com` con perfil PROLUX

### 2. Sistema de Perfiles de Usuario (4 Niveles)
| Perfil | Descripción | UI |
|--------|-------------|-----|
| **AUTO** | Por defecto, IA decide todo | Sin controles visibles |
| **USER** | Control básico | 3 Sliders por pilar |
| **PRO** | Control avanzado | 9 Macros temáticos |
| **PROLUX** | Control total + Admin | 27 Sliders individuales |

### 3. Sistema de Tokens
- ✅ **Balance de tokens** sincronizado en navbar (999999 TKN para admin)
- ✅ **Click en balance** → Abre página de Pricing
- **Admin (PROLUX)**: 999999 tokens (ilimitado)
- **Usuarios nuevos**: 50 tokens gratis (5 previews con marca de agua)
- **Costos**:
  - Preview con marca: 10 tokens
  - Preview limpio: 15 tokens
  - Master 4K: 50 tokens
  - Master 8K: 100 tokens

### 4. Página de Pricing (Actualizada v28)
- ✅ **Starter**: €1.99 - 200 tokens (Perfil AUTO)
- ✅ **Creator**: €9.99 - 1,200 tokens (desbloquea USER)
- ✅ **Pro**: €29.99 - 4,000 tokens (desbloquea PRO + 9 Macros)
- ✅ **Studio**: €99.99 - 15,000 tokens (desbloquea PROLUX)

### 5. Panel de Administración
- ✅ **Acceso exclusivo** para usuarios con `user_mode = 'prolux'`
- ✅ **Menú admin** visible en dropdown del usuario
- **Ruta**: `/admin`

### 6. Edge Functions (NUEVO - v28 Architecture)
- ✅ **vision-analysis** - Análisis con Gemini 2.5 Flash
- ✅ **prompt-compiler** - Compila sliders → instrucciones semánticas
- ✅ **generate-image** - Genera imagen mejorada
- ✅ **Frontend service** `edgeFunctionsService.ts` para llamar las funciones

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

### 2026-01-20 (Sesión Actual)
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
