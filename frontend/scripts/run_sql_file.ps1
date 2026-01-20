param (
    [Parameter(Mandatory = $true)]
    [string]$SqlFile
)

$ErrorActionPreference = "Stop"

# CONFIG
$AccessToken = "sbp_04adaab0d1790b65a2307f342826f4b51c16e466"
$ProjectRef = "pjscnzymofaijevonxkm"

Write-Host ">>> API SQL INJECTOR: $SqlFile <<<" -ForegroundColor Cyan

# 1. READ SQL
if (!(Test-Path $SqlFile)) {
    Write-Host "❌ FATAL: SQL file not found at $SqlFile" -ForegroundColor Red
    exit 1
}
$SqlContent = Get-Content $SqlFile -Raw -Encoding UTF8

if ([string]::IsNullOrWhiteSpace($SqlContent)) {
    Write-Host "❌ FATAL: SQL file is empty." -ForegroundColor Red
    exit 1
}

# 2. API CALL
$Url = "https://api.supabase.com/v1/projects/$ProjectRef/database/query"
$Headers = @{
    "Authorization" = "Bearer $AccessToken"
    "Content-Type"  = "application/json"
}
$Body = @{
    query = $SqlContent
} | ConvertTo-Json -Depth 10

Write-Host ">>> Sending to $ProjectRef..." -ForegroundColor Yellow

try {
    $Response = Invoke-RestMethod -Uri $Url -Method Post -Headers $Headers -Body $Body -TimeoutSec 60
    
    Write-Host ">>> ✅ SUCCESS!" -ForegroundColor Green
    if ($Response.result) {
        $Response.result | ConvertTo-Json | Write-Host -ForegroundColor Gray
    }
    else {
        Write-Host "(Empty Result Set - typical for DDL)" -ForegroundColor Gray
    }
    
}
catch {
    Write-Host "❌ API FAILED" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $Stream = $_.Exception.Response.GetResponseStream()
        $Reader = New-Object System.IO.StreamReader($Stream)
        $msg = $Reader.ReadToEnd()
        Write-Host "Details: $msg" -ForegroundColor Red
    }
    exit 1
}
