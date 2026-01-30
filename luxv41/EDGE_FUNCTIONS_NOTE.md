# 🔧 CORRECCIÓN: Edge Functions vs FastAPI

## ⚠️ IMPORTANTE PARA ANTIGRAVITY

Este proyecto usa **SUPABASE EDGE FUNCTIONS**, no FastAPI.

### Diferencias Clave:

**Backend:**
- ❌ FastAPI (Python)
- ✅ Edge Functions (Deno/TypeScript)

**Ubicación:**
- ❌ /app/backend/routes/
- ✅ supabase/functions/

**Secrets:**
- ❌ .env files
- ✅ Supabase Dashboard → Secrets

---

## 📍 PARA ANTIGRAVITY

**1. Lee:** `/app/luxv41/02luxv41edge.md`
   - Contiene código Edge Functions correcto

**2. Adapta mental:** FastAPI → Edge Functions

**3. Secrets en Supabase:**
```
GOOGLE_API_KEY=AIzaSyBA06K25LtsHGy7icai5-dA3Uhs2AJMoB8
LAOZHANG_API_KEY=sk-aduYr9zcGnV39Vpj238041B0Af384432BeFf37C5E8F8Bf24
```

**4. API Key Leaked:**
- ❌ AIzaSyAM1iSrdG5FS1twfl7WPckl5ea6VNHXEtw (reportada)
- ✅ AIzaSyBA06K25LtsHGy7icai5-dA3Uhs2AJMoB8 (usar)

Ver guía completa en `/app/luxv41/`
