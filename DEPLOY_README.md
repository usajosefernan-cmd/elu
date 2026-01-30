# Preparación para GitHub - LuxScaler v41

Esta carpeta contiene todo lo necesario para deployment independiente.

## Estructura del Proyecto

```
luxscaler/
├── frontend/              # React + Vite frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── services/     # API services
│   │   ├── utils/        # Utilities (BiopsyEngine)
│   │   └── hooks/        # React hooks
│   └── package.json
│
├── backend/              # FastAPI backend (opcional)
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   └── migrations/      # SQL migrations
│
├── luxv41/              # Complete documentation
│   ├── GUIA_COMPLETA_PARA_ANTIGRAVITY.md
│   ├── API_REFERENCE.md
│   └── ... (12 docs total)
│
├── supabase/            # Supabase config (crear)
│   ├── migrations/      # SQL files
│   └── functions/       # Edge Functions (si usas)
│
└── README.md           # This file
```

## Archivos Importantes

### Base de Datos:
- `backend/migrations/v41_01_create_tables.sql` - Schema completo
- `backend/migrations/v41_02_rls_policies.sql` - Security policies
- `backend/insert_sliders_v41.py` - Data population

### Frontend Core:
- `frontend/src/components/SimplePillarControl.tsx`
- `frontend/src/components/MacroSliderGallery.tsx`
- `frontend/src/components/MicroSliderGrid.tsx`
- `frontend/src/components/SavePresetModal.tsx`
- `frontend/src/utils/biopsyEngine.ts`

### Backend Core:
- `backend/services/vision_orchestrator_v41.py`
- `backend/services/prompt_compiler_v41.py`
- `backend/services/laozhang_service.py`
- `backend/routes/v41_routes.py`

### Documentación:
- `luxv41/` - 12 documentos completos

## Deployment

### Opción 1: Supabase Edge Functions (Recomendado)
Seguir documentación en `luxv41/02luxv41edge.md`

### Opción 2: FastAPI Backend
El código FastAPI ya está implementado en `/backend/`

## Credenciales Necesarias

```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
GOOGLE_API_KEY=your_gemini_key
LAOZHANG_API_KEY=sk-your_key
```

Ver documentación completa en `/luxv41/GUIA_COMPLETA_PARA_ANTIGRAVITY.md`
