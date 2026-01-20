$ProjectId = "pjscnzymofaijevonxkm"

# Retrieve args
$FunctionName = $args[0]

if (-not $FunctionName) {
    Write-Host "Usage: ./get_logs.ps1 <function-name>"
    exit 1
}

Write-Host ">>> SUPABASE AGENTIC MCP: Get Logs <<<"
Write-Host "Function: $FunctionName"
Write-Host "Project: $ProjectId"

# Execute
$env:SUPABASE_ACCESS_TOKEN = "sbp_04adaab0d1790b65a2307f342826f4b51c16e466"
npx supabase functions logs --project-ref $ProjectId
