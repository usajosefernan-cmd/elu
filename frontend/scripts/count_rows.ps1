$AccessToken = "sbp_04adaab0d1790b65a2307f342826f4b51c16e466"
$ProjectRef = "pjscnzymofaijevonxkm"

Write-Host ">>> ROW COUNT VIA MANAGEMENT API <<<" -ForegroundColor Cyan

$Query = @"
SELECT 
  'photoscaler_prompt_rules' as tbl, COUNT(*) as cnt FROM photoscaler_prompt_rules
UNION ALL SELECT 'lightscaler_prompt_rules', COUNT(*) FROM lightscaler_prompt_rules
UNION ALL SELECT 'stylescaler_prompt_rules', COUNT(*) FROM stylescaler_prompt_rules
UNION ALL SELECT 'global_prompt_config', COUNT(*) FROM global_prompt_config
UNION ALL SELECT 'semantic_material_rules', COUNT(*) FROM semantic_material_rules
UNION ALL SELECT 'vision_trigger_overrides', COUNT(*) FROM vision_trigger_overrides;
"@

$Url = "https://api.supabase.com/v1/projects/$ProjectRef/database/query"
$Headers = @{
    "Authorization" = "Bearer $AccessToken"
    "Content-Type"  = "application/json"
}
$Body = @{ query = $Query } | ConvertTo-Json

$Response = Invoke-RestMethod -Uri $Url -Method Post -Headers $Headers -Body $Body -TimeoutSec 15

Write-Host "RESULTS:" -ForegroundColor Green
$Response | ConvertTo-Json
