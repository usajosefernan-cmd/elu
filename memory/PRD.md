# LuxScaler v28 - Product Requirements Document

## 📋 Resumen del Proyecto
LuxScaler es una aplicación de procesamiento de imágenes impulsada por IA que utiliza modelos de Google Gemini para mejorar, restaurar y estilizar fotografías.

---

## ✅ Funcionalidades Implementadas

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
- **Balance de tokens** visible en navbar
- **Admin (PROLUX)**: 999999 tokens (ilimitado)
- **Usuarios nuevos**: 50 tokens gratis (5 previews con marca de agua)
- **Costos**:
  - Preview con marca: 10 tokens
  - Preview limpio: 15 tokens
  - Master 4K: 50 tokens
  - Master 8K: 100 tokens

### 4. Página de Pricing
- **Starter**: €1.99 - 200 tokens
- **Creator**: €9.99 - 1,200 tokens (desbloquea USER)
- **Pro**: €29.99 - 4,000 tokens (desbloquea PRO)
- **Studio**: €99.99 - 15,000 tokens (desbloquea PROLUX)

### 5. Panel de Administración
- **Acceso exclusivo** para usuarios con `user_mode = 'prolux'`
- **Menú admin** visible en dropdown del usuario
- **Ruta**: `/admin`

### 6. UI/UX
- **Navbar responsive** con menú móvil
- **Tema oscuro** con acentos dorados (lumen-gold)
- **Sliders de control de defectos** (Motion Blur, Focus, Distortion, etc.)
- **Multi-idioma**: ES/EN

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

### Pendiente: Tablas adicionales
- `billing_tiers` - Configuración de pricing
- `token_costs` - Costos por acción
- `user_transactions` - Historial de transacciones
- `processing_jobs` - Trabajos de procesamiento

---

## 🔧 Configuración Técnica

### Frontend
- **Framework**: React 19 + Vite + TypeScript
- **Styling**: TailwindCSS + Shadcn/UI
- **Estado**: React Context + Supabase Realtime
- **Auth**: Supabase Auth

### Backend
- **Framework**: FastAPI (Python)
- **AI**: Google Gemini API
- **DB**: Supabase (PostgreSQL)

### Credenciales Supabase
- **URL**: `https://uxqtxkuldjdvpnojgdsh.supabase.co`
- **Anon Key**: Configurada en `/app/frontend/.env`

---

## 📝 Tareas Pendientes (Backlog)

### P0 - Alta Prioridad
- [ ] Crear tablas `billing_tiers`, `token_costs` en Supabase (SQL Editor)
- [ ] Implementar integración con Stripe para pagos reales
- [ ] Deploy de Edge Functions (requiere Docker)

### P1 - Media Prioridad
- [ ] Componente `ProfileConfigModal` integrado en flujo de procesamiento
- [ ] Sistema de presets de usuario
- [ ] Historial de procesamiento

### P2 - Baja Prioridad
- [ ] In-painting y refining features
- [ ] Galería de imágenes del usuario
- [ ] API batch processing para PROLUX

---

## 📂 Archivos Clave

```
/app
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navigation.tsx      # Navbar con menú admin
│   │   │   ├── ProfileConfigModal.tsx  # UI de 4 perfiles
│   │   │   ├── PricingPage.tsx     # Página de precios v28
│   │   │   └── AuthModal.tsx       # Modal de login
│   │   ├── services/
│   │   │   ├── authService.ts      # Auth + Token management
│   │   │   └── paymentService.ts   # Balance + Spend tokens
│   │   └── types.ts                # Tipos TypeScript
│   └── .env                        # Supabase credentials
├── backend/
│   ├── services/
│   │   └── prompt_compiler_service.py
│   └── .env                        # Google API Keys
└── BBLA/
    ├── CREDENTIALS.json            # Supabase credentials backup
    ├── PRICING.md                  # Documentación de pricing
    └── SCHEMA_v28_COMPLETE.sql     # SQL para tablas pendientes
```

---

## 🧪 Testing

### Credenciales de Prueba
- **Email**: `usajosefernan@gmail.com`
- **Password**: `111111`
- **Perfil**: PROLUX (Admin)

### URLs
- **Frontend**: https://lux-imaging.preview.emergentagent.com
- **Pricing**: https://lux-imaging.preview.emergentagent.com/pricing

---

## 📅 Changelog

### 2026-01-20
- ✅ Corregido error de API key de Supabase
- ✅ Actualizado usuario admin a PROLUX con 99999 tokens
- ✅ Corregido `paymentService.ts` para usar `user_mode` en lugar de `is_admin`
- ✅ Corregido `authService.ts` para mapear correctamente perfil
- ✅ Actualizada página de Pricing con nuevos precios v28
- ✅ Creado componente `ProfileConfigModal` con 4 UIs de perfil
- ✅ Panel de Admin ahora visible para usuarios PROLUX
- ✅ Balance de tokens muestra 999999 para admin
