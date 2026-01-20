$AccessToken = "sbp_04adaab0d1790b65a2307f342826f4b51c16e466"
$ProjectRef = "pjscnzymofaijevonxkm"

Write-Host ">>> FULL AUDIT: photoscaler_prompt_rules (Level 8-10) <<<" -ForegroundColor Cyan

$Query = @"
SELECT 
  intensity_label,
  protocol_header,
  mission_statement,
  quality_assessment_logic,
  virtual_camera_specs,
  geometric_projection_logic,
  lens_physics_correction,
  signal_processing_pipeline,
  detail_synthesis_logic,
  damage_restoration_protocol
FROM photoscaler_prompt_rules 
WHERE slider_value_min = 8;
"@

$Url = "https://api.supabase.com/v1/projects/$ProjectRef/database/query"
$Headers = @{
    "Authorization" = "Bearer $AccessToken"
    "Content-Type"  = "application/json"
}
$Body = @{ query = $Query } | ConvertTo-Json

$Response = Invoke-RestMethod -Uri $Url -Method Post -Headers $Headers -Body $Body -TimeoutSec 30

Write-Host "`nFORENSIC_RESHOOT_v15 DATA:" -ForegroundColor Green
$Response | ConvertTo-Json -Depth 5
