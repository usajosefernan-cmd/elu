$ErrorActionPreference = "Stop"

$AccessToken = "sbp_04adaab0d1790b65a2307f342826f4b51c16e466"
$ProjectRef = "pjscnzymofaijevonxkm"

Write-Host ">>> LISTING ALL PUBLIC TABLES <<<" -ForegroundColor Cyan

$Query = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"

$Url = "https://api.supabase.com/v1/projects/$ProjectRef/database/query"
$Headers = @{
    "Authorization" = "Bearer $AccessToken"
    "Content-Type"  = "application/json"
}
$Body = @{ query = $Query } | ConvertTo-Json

try {
    $Response = Invoke-RestMethod -Uri $Url -Method Post -Headers $Headers -Body $Body -TimeoutSec 15
    
    Write-Host "RAW RESPONSE:" -ForegroundColor Yellow
    $Response | ConvertTo-Json -Depth 3
    
}
catch {
    Write-Host "ERROR" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
