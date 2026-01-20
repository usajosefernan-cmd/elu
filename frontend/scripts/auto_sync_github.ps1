# ============================================================================
# AUTO-SYNC SCRIPT - Sincronización continua con GitHub
# Ejecutar: powershell -File scripts/auto_sync_github.ps1
# ============================================================================

param(
    [switch]$Watch,           # Modo watch continuo
    [int]$IntervalSeconds = 300  # Intervalo entre syncs (5 min default)
)

$ProjectRoot = "c:\Users\yo\Pictures\Descargaspc\antigravity\luxscaler_v2"
Set-Location $ProjectRoot

function Write-Status($msg) {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $msg" -ForegroundColor Cyan
}

function Sync-ToGitHub {
    Write-Status "Iniciando sincronización..."
    
    # Check for changes
    $status = git status --porcelain
    if (-not $status) {
        Write-Host "  Sin cambios pendientes" -ForegroundColor Gray
        return
    }
    
    # Count changes
    $added = ($status | Where-Object { $_ -match '^\?\?' }).Count
    $modified = ($status | Where-Object { $_ -match '^.M' }).Count
    $deleted = ($status | Where-Object { $_ -match '^.D' }).Count
    
    Write-Host "  Cambios: +$added | ~$modified | -$deleted" -ForegroundColor Yellow
    
    # Stage all changes
    git add -A
    
    # Generate commit message with timestamp
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    $commitMsg = "Auto-sync: $timestamp | +$added ~$modified -$deleted"
    
    # Commit
    git commit -m $commitMsg
    
    # Push to origin (if configured)
    $remote = git remote
    if ($remote) {
        Write-Status "Pushing a GitHub..."
        git push origin main 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ Sincronizado con GitHub" -ForegroundColor Green
        }
        else {
            Write-Host "  ⚠️ Push falló - revisar configuración" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "  ⚠️ No hay remote configurado" -ForegroundColor Yellow
        Write-Host "  Ejecuta: git remote add origin https://github.com/TU_USUARIO/luxscaler_v2.git" -ForegroundColor Gray
    }
}

# Header
Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "  LUXSCALER V2 - AUTO SYNC TO GITHUB" -ForegroundColor Yellow
Write-Host ("=" * 60) -ForegroundColor Cyan

if ($Watch) {
    Write-Host "`nModo WATCH activo - Sincronizando cada $IntervalSeconds segundos"
    Write-Host "Presiona Ctrl+C para detener`n"
    
    while ($true) {
        Sync-ToGitHub
        Write-Host "`nPróxima sync en $IntervalSeconds segundos..." -ForegroundColor Gray
        Start-Sleep -Seconds $IntervalSeconds
    }
}
else {
    # Single sync
    Sync-ToGitHub
}

Write-Host "`n"
