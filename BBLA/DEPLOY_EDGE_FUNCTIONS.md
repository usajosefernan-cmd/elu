# 🚀 LuxScaler v28 - Guía de Deploy de Edge Functions

## Pre-requisitos

1. **Instalar Supabase CLI**:
```bash
npm install -g supabase
```

2. **Instalar Docker Desktop** (requerido para Edge Functions):
- Mac: https://docs.docker.com/desktop/mac/install/
- Windows: https://docs.docker.com/desktop/windows/install/

3. **Login a Supabase**:
```bash
supabase login
```

---

## 📦 Deploy de Edge Functions

### Paso 1: Configurar Secrets

Antes de desplegar, configura las API keys:

```bash
cd /app

# Configura el proyecto
supabase link --project-ref uxqtxkuldjdvpnojgdsh

# Agrega secrets (las Edge Functions las necesitan)
supabase secrets set GOOGLE_API_KEY=AIzaSyAM1iSrdG5FS1twfl7WPckl5ea6VNHXEtw
supabase secrets set GOOGLE_API_KEY_2=AIzaSyC0L93u9XCe_3nwWRqPwOSYjMb5-dA3Uhs2AJMoB8
supabase secrets set GOOGLE_API_KEY_3=AIzaSyD3c37S0SiykfDzHP2T9ZhShw9ialTHuFE
```

### Paso 2: Deploy de Funciones

```bash
# Deploy vision-analysis (Gemini 2.5 Flash)
supabase functions deploy vision-analysis --project-ref uxqtxkuldjdvpnojgdsh

# Deploy prompt-compiler
supabase functions deploy prompt-compiler --project-ref uxqtxkuldjdvpnojgdsh

# Deploy generate-image
supabase functions deploy generate-image --project-ref uxqtxkuldjdvpnojgdsh
```

### Paso 3: Verificar Deploy

```bash
# Lista funciones deployadas
supabase functions list --project-ref uxqtxkuldjdvpnojgdsh
```

---

## 🔧 URLs de las Edge Functions

Una vez deployadas, las URLs serán:

- **Vision Analysis**: `https://uxqtxkuldjdvpnojgdsh.supabase.co/functions/v1/vision-analysis`
- **Prompt Compiler**: `https://uxqtxkuldjdvpnojgdsh.supabase.co/functions/v1/prompt-compiler`
- **Generate Image**: `https://uxqtxkuldjdvpnojgdsh.supabase.co/functions/v1/generate-image`

---

## 📋 Test Manual

### Test Vision Analysis:
```bash
curl -X POST 'https://uxqtxkuldjdvpnojgdsh.supabase.co/functions/v1/vision-analysis' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4cXR4a3VsZGpkdnBub2pnZHNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDQ3MTIsImV4cCI6MjA4MzkyMDcxMn0.wX6nlBOHM-9Srd-BWCE2v2SsK3hSLnlBiciA5T5SE2M' \
  -H 'Content-Type: application/json' \
  -d '{"imageUrl": "https://example.com/test.jpg"}'
```

---

## 🗂️ Estructura de Archivos

```
/app/supabase/functions/
├── vision-analysis/
│   └── index.ts      # Gemini 2.5 Flash Vision
├── prompt-compiler/
│   └── index.ts      # Semantic mapper + Veto rules
└── generate-image/
    └── index.ts      # Image generation with prompt
```

---

## ⚠️ Notas Importantes

1. **Docker debe estar corriendo** antes de ejecutar `supabase functions deploy`
2. **Los secrets son sensibles** - no los compartas públicamente
3. **El modelo Gemini 2.5 Flash** (`gemini-2.5-flash-preview-05-20`) puede cambiar - actualiza si es necesario
4. **Rate limits**: Supabase Edge Functions tienen límites de 60s timeout

---

## 🔄 Flujo de Procesamiento

```
1. Usuario sube imagen
          ↓
2. Frontend llama a /vision-analysis (Edge Function)
          ↓
3. Gemini 2.5 Flash analiza imagen
          ↓
4. Se muestra VisionConfirmModal con resultados
          ↓
5. Usuario confirma → /prompt-compiler (Edge Function)
          ↓
6. Prompt compilado → /generate-image (Edge Function)
          ↓
7. Imagen mejorada retornada al frontend
```
