# DEPLOY ALL EDGE FUNCTIONS (NO JWT VERIFICATION)
# Solución Global: Despliega TODAS las funciones sin verificación JWT
# Uso: .\scripts\deploy_all_functions.ps1

Write-Host "🚀 DEPLOYING ALL EDGE FUNCTIONS (NO JWT)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$functionsPath = Join-Path $PSScriptRoot "..\supabase\functions"

# Get all function directories (exclude _shared)
$functions = Get-ChildItem -Path $functionsPath -Directory | Where-Object { $_.Name -ne "_shared" }

if ($functions.Count -eq 0) {
    Write-Host "❌ No functions found in $functionsPath" -ForegroundColor Red
    exit 1
}

Write-Host "`n📦 Found $($functions.Count) functions to deploy:" -ForegroundColor Yellow
$functions | ForEach-Object { Write-Host "   - $($_.Name)" -ForegroundColor Gray }

Write-Host "`n"

$successCount = 0
$failCount = 0

foreach ($fn in $functions) {
    Write-Host "🔄 Deploying: $($fn.Name)..." -ForegroundColor White -NoNewline
    
    try {
        # Deploy with --no-verify-jwt flag (GLOBAL FIX)
        $result = npx supabase functions deploy $fn.Name --no-verify-jwt 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host " ✅" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host " ❌ ($result)" -ForegroundColor Red
            $failCount++
        }
    } catch {
        Write-Host " ❌ Exception: $_" -ForegroundColor Red
        $failCount++
    }
}

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "📊 RESULTS: $successCount deployed, $failCount failed" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Yellow" })
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "✅ ALL FUNCTIONS DEPLOYED WITHOUT JWT VERIFICATION" -ForegroundColor Green
} else {
    Write-Host "⚠️ Some functions failed. Check logs above." -ForegroundColor Yellow
}
