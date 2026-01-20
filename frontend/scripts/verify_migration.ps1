$ErrorActionPreference = "Stop"

# CONFIG
$AccessToken = "sbp_04adaab0d1790b65a2307f342826f4b51c16e466"
$ProjectRef = "pjscnzymofaijevonxkm"

Write-Host ">>> VERIFYING DATABASE STATE <<<" -ForegroundColor Cyan

# QUERY: Check for the 7 new tables
$Query = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('projects', 'documents', 'document_versions');"

$Url = "https://api.supabase.com/v1/projects/$ProjectRef/database/query"
$Headers = @{
    "Authorization" = "Bearer $AccessToken"
    "Content-Type"  = "application/json"
}
$Body = @{
    query = $Query
} | ConvertTo-Json

try {
    $Response = Invoke-RestMethod -Uri $Url -Method Post -Headers $Headers -Body $Body -TimeoutSec 10
    
    Write-Host ">>> API Response Received" -ForegroundColor Yellow
    $Tables = $Response.result
    
    if (!$Tables) {
        Write-Host "❌ NO TABLES FOUND (Or API Error)" -ForegroundColor Red
        $Response | ConvertTo-Json -Depth 5
    }
    else {
        Write-Host "✅ FOUND TABLES:" -ForegroundColor Green
        $Tables | ForEach-Object { Write-Host " - $($_.table_name)" }
        
        $Count = $Tables.Count
        if ($Count -eq 3) {
            Write-Host "`n🎉 SUCCESS: All 3 Phase 6 Tables are present!" -ForegroundColor Green
        }
        else {
            Write-Host "`n⚠️ WARNING: Found $Count/3 tables. Migration may be incomplete." -ForegroundColor Yellow
        }
    }
    
}
catch {
    Write-Host "❌ FATAL ERROR querying API" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
