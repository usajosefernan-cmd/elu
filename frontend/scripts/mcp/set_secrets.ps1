$ProjectId = "pjscnzymofaijevonxkm"

# Retrieve args
$KeyName = $args[0]
$KeyValue = $args[1]

if (-not $KeyName -or -not $KeyValue) {
    Write-Host "Usage: ./set_secrets.ps1 <KEY_NAME> <VALUE>"
    exit 1
}

Write-Host ">>> SUPABASE AGENTIC MCP: Set Secrets <<<"
Write-Host "Project: $ProjectId"
Write-Host "Setting $KeyName..."

# Execute
$env:SUPABASE_ACCESS_TOKEN = "sbp_04adaab0d1790b65a2307f342826f4b51c16e466"
npx supabase secrets set "$KeyName=$KeyValue" --project-ref $ProjectId
