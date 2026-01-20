param (
    [Parameter(Mandatory = $true)]
    [string]$SqlFile
)

$ErrorActionPreference = "Stop"

# CONFIG
$ProjectRef = "pjscnzymofaijevonxkm"
$AnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqc2Nuenltb2ZhaWpldm9ueGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNjQzNTUsImV4cCI6MjA4Mjc0MDM1NX0.JgWvL53a8ZqQUXQK5nQQ1cGtMzkqm1WktY0Yc3Gqu1I"
$FunctionUrl = "https://$ProjectRef.supabase.co/functions/v1/migration-runner"

Write-Host ">>> SUPABASE AGENTIC MCP: Apply Migration <<<" -ForegroundColor Cyan
Write-Host "SQL File: $SqlFile"

if (-not (Test-Path $SqlFile)) {
    Write-Host "❌ SQL File not found: $SqlFile" -ForegroundColor Red
    exit 1
}

Write-Host "Reading SQL file content..."
$SqlContent = Get-Content -Path $SqlFile -Raw
Write-Host "SQL Content Read ($($SqlContent.Length) chars)"

$Headers = @{
    "Authorization" = "Bearer $AnonKey"
    "Content-Type"  = "application/json"
}

Write-Host "Constructing Body (Verified Python)..."

# Safe JSON serialization via Python to avoid PS 5.1 buffer issues
$TempFile = [System.IO.Path]::GetTempFileName()
# Use UTF8 WITHOUT BOM
$Utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($TempFile, $SqlContent, $Utf8NoBom)

# Escape backslashes for Python string literal in command
$PyPath = $TempFile.Replace('\', '\\')

$Body = python -c "import json; print(json.dumps({'query': open('$PyPath', encoding='utf-8').read()}))"

# Clean up
if (Test-Path $TempFile) { Remove-Item $TempFile }

Write-Host "Body Constructed ($($Body.Length) chars)"

try {
    Write-Host "Sending SQL to Migration Tunnel..."
    $Response = Invoke-RestMethod -Uri $FunctionUrl -Method Post -Headers $Headers -Body $Body -TimeoutSec 60
    
    Write-Host "✅ FUNCTION RESPONSE:" -ForegroundColor Green
    $Response | ConvertTo-Json | Write-Host -ForegroundColor Gray
    
    if ($Response.success) {
        Write-Host "🎉 MIGRATION SUCCESSFUL!" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️ FUNCTION REPORTED FAILURE" -ForegroundColor Red
        if ($Response.error) {
            Write-Host "Error: $($Response.error)" -ForegroundColor Yellow
        }
        exit 1
    }
}
catch {
    Write-Host "❌ INVOCATION FAILED" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $Stream = $_.Exception.Response.GetResponseStream()
        $Reader = New-Object System.IO.StreamReader($Stream)
        $msg = $Reader.ReadToEnd()
        Write-Host "Details: $msg" -ForegroundColor Yellow
    }
    exit 1
}
