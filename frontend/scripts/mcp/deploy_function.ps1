param (
    [Parameter(Mandatory = $true)]
    [string]$FunctionName
)

$ErrorActionPreference = "Stop"

# Configuration
$Env:SUPABASE_ACCESS_TOKEN = "sbp_04adaab0d1790b65a2307f342826f4b51c16e466"
$ProjectId = "pjscnzymofaijevonxkm"

Write-Host ">>> SUPABASE AGENTIC MCP: Deploy Function <<<" -ForegroundColor Cyan
Write-Host "Function: $FunctionName"
Write-Host "Project: $ProjectId"

try {
    Write-Host "Deploying function..."
    npx supabase functions deploy $FunctionName --project-ref $ProjectId --no-verify-jwt
    
    Write-Host "✅ Function '$FunctionName' Deployed Successfully" -ForegroundColor Green
}
catch {
    Write-Host "❌ Function Deployment Failed" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}
