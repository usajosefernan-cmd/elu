# 🔧 IMPLEMENTACIÓN CORRECTA SEGÚN DOCUMENTOS

## ✅ LO QUE ESTÁ EN SUPABASE (VERIFICADO):

**Edge Functions deployadas:**
- ✅ prompt-compiler (ACTIVA)
- ✅ generate-image (ACTIVA)
- ✅ save-preset (ACTIVA)
- ❌ vision-orchestrator (NO deployada - NECESARIA)

**Tablas con datos:**
- ✅ tier_config (4)
- ✅ taxonomy_definitions (21)
- ✅ diagnosis_definitions (10)
- ✅ slider_definitions (27)
- ✅ macro_definitions (12)
- ✅ uploads (112)
- ❌ generations (0) ← POR ESO ARCHIVES VACÍO
- ❌ analysis_results (0)

---

## 🔑 SECRETS QUE DEBEN ESTAR EN SUPABASE

En Supabase Dashboard → Project Settings → Edge Functions → Secrets:

```bash
SUPABASE_URL=https://uxqtxkuldjdvpnojgdsh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sbp_0d9969a3b1c2a9a997b8f9ec171445ce490c8ec4
GEMINI_API_KEY=AIzaSyBA06K25LtsHGy7icai5-dA3Uhs2AJMoB8  # NO la leaked
NANO_BANANA_ENDPOINT=https://api.laozhang.ai/v1beta/models/gemini-3-pro-image-preview:generateContent
NANO_BANANA_API_KEY=sk-aduYr9zcGnV39Vpj238041B0Af384432BeFf37C5E8F8Bf24
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4cXR4a3VsZGpkdnBub2pnZHNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDQ3MTIsImV4cCI6MjA4MzkyMDcxMn0.wX6nlBOHM-9Srd-BWCE2v2SsK3hSLnlBiciA5T5SE2M
```

---

## 📦 BUCKETS QUE DEBEN EXISTIR

En Supabase Dashboard → Storage → New Bucket:

1. **generations_public**
   - Public: YES
   - File size limit: 50MB
   
2. **generations_private**
   - Public: NO
   - File size limit: 50MB

---

## ⚡ EDGE FUNCTION QUE FALTA: vision-orchestrator

Código completo en `/app/luxv41/02luxv41edge.md` líneas 16-294

**Deploy:**
```bash
# En terminal con Supabase CLI:
cd supabase/functions
mkdir -p vision-orchestrator
# Copiar código del documento
nano vision-orchestrator/index.ts
# Pegar código de 02luxv41edge.md

supabase functions deploy vision-orchestrator
```

---

## 🔧 ARREGLOS NECESARIOS

### 1. Frontend debe llamar Edge Functions correctamente

**En vez de FastAPI fallback, debe:**

```typescript
// edgeFunctionsService.ts
const result = await fetch(`${SUPABASE_URL}/functions/v1/generate-image`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: compiledPrompt,
    config: generationConfig,
    uploadId: uploadId,
    imageBase64: imageBase64,
    variationIndex: 0,
    preset: null
  })
});
```

### 2. Edge Function generate-image DEBE guardar en generations

**Código del documento (línea 523-536):**
```typescript
await supabase.from("generations").insert({
  upload_id: uploadId,
  prompt_used: prompt,
  config_used: {
    seed: apiPayload.seed,
    strength: apiPayload.strength,
    guidance: apiPayload.guidance_scale,
    preset_id: preset?.id || null,
  },
  clean_url: cleanFileName,
  watermarked_url: previewPublicUrl,
  is_preview: true,
  tokens_spent: 0,
});
```

**Esto NO se está ejecutando porque:**
- Buckets no existen (generations_public, generations_private)
- O NANO_BANANA_ENDPOINT no está configurado

---

## ✅ PLAN DE ACCIÓN INMEDIATO

### PASO 1: Configurar Secrets en Supabase

```
Dashboard → Settings → Edge Functions → Secrets → Add Secret
```

Añadir:
- NANO_BANANA_ENDPOINT
- NANO_BANANA_API_KEY
- GEMINI_API_KEY (la buena, no leaked)

### PASO 2: Crear Buckets

```
Dashboard → Storage → New Bucket
```

Crear:
- generations_public (public)
- generations_private (private)

### PASO 3: Deploy vision-orchestrator

```bash
supabase functions deploy vision-orchestrator
```

O copiar código de 02luxv41edge.md y deployar manualmente

### PASO 4: Test

1. Sube foto
2. Verifica que se crea fila en `analysis_results`
3. Verifica que se crea fila en `generations`
4. Archives debe mostrar la imagen

---

## 🎯 RESUMEN

**El sistema SÍ funciona en Supabase, pero falta:**
1. ❌ vision-orchestrator Edge Function
2. ❌ Secrets configurados (NANO_BANANA_*)
3. ❌ Buckets creados
4. ❌ Frontend debe esperar respuesta correcta

**Estos son pasos MANUALES que debes hacer en Supabase Dashboard**

Documentación completa en `/app/luxv41/02luxv41edge.md`
