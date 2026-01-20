param (
    [string]$ApiKey
)

# Vertex AI Configuration from BBLA
$Project = "luxifier-node-3362-1"
$Location = "us-central1"
$Model = "gemini-1.5-flash-001" # Standard Vertex Model

# Endpoint for Vertex AI
$Url = "https://$Location-aiplatform.googleapis.com/v1/projects/$Project/locations/$Location/publishers/google/models/$Model`:generateContent"

# Method 1: Try as Query Param (Standard for API Keys in some gateways)
$UrlWithKey = "$Url`?key=$ApiKey"

Write-Host ">>> TESTING VERTEX AI ENDPOINT <<<" -ForegroundColor Cyan
Write-Host "Project: $Project"
Write-Host "Endpoint: $Url"
Write-Host "Key (masked): $( $ApiKey.Substring(0,5) )..."

$body = @{
    contents         = @(
        @{
            role  = "user"
            parts = @(
                @{ text = "Hello from Vertex test" }
            )
        }
    )
    generationConfig = @{
        maxOutputTokens = 100
    }
} | ConvertTo-Json -Depth 5

Write-Host "`nAttempt 1: Sending Key as Query Parameter (?key=...)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri $UrlWithKey -Method Post -Headers @{ "Content-Type" = "application/json" } -Body $body -ErrorAction Stop
    Write-Host "✅ SUCCESS! Vertex AI Accepted the Key." -ForegroundColor Green
    Write-Host "Response: $($response.candidates.content.parts.text)"
    exit 0
}
catch {
    Write-Host "❌ Attempt 1 Failed." -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "Body: $($reader.ReadToEnd())"
    }
    else {
        Write-Host $_.Exception.Message
    }
}

Write-Host "`nAttempt 2: Sending Key as Bearer Token (Authorization: Bearer ...)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri $Url -Method Post -Headers @{ 
        "Content-Type"  = "application/json" 
        "Authorization" = "Bearer $ApiKey"
    } -Body $body -ErrorAction Stop
    Write-Host "✅ SUCCESS! Vertex AI Accepted the Bearer Token." -ForegroundColor Green
    Write-Host "Response: $($response.candidates.content.parts.text)"
}
catch {
    Write-Host "❌ Attempt 2 Failed." -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "Body: $($reader.ReadToEnd())"
    }
    else {
        Write-Host $_.Exception.Message
    }
}
