$ProjectId = "pjscnzymofaijevonxkm"
$AnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqc2Nuenltb2ZhaWpldm9ueGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNjQzNTUsImV4cCI6MjA4Mjc0MDM1NX0.JgWvL53a8ZqQUXQK5nQQ1cGtMzkqm1WktY0Yc3Gqu1I"
$Url = "https://pjscnzymofaijevonxkm.supabase.co/functions/v1/lux-chat"

Write-Host ">>> SUPABASE AGENTIC MCP: Debug Lux Chat <<<"
Write-Host "Triggering function..."

try {
    $payload = @{
        message    = "Hola, eres Lux?"
        docContext = "CONTEXTO DE PRUEBA: El usuario es administrador."
        history    = @()
    }
    $response = Invoke-RestMethod -Uri $Url -Method Post -Headers @{
        "Authorization" = "Bearer $AnonKey"
        "Content-Type"  = "application/json"
    } -Body ($payload | ConvertTo-Json -Compress) -ErrorAction Stop
    
    Write-Host "Response:"
    $response | ConvertTo-Json -Depth 5
}
catch {
    Write-Host "Error Triggering Function:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errBody = $reader.ReadToEnd()
        Write-Host "Body: $errBody" -ForegroundColor Yellow
    }
}

# Skip logs fetching as CLI command is inconsistent
Write-Host "Please check console output above for Success/Error." -ForegroundColor Cyan
