$ErrorActionPreference = "Stop"

# CONFIG
$ProjectRef = "pjscnzymofaijevonxkm"
$ServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqc2Nuenltb2ZhaWpldm9ueGttIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzE2NDM1NSwiZXhwIjoyMDgyNzQwMzU1fQ.kZxMkGOmqunADot69OcsIPM1kUaN1vdAIQYnWnCZYuk"

Write-Host ">>> DEEP VERIFICATION WITH SERVICE KEY <<<" -ForegroundColor Cyan

# Endpoint: Direct REST API to a table involved in migration
$Url = "https://$ProjectRef.supabase.co/rest/v1/photoscaler_prompt_rules?select=count"
$Headers = @{
    "apikey"        = $ServiceKey
    "Authorization" = "Bearer $ServiceKey"
}

try {
    # If table exists, this returns count (even 0). If not, 404.
    $Response = Invoke-RestMethod -Uri $Url -Method Get -Headers $Headers
    
    Write-Host "✅ SUCCESS: Table 'photoscaler_prompt_rules' EXISTS!" -ForegroundColor Green
    Write-Host "Row Count (if any):"
    $Response | ConvertTo-Json | Write-Host -ForegroundColor Gray
    
}
catch {
    Write-Host "❌ CHECK FAILED" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)"
    Write-Host "Message: $($_.Exception.Message)"
    
    # 404 means table doesn't exist (API endpoint not found because table missing)
    if ($_.Exception.Response.StatusCode.value__ -eq 404) {
        Write-Host "Diagnosis: Table has NOT been created yet." -ForegroundColor Yellow
    }
}
