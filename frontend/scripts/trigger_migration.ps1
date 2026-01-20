$ErrorActionPreference = "Stop"

# CONFIG
$ProjectRef = "pjscnzymofaijevonxkm"
$AnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqc2Nuenltb2ZhaWpldm9ueGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNjQzNTUsImV4cCI6MjA4Mjc0MDM1NX0.JgWvL53a8ZqQUXQK5nQQ1cGtMzkqm1WktY0Yc3Gqu1I"
$FunctionUrl = "https://$ProjectRef.supabase.co/functions/v1/migration-runner"

Write-Host ">>> TRIGGERING MIGRATION TUNNEL <<<" -ForegroundColor Cyan

$Headers = @{
    "Authorization" = "Bearer $AnonKey"
    "Content-Type"  = "application/json"
}

try {
    $Response = Invoke-RestMethod -Uri $FunctionUrl -Method Post -Headers $Headers -TimeoutSec 60
    
    Write-Host "✅ FUNCTION RESPONSE:" -ForegroundColor Green
    $Response | ConvertTo-Json | Write-Host -ForegroundColor Gray
    
    if ($Response.success) {
        Write-Host "🎉 MIGRATION SUCCESSFUL!" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️ FUNCTION REPORTED FAILURE" -ForegroundColor Red
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
}
