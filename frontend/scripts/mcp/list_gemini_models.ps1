param (
    [string]$ApiKey
)

$Url = "https://generativelanguage.googleapis.com/v1beta/models?key=$ApiKey"

Write-Host ">>> COMPROBANDO LLAVE Y MODELOS DISPONIBLES <<<" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri $Url -Method Get -ErrorAction Stop
    $models = $response.models
    
    Write-Host "✅ ¡LA LLAVE FUNCIONA! (Acceso verificado)" -ForegroundColor Green
    Write-Host "Modelos disponibles para esta llave:" -ForegroundColor Gray
    
    foreach ($m in $models) {
        $methods = $m.supportedGenerationMethods -join ", "
        # Highlight Image models
        if ($methods -like "*image*" -or $m.name -like "*vision*") {
            Write-Host "⭐ $($m.name) [$methods]" -ForegroundColor Yellow
        }
        else {
            Write-Host "   $($m.name) [$methods]"
        }
    }
}
catch {
    Write-Host "❌ ERROR: La llave no funciona o no tiene API habilitada." -ForegroundColor Red
    Write-Host $_.Exception.Message
}
