$ErrorActionPreference = "Stop"

# CONFIG
$AccessToken = "sbp_04adaab0d1790b65a2307f342826f4b51c16e466"
$ProjectRef = "pjscnzymofaijevonxkm"
$SqlFilePath = "$PSScriptRoot\..\supabase\migrations\20260114_phase2_sql_prompts.sql"

Write-Host ">>> SQL INJECTION PROTOCOL VIA MANAGEMENT API <<<" -ForegroundColor Cyan
Write-Host "Target Project: $ProjectRef"
Write-Host "Reading SQL: $SqlFilePath"

# 1. READ SQL
if (!(Test-Path $SqlFilePath)) {
    Write-Host "❌ FATAL: SQL file not found at $SqlFilePath" -ForegroundColor Red
    exit 1
}
$SqlContent = Get-Content $SqlFilePath -Raw -Encoding UTF8

if ([string]::IsNullOrWhiteSpace($SqlContent)) {
    Write-Host "❌ FATAL: SQL file is empty." -ForegroundColor Red
    exit 1
}

# 2. PREPARE PAYLOAD
$Url = "https://api.supabase.com/v1/projects/$ProjectRef/database/query"
$Headers = @{
    "Authorization" = "Bearer $AccessToken"
    "Content-Type"  = "application/json"
}
$Body = @{
    query = $SqlContent
} | ConvertTo-Json -Depth 10

# 3. EXECUTE
Write-Host ">>> Sending Request to Management API..." -ForegroundColor Yellow

try {
    $Response = Invoke-RestMethod -Uri $Url -Method Post -Headers $Headers -Body $Body -TimeoutSec 60
    
    Write-Host ">>> ✅ SUCCESS: SQL Executed Successfully!" -ForegroundColor Green
    Write-Host "Response Summary:"
    # Supabase API usually returns prompt results or empty on success
    $Response | ConvertTo-Json -Depth 5 | Write-Host -ForegroundColor Gray
    
}
catch {
    Write-Host "❌ ERROR: API Request Failed." -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $Stream = $_.Exception.Response.GetResponseStream()
        $Reader = New-Object System.IO.StreamReader($Stream)
        $msg = $Reader.ReadToEnd()
        Write-Host "Details: $msg" -ForegroundColor Red
    }
    exit 1
}
