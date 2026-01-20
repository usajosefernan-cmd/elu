$AccessToken = "sbp_04adaab0d1790b65a2307f342826f4b51c16e466"
$ProjectRef = "pjscnzymofaijevonxkm"

Write-Host ">>> VERIFYING TEXT FIELD COMPLETENESS <<<" -ForegroundColor Cyan

# Check photoscaler level 8-10 (FORENSIC_RESHOOT)
$Query = @"
SELECT 
  intensity_label, 
  LENGTH(protocol_header) as header_len,
  LENGTH(mission_statement) as mission_len,
  LENGTH(quality_assessment_logic) as assessment_len,
  LENGTH(virtual_camera_specs) as camera_len,
  LENGTH(detail_synthesis_logic) as synthesis_len,
  LENGTH(damage_restoration_protocol) as damage_len
FROM photoscaler_prompt_rules 
WHERE intensity_label = 'FORENSIC_RESHOOT_v15';
"@

$Url = "https://api.supabase.com/v1/projects/$ProjectRef/database/query"
$Headers = @{
    "Authorization" = "Bearer $AccessToken"
    "Content-Type"  = "application/json"
}
$Body = @{ query = $Query } | ConvertTo-Json

$Response = Invoke-RestMethod -Uri $Url -Method Post -Headers $Headers -Body $Body -TimeoutSec 15

Write-Host "`nPHOTOSCALER (FORENSIC_RESHOOT_v15) TEXT LENGTHS:" -ForegroundColor Green
$Response | ConvertTo-Json

# Expected minimum lengths based on BBLA documentation:
# header: ~130 chars, mission: ~120 chars, assessment: ~350 chars, camera: ~200 chars, synthesis: ~300 chars, damage: ~250 chars
