$ErrorActionPreference = "Stop"

# Configuration
$Env:SUPABASE_ACCESS_TOKEN = "sbp_04adaab0d1790b65a2307f342826f4b51c16e466"

Write-Host ">>> SUPABASE AGENTIC MCP: List Projects <<<" -ForegroundColor Cyan

try {
    npx supabase projects list
    Write-Host "✅ List Projects Completed" -ForegroundColor Green
}
catch {
    Write-Host "❌ List Projects Failed" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}
