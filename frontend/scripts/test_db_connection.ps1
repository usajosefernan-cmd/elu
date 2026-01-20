$ErrorActionPreference = "Stop"

# CONFIG
$AccessToken = "sbp_04adaab0d1790b65a2307f342826f4b51c16e466"
$ProjectRef = "pjscnzymofaijevonxkm"

Write-Host ">>> TESTING API CONNECTIVITY <<<" -ForegroundColor Cyan

$Url = "https://api.supabase.com/v1/projects/$ProjectRef/database/query"
$Headers = @{
    "Authorization" = "Bearer $AccessToken"
    "Content-Type"  = "application/json"
}
$Body = @{
    query = "SELECT 'CONNECTION_OK' as status, now() as timestamp;"
} | ConvertTo-Json

try {
    $Response = Invoke-RestMethod -Uri $Url -Method Post -Headers $Headers -Body $Body -TimeoutSec 10
    
    if ($Response.result) {
        Write-Host "✅ SUCCESS: API Responded!" -ForegroundColor Green
        $Response.result | ConvertTo-Json | Write-Host -ForegroundColor Gray
    }
    else {
        Write-Host "⚠️ RESPONSE EMPTY (Check Permissions)" -ForegroundColor Yellow
        $Response | ConvertTo-Json
    }
}
catch {
    Write-Host "❌ API FAILED" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
