$ErrorActionPreference = "Stop"
$ScriptDir = $PSScriptRoot
$ProjDir = Split-Path -Parent $ScriptDir
$ReportFile = Join-Path $ProjDir "B_SESSION_REPORT_TEMP.md"
$MasterMemory = Join-Path $ProjDir "B_MASTER_MEMORIA_V2.md"

# 🔄 ONE-SHOT SYNC LOGIC
if (Test-Path $ReportFile) {
    Write-Host ">>> SYNC TURBO: Detectado reporte temporal." -ForegroundColor Cyan
    
    $ReportContent = Get-Content $ReportFile -Raw
    
    if (Test-Path $MasterMemory) {
        $OldContent = Get-Content $MasterMemory -Raw
        $NewContent = "$ReportContent`n`n---`n`n$OldContent"
        Set-Content $MasterMemory $NewContent
        Write-Host ">>> Memoria Maestra vinculada." -ForegroundColor Green
    }
    else {
        Set-Content $MasterMemory $ReportContent
        Write-Host ">>> Nueva Memoria Maestra creada." -ForegroundColor Green
    }

    # Cleanup Cache
    Write-Host ">>> Limpiando caches..." -ForegroundColor Yellow
    $Caches = @("node_modules/.vite", "node_modules/.cache")
    foreach ($c in $Caches) {
        $p = Join-Path $ProjDir $c
        if (Test-Path $p) { Remove-Item -Recurse -Force $p -ErrorAction SilentlyContinue }
    }

    Remove-Item $ReportFile -Force
    Write-Host ">>> SYNC COMPLETADO EXITOSAMENTE. 🚀" -ForegroundColor Green
    exit
}

function Show-Menu {
    Clear-Host
    Write-Host "============================"
    Write-Host "  LUXSCALER V2 - FAST SYNC"
    Write-Host "============================"
    Write-Host "1. Apply SQL Migration"
    Write-Host "2. Deploy Edge Function"
    Write-Host "3. Set Secrets"
    Write-Host "4. Sync Types"
    Write-Host "5. Get Logs"
    Write-Host "6. FULL DEPLOY"
    Write-Host "7. System Cleanup"
    Write-Host "Q. Quit"
}

# Main Loop
while ($true) {
    Show-Menu
    $opt = Read-Host "Opción"
    switch ($opt) {
        "1" { Write-Host "Not implemented in one-shot mode yet." }
        "2" { Write-Host "Use deploy scripts." }
        "3" { Write-Host "Use secrets scripts." }
        "4" { Write-Host "Syncing..." }
        "5" { Write-Host "Logs..." }
        "6" { Write-Host "Deploying all..." }
        "7" { Write-Host "Cleaning..." }
        "Q" { exit }
        "q" { exit }
    }
    Read-Host "Enter para seguir"
}
