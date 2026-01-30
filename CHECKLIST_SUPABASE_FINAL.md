# 🚀 CHECKLIST COMPLETO PARA SUPABASE

## ✅ YA COMPLETADO (POR MÍ):

- ✅ 11 tablas creadas
- ✅ 74 filas de datos pobladas
- ✅ RLS policies aplicadas
- ✅ Profile admin creado
- ✅ Workflow por defecto creado
- ✅ Buckets creados (via SQL)

---

## ⚠️ FALTA (DEBES HACER EN DASHBOARD):

### 1. CONFIGURAR SECRETS

**Ve a:** Supabase Dashboard → Project Settings → Edge Functions → Manage Secrets

**Añade estos secrets:**

```bash
GEMINI_API_KEY=AIzaSyBA06K25LtsHGy7icai5-dA3Uhs2AJMoB8
LAOZHANG_API_KEY=sk-aduYr9zcGnV39Vpj238041B0Af384432BeFf37C5E8F8Bf24
```

**IMPORTANTE:** Usa `LAOZHANG_API_KEY` (no NANO_BANANA_API_KEY)

---

### 2. VERIFICAR EDGE FUNCTIONS

**Ve a:** Edge Functions

**Deben estar deployadas:**
- ✅ prompt-compiler
- ✅ generate-image
- ⚠️ vision-orchestrator (deployar si falta)

**Si vision-orchestrator no está:**
- New Function → vision-orchestrator
- Copiar código de `/app/luxv41/02luxv41edge.md` líneas 17-294
- Deploy

---

### 3. VERIFICAR BUCKETS

**Ve a:** Storage

**Deben existir:**
- generations_public
- generations_private

**Si no existen:**
- New bucket → generations_public (Public: YES)
- New bucket → generations_private (Public: NO)

---

### 4. TEST COMPLETO

**Después de configurar secrets:**

1. Sube una foto en la app
2. Debe funcionar sin error 403
3. Verifica en Table Editor → generations (debe tener 1+ filas)
4. Verifica Archives (debe mostrar la imagen)

---

## 📋 RESUMEN DE SECRETS NECESARIOS:

```
SUPABASE_URL=https://uxqtxkuldjdvpnojgdsh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sbp_0d9969a3b1c2a9a997b8f9ec171445ce490c8ec4
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GEMINI_API_KEY=AIzaSyBA06K25LtsHGy7icai5-dA3Uhs2AJMoB8
LAOZHANG_API_KEY=sk-aduYr9zcGnV39Vpj238041B0Af384432BeFf37C5E8F8Bf24
```

(Los primeros 3 ya están configurados por defecto en Supabase)

---

## 🎯 ORDEN DE EJECUCIÓN:

1. ✅ Configurar GEMINI_API_KEY secret
2. ✅ Configurar LAOZHANG_API_KEY secret
3. ✅ Verificar buckets existen
4. ✅ Verificar Edge Functions deployadas
5. ✅ Test: Subir foto

**Después de esto, TODO debe funcionar** 🚀
