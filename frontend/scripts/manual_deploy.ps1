$ErrorActionPreference = "Stop"

Write-Host ">>> INICIANDO DESPLIEGUE LUXSCALER V2 (SUPABASE) <<<" -ForegroundColor Cyan

# 1. CREDENCIALES (Bypass Login)
$Env:SUPABASE_ACCESS_TOKEN = "sbp_04adaab0d1790b65a2307f342826f4b51c16e466"
$PROJECT_REF = "pjscnzymofaijevonxkm"

# 2. DIRECTORIO RAIZ (luxscaler_v2)
Set-Location "$PSScriptRoot\.."
Write-Host "Directorio de trabajo: $(Get-Location)" -ForegroundColor Gray

# 3. VERIFICACION DE SEGURIDAD
if (!(Test-Path "supabase")) {
    Write-Host "❌ ERROR: No se encuentra la carpeta 'supabase' en la raiz." -ForegroundColor Red
    exit 1
}

# 3.5 SINCRONIZACION DE BASE DE DATOS (DB PUSH)
Write-Host "`n>>> 🗄️ Sincronizando Base de Datos (Migrations)..." -ForegroundColor Yellow
cmd /c "npx supabase db push --project-ref $PROJECT_REF"
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Error en DB Push" -ForegroundColor Red; exit 1 }

# 4. DESPLIEGUE EDGE FUNCTIONS
Write-Host "`n>>> 🚀 Desplegando Edge Functions..." -ForegroundColor Yellow

# Function: preview-generator
Write-Host "   - Deploying: preview-generator"
cmd /c "npx supabase functions deploy preview-generator --project-ref $PROJECT_REF --no-verify-jwt"
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Error en preview-generator" -ForegroundColor Red; exit 1 }

# Function: master-sculptor
Write-Host "   - Deploying: master-sculptor"
cmd /c "npx supabase functions deploy master-sculptor --project-ref $PROJECT_REF --no-verify-jwt"
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Error en master-sculptor" -ForegroundColor Red; exit 1 }

# 5. MENSAJE FINAL
Write-Host "`n>>> ✅ DESPLIEGUE COMPLETADO EN LA NUBE <<<" -ForegroundColor Green
Write-Host "Las funciones están activas en el proyecto: $PROJECT_REF"
