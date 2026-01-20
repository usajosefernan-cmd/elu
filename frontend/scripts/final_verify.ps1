$ProjectRef = "pjscnzymofaijevonxkm"
$ServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqc2Nuenltb2ZhaWpldm9ueGttIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzE2NDM1NSwiZXhwIjoyMDgyNzQwMzU1fQ.kZxMkGOmqunADot69OcsIPM1kUaN1vdAIQYnWnCZYuk"

Write-Host ">>> FINAL DATA VERIFICATION <<<" -ForegroundColor Cyan

$Tables = @(
    "photoscaler_prompt_rules",
    "lightscaler_prompt_rules",
    "stylescaler_prompt_rules",
    "global_prompt_config",
    "semantic_material_rules",
    "vision_trigger_overrides"
)

$Headers = @{
    "apikey"        = $ServiceKey
    "Authorization" = "Bearer $ServiceKey"
    "Prefer"        = "count=exact"
}

foreach ($Table in $Tables) {
    $Url = "https://$ProjectRef.supabase.co/rest/v1/$Table?select=*"
    try {
        $Response = Invoke-WebRequest -Uri $Url -Method Head -Headers $Headers
        $Count = $Response.Headers["Content-Range"] -replace ".*\/", ""
        Write-Host "OK $Table : $Count records" -ForegroundColor Green
    }
    catch {
        Write-Host "FAIL $Table" -ForegroundColor Red
    }
}

Write-Host "`nDONE" -ForegroundColor Cyan
