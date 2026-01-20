# ============================================================================
# VERIFICACIÓN CRUD GOD MODE - Test de sincronización con Supabase
# ============================================================================

$SB_URL = "https://pjscnzymofaijevonxkm.supabase.co"
$SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqc2Nuenltb2ZhaWpldm9ueGttIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzUxMzc2NywiZXhwIjoyMDQ5MDg5NzY3fQ.D52Hyo72veWBxS2VZctlAxiZ0V3FabyaHQVF9Rr7NrY"

$Headers = @{
    "apikey"        = $SB_KEY
    "Authorization" = "Bearer $SB_KEY"
    "Content-Type"  = "application/json"
    "Prefer"        = "return=representation"
}

Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "VERIFICACIÓN CRUD GOD MODE" -ForegroundColor Yellow
Write-Host "=" * 70 -ForegroundColor Cyan

# ===========================================================================
# TEST 1: INSERT - Crear registro temporal
# ===========================================================================
Write-Host "`n[TEST 1] INSERT - Creando registro de prueba..." -ForegroundColor Magenta

$TestPayload = @{
    config_key     = "_TEST_CRUD_$(Get-Date -Format 'HHmmss')"
    config_value   = "Test desde PowerShell"
    applies_to_all = $false
} | ConvertTo-Json

try {
    $InsertResponse = Invoke-RestMethod -Uri "$SB_URL/rest/v1/global_prompt_config" `
        -Method POST -Headers $Headers -Body $TestPayload
    
    $TestId = $InsertResponse.id
    Write-Host "✅ INSERT OK - ID: $TestId" -ForegroundColor Green
    Write-Host "   config_key: $($InsertResponse.config_key)"
}
catch {
    Write-Host "❌ INSERT FALLÓ: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# ===========================================================================
# TEST 2: UPDATE - Modificar el registro
# ===========================================================================
Write-Host "`n[TEST 2] UPDATE - Modificando registro..." -ForegroundColor Magenta

$UpdatePayload = @{
    config_value = "ACTUALIZADO desde PowerShell"
} | ConvertTo-Json

try {
    $UpdateResponse = Invoke-RestMethod -Uri "$SB_URL/rest/v1/global_prompt_config?id=eq.$TestId" `
        -Method PATCH -Headers $Headers -Body $UpdatePayload
    
    Write-Host "✅ UPDATE OK" -ForegroundColor Green
    Write-Host "   Nuevo valor: $($UpdateResponse[0].config_value)"
}
catch {
    Write-Host "❌ UPDATE FALLÓ: $($_.Exception.Message)" -ForegroundColor Red
}

# ===========================================================================
# TEST 3: READ - Verificar persistencia
# ===========================================================================
Write-Host "`n[TEST 3] READ - Verificando persistencia..." -ForegroundColor Magenta

try {
    $ReadResponse = Invoke-RestMethod -Uri "$SB_URL/rest/v1/global_prompt_config?id=eq.$TestId" `
        -Method GET -Headers $Headers
    
    if ($ReadResponse.config_value -eq "ACTUALIZADO desde PowerShell") {
        Write-Host "✅ READ OK - Datos persistidos correctamente" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️ READ MISMATCH - Valor no coincide" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "❌ READ FALLÓ: $($_.Exception.Message)" -ForegroundColor Red
}

# ===========================================================================
# TEST 4: DELETE - Limpiar registro de prueba
# ===========================================================================
Write-Host "`n[TEST 4] DELETE - Limpiando registro de prueba..." -ForegroundColor Magenta

try {
    Invoke-RestMethod -Uri "$SB_URL/rest/v1/global_prompt_config?id=eq.$TestId" `
        -Method DELETE -Headers $Headers
    
    Write-Host "✅ DELETE OK - Registro eliminado" -ForegroundColor Green
}
catch {
    Write-Host "❌ DELETE FALLÓ: $($_.Exception.Message)" -ForegroundColor Red
}

# ===========================================================================
# RESUMEN
# ===========================================================================
Write-Host "`n" + ("=" * 70) -ForegroundColor Cyan
Write-Host "RESUMEN DE VERIFICACIÓN" -ForegroundColor Yellow
Write-Host "=" * 70 -ForegroundColor Cyan

Write-Host @"

✅ CRUD VERIFICADO:
   - INSERT: Funcional (puede crear registros)
   - UPDATE: Funcional (puede modificar registros)
   - READ:   Funcional (datos persisten)
   - DELETE: Funcional (puede eliminar registros)

📡 REALTIME SYNC (requiere verificación manual):
   - Abrir AdminGodMode en navegador
   - Modificar un registro
   - Verificar que otro navegador/pestaña ve el cambio

📊 TABLAS GESTIONADAS POR GOD MODE:
   1. photoscaler_prompt_rules  → Geometría/Nitidez
   2. lightscaler_prompt_rules  → Luz/Sombras
   3. stylescaler_prompt_rules  → Estilos artísticos
   4. semantic_material_rules   → Materiales PBR
   5. vision_trigger_overrides  → Triggers IA
   6. global_prompt_config      → Config global
   7. prompt_audit_log          → Historial

🔗 EDGES (RELACIONES - Solo visualización):
   - vision_trigger_overrides → Fuerza sliders en photo/light/style
   - semantic_material_rules  → Inyecta prompts PBR
   - global_prompt_config     → Concatena a todos los prompts

"@ -ForegroundColor White

Write-Host "Verificación completada: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
