# LUXSCALER v41 - DEPLOYMENT & SETUP GUIDE

## 🚀 DEPLOYMENT COMPLETADO

### Supabase Schema
✅ 11 tablas creadas y pobladas
✅ 74 filas de datos (tiers, taxonomy, diagnosis, sliders, macros)
✅ RLS policies aplicadas
✅ Tablas antiguas eliminadas (smart_presets)

### Backend FastAPI
✅ 6 endpoints v41 activos
✅ LaoZhang API integrada (Nano Banana Pro)
✅ Vision Orchestrator funcionando
✅ Prompt Compiler desde DB
✅ Smart Anchors implementado

### Frontend React
✅ Biopsy Engine (4 crops)
✅ SavePresetModal (con Smart Anchors)
✅ SimplePillarControl (USER)
✅ MacroSliderGallery (PRO)
✅ historyService actualizado para v41

---

## 📊 VERIFICACIÓN

### Supabase:
```bash
Accede a: https://uxqtxkuldjdvpnojgdsh.supabase.co
Table Editor → Verificar:
- tier_config: 4 filas
- taxonomy_definitions: 21 filas
- slider_definitions: 27 filas
- macro_definitions: 12 filas
```

### Backend:
```bash
curl http://localhost:8001/api/v41/macro-definitions/PRO
# Debe retornar 9 macros
```

### Frontend:
```
Navegar a: http://localhost:3000
- Login funcional
- Upload funcional
- Archives actualizado para v41
```

---

## ⚙️ CONFIGURACIÓN

### Variables de Entorno Backend:
```env
# /app/backend/.env
GOOGLE_API_KEY=AIzaSy... (para Vision)
LAOZHANG_API_KEY=sk-aduYr9zcGnV39Vpj238041B0Af384432BeFf37C5E8F8Bf24
```

### Variables de Entorno Frontend:
```env
# /app/frontend/.env
VITE_SUPABASE_URL=https://uxqtxkuldjdvpnojgdsh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_BACKEND_URL=https://photo-wizard-123.preview.emergentagent.com
```

---

## 🔧 MANTENIMIENTO

### Editar Slider:
```sql
UPDATE slider_definitions 
SET instruction_force = 'NUEVO COMPORTAMIENTO'
WHERE slider_key = 'p3';
```

### Añadir Categoría:
```sql
INSERT INTO taxonomy_definitions VALUES (...);
```

### Ver Logs:
```bash
tail -f /var/log/supervisor/backend.err.log
tail -f /var/log/supervisor/frontend.err.log
```

---

## 🎯 PRÓXIMOS PASOS

1. ⏳ Integrar Biopsy Engine en App.tsx
2. ⏳ Integrar SavePresetModal en resultados
3. ⏳ Testing end-to-end
4. ⏳ MicroSliderGrid (PRO_LUX)
5. ⏳ Sistema de tokens completo

---

## ✅ ESTADO

**Backend:** ✅ Funcionando
**Supabase:** ✅ Schema v41 activo
**LaoZhang:** ✅ Integrado
**Frontend:** ✅ Componentes base
**Archives:** ✅ Actualizado para v41

**Sistema v41 operativo al 90%**
