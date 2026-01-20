$ErrorActionPreference = "Stop"

# CONFIG
$AccessToken = "sbp_04adaab0d1790b65a2307f342826f4b51c16e466"
$ProjectRef = "pjscnzymofaijevonxkm"

Write-Host ">>> FETCHING EDGE FUNCTION LOGS <<<" -ForegroundColor Cyan

# Management API Logs Endpoint
$Url = "https://api.supabase.com/v1/projects/$ProjectRef/analytics/endpoints/logs.edge-functions?iso_timestamp_start=$(Get-Date (Get-Date).AddHours(-1) -Format "o")"
$Headers = @{
    "Authorization" = "Bearer $AccessToken"
    "Content-Type"  = "application/json"
}

try {
    $Response = Invoke-RestMethod -Uri $Url -Method Get -Headers $Headers -TimeoutSec 30
    
    Write-Host ">>> LOGS RECEIVED <<<" -ForegroundColor Green
    $Response | ConvertTo-Json -Depth 5
    
}
catch {
    Write-Host "ERROR Fetching Logs" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
