$AccessToken = "sbp_04adaab0d1790b65a2307f342826f4b51c16e466"
$ProjectRef = "pjscnzymofaijevonxkm"
$Url = "https://api.supabase.com/v1/projects/$ProjectRef/database/query"
$Headers = @{
    "Authorization" = "Bearer $AccessToken"
    "Content-Type"  = "application/json"
}

Write-Host "=========================" -ForegroundColor Cyan
Write-Host "BBLA vs SUPABASE COMPARISON" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

# ========== photoscaler NIVEL 8-10 ==========
Write-Host "`n=== PHOTOSCALER (Nivel 8-10) ===" -ForegroundColor Yellow

$Query = "SELECT protocol_header FROM photoscaler_prompt_rules WHERE slider_value_min = 8;"
$Body = @{ query = $Query } | ConvertTo-Json
$Response = Invoke-RestMethod -Uri $Url -Method Post -Headers $Headers -Body $Body

Write-Host "`nSUPABASE protocol_header:" -ForegroundColor Green
Write-Host $Response.protocol_header

Write-Host "`nBBLA (01_photoscaler.md linea 187):" -ForegroundColor Magenta
Write-Host "[SYSTEM OVERRIDE: UNIVERSAL FORENSIC RE-SHOOT & OPTICAL SYNTHESIS PROTOCOL v15.0 - STRUCTURAL ALIGNMENT, DAMAGE RECONSTRUCTION & SOLID SIGNAL MASTER]."

# Check if they match
$Expected = "[SYSTEM OVERRIDE: UNIVERSAL FORENSIC RE-SHOOT & OPTICAL SYNTHESIS PROTOCOL v15.0 - STRUCTURAL ALIGNMENT, DAMAGE RECONSTRUCTION & SOLID SIGNAL MASTER]."
$Actual = $Response.protocol_header
if ($Actual -eq $Expected) {
    Write-Host "`n✅ MATCH" -ForegroundColor Green
}
else {
    Write-Host "`n❌ MISMATCH" -ForegroundColor Red
    Write-Host "Expected length: $($Expected.Length)" -ForegroundColor Yellow
    Write-Host "Actual length: $($Actual.Length)" -ForegroundColor Yellow
}

# ========== lightscaler SOMBRAS 8-10 ==========
Write-Host "`n=== LIGHTSCALER (Sombras 8-10) ===" -ForegroundColor Yellow

$Query = "SELECT protocol_header, zone_system_logic FROM lightscaler_prompt_rules WHERE slider_name = 'sombras' AND slider_value_min = 8;"
$Body = @{ query = $Query } | ConvertTo-Json
$Response = Invoke-RestMethod -Uri $Url -Method Post -Headers $Headers -Body $Body

Write-Host "`nSUPABASE protocol_header:" -ForegroundColor Green
Write-Host $Response.protocol_header

Write-Host "`nSUPABASE zone_system_logic:" -ForegroundColor Green
Write-Host $Response.zone_system_logic

# ========== stylescaler DETALLE 8-10 ==========
Write-Host "`n=== STYLESCALER (Detalle 8-10) ===" -ForegroundColor Yellow

$Query = "SELECT art_direction_header, texture_quality_prompt, guidance_scale FROM stylescaler_prompt_rules WHERE slider_value_min = 8;"
$Body = @{ query = $Query } | ConvertTo-Json
$Response = Invoke-RestMethod -Uri $Url -Method Post -Headers $Headers -Body $Body

Write-Host "`nSUPABASE art_direction_header:" -ForegroundColor Green
Write-Host $Response.art_direction_header

Write-Host "`nSUPABASE guidance_scale:" -ForegroundColor Green
Write-Host $Response.guidance_scale

# ========== global_prompt_config ==========
Write-Host "`n=== GLOBAL_PROMPT_CONFIG ===" -ForegroundColor Yellow

$Query = "SELECT config_key, prompt_text FROM global_prompt_config ORDER BY config_key;"
$Body = @{ query = $Query } | ConvertTo-Json
$Response = Invoke-RestMethod -Uri $Url -Method Post -Headers $Headers -Body $Body

foreach ($row in $Response) {
    Write-Host "`n--- $($row.config_key) ---" -ForegroundColor Cyan
    Write-Host "Length: $($row.prompt_text.Length) chars" -ForegroundColor Yellow
    Write-Host "First 200 chars: $($row.prompt_text.Substring(0, [Math]::Min(200, $row.prompt_text.Length)))..."
}
