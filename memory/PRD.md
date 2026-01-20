# LuxScaler v28 - Product Requirements Document

## 📋 Resumen del Proyecto
LuxScaler es una aplicación de procesamiento de imágenes impulsada por IA que utiliza modelos de Google Gemini para mejorar, restaurar y estilizar fotografías.

---

## ✅ Funcionalidades Implementadas (Sesión 2026-01-20)

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

### 6. Modal de Configuración por Perfil (NUEVO)
- ✅ `ProfileConfigModal.tsx` creado con 4 UIs:
  - AUTO: Botón simple "Generar con IA"
  - USER: 3 sliders por pilar (Photo/Style/Light)
  - PRO: Grid de 9 macros seleccionables
  - PROLUX: Grid de 27 sliders individuales
- ✅ Se muestra automáticamente al subir foto (usuarios logueados)

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
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### Pendiente: Tablas adicionales (SQL en /app/BBLA/SCHEMA_v28_COMPLETE.sql)
- `billing_tiers` - Configuración de pricing
- `token_costs` - Costos por acción
- `user_transactions` - Historial de transacciones

---

## 🔧 Configuración Técnica

### Frontend
- **Framework**: React 19 + Vite + TypeScript
- **Styling**: TailwindCSS + Shadcn/UI
- **Auth**: Supabase Auth

### Backend
- **Framework**: FastAPI (Python)
- **AI**: Google Gemini API
- **DB**: Supabase (PostgreSQL)

### Credenciales
- **Supabase URL**: `https://uxqtxkuldjdvpnojgdsh.supabase.co`
- **Admin**: `usajosefernan@gmail.com` / `111111`

---

## 📝 Tareas Pendientes (Backlog)

### P0 - Alta Prioridad
- [ ] Crear tablas `billing_tiers`, `token_costs` en Supabase SQL Editor
- [ ] Integración Stripe para pagos reales

### P1 - Media Prioridad  
- [ ] Sistema de presets de usuario
- [ ] Historial de procesamiento

### P2 - Baja Prioridad
- [ ] In-painting y refining features
- [ ] Galería de imágenes del usuario
- [ ] API batch processing para PROLUX

---

## 📂 Archivos Clave Actualizados

```
/app/frontend/src/
├── components/
│   ├── Navigation.tsx           # Balance sincronizado, click→pricing
│   ├── ProfileConfigModal.tsx   # NUEVO: UI 4 perfiles
│   └── PricingPage.tsx          # Precios actualizados v28
├── services/
│   ├── authService.ts           # Mapeo profile_type
│   └── paymentService.ts        # getBalance con logs
├── types.ts                     # UserProfile extendido
└── App.tsx                      # ProfileConfigModal integrado
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
- ✅ Integrado ProfileConfigModal en flujo de subida de fotos
