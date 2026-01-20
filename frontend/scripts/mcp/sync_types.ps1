$ErrorActionPreference = "Stop"

# Configuration
$Env:SUPABASE_ACCESS_TOKEN = "sbp_04adaab0d1790b65a2307f342826f4b51c16e466"
$ProjectId = "pjscnzymofaijevonxkm"
$TargetFile = "src/types/supabase.ts"

Write-Host ">>> SUPABASE AGENTIC MCP: Sync Types <<<" -ForegroundColor Cyan
Write-Host "Target Project: $ProjectId"
Write-Host "Target File: $TargetFile"

try {
    Write-Host "Generating types..."
    npx supabase gen types typescript --project-id $ProjectId > $TargetFile
    
    if (Test-Path $TargetFile) {
        Write-Host "✅ Types Generated Successfully at $TargetFile" -ForegroundColor Green
    }
    else {
        throw "Target file was not created."
    }
}
catch {
    Write-Host "❌ Type Generation Failed" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}
