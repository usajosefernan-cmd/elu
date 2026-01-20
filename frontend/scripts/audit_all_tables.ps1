$AccessToken = "sbp_04adaab0d1790b65a2307f342826f4b51c16e466"
$ProjectRef = "pjscnzymofaijevonxkm"

Write-Host ">>> COMPLETE AUDIT: ALL 6 TABLES <<<" -ForegroundColor Cyan

$Url = "https://api.supabase.com/v1/projects/$ProjectRef/database/query"
$Headers = @{
    "Authorization" = "Bearer $AccessToken"
    "Content-Type"  = "application/json"
}

# ========== LIGHTSCALER ==========
Write-Host "`n=== LIGHTSCALER (Sombras 8-10) ===" -ForegroundColor Yellow
$Query = "SELECT slider_name, slider_value_min, protocol_header, zone_system_logic, color_science_grading FROM lightscaler_prompt_rules WHERE slider_name = 'sombras' AND slider_value_min = 8;"
$Body = @{ query = $Query } | ConvertTo-Json
$Response = Invoke-RestMethod -Uri $Url -Method Post -Headers $Headers -Body $Body -TimeoutSec 15
$Response | ConvertTo-Json -Depth 3

# ========== STYLESCALER ==========
Write-Host "`n=== STYLESCALER (Detalle 8-10) ===" -ForegroundColor Yellow
$Query = "SELECT slider_name, slider_value_min, art_direction_header, texture_quality_prompt, anamorphic_optics_prompt, guidance_scale FROM stylescaler_prompt_rules WHERE slider_value_min = 8;"
$Body = @{ query = $Query } | ConvertTo-Json
$Response = Invoke-RestMethod -Uri $Url -Method Post -Headers $Headers -Body $Body -TimeoutSec 15
$Response | ConvertTo-Json -Depth 3

# ========== SEMANTIC MATERIAL ==========
Write-Host "`n=== SEMANTIC_MATERIAL (SKIN) ===" -ForegroundColor Yellow
$Query = "SELECT material_tag, physics_logic_prompt, surface_texture_prompt, negative_material_prompt FROM semantic_material_rules WHERE material_tag = 'SKIN';"
$Body = @{ query = $Query } | ConvertTo-Json
$Response = Invoke-RestMethod -Uri $Url -Method Post -Headers $Headers -Body $Body -TimeoutSec 15
$Response | ConvertTo-Json -Depth 3

# ========== GLOBAL_PROMPT_CONFIG ==========
Write-Host "`n=== GLOBAL_PROMPT_CONFIG ===" -ForegroundColor Yellow
$Query = "SELECT config_key, LENGTH(prompt_text) as text_length, token_weight FROM global_prompt_config;"
$Body = @{ query = $Query } | ConvertTo-Json
$Response = Invoke-RestMethod -Uri $Url -Method Post -Headers $Headers -Body $Body -TimeoutSec 15
$Response | ConvertTo-Json -Depth 3

# ========== VISION_TRIGGER_OVERRIDES ==========
Write-Host "`n=== VISION_TRIGGER_OVERRIDES ===" -ForegroundColor Yellow
$Query = "SELECT json_category, json_key, json_value_match, target_table, action_type, forced_slider_value, description FROM vision_trigger_overrides;"
$Body = @{ query = $Query } | ConvertTo-Json
$Response = Invoke-RestMethod -Uri $Url -Method Post -Headers $Headers -Body $Body -TimeoutSec 15
$Response | ConvertTo-Json -Depth 3
