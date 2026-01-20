param (
    [string]$ApiKey
)

$Project = "luxifier-node-3362-1"
$Location = "us-central1"
# Trying "imagen-3.0-generate-001" or the one from BBLA "imagegeneration@006"
$Model = "imagegeneration@006" 

$Url = "https://$Location-aiplatform.googleapis.com/v1/projects/$Project/locations/$Location/publishers/google/models/$Model`:predict?key=$ApiKey"

Write-Host ">>> TESTING VERTEX AI IMAGE GENERATION <<<" -ForegroundColor Cyan
Write-Host "Model: $Model"
Write-Host "Endpoint: $Url"

$body = @{
    instances  = @(
        @{ prompt = "A futuristic city with neon lights" }
    )
    parameters = @{
        sampleCount = 1
        aspectRatio = "1:1"
    }
} | ConvertTo-Json -Depth 5

try {
    Write-Host "`nSending Request..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri $Url -Method Post -Headers @{ "Content-Type" = "application/json" } -Body $body -ErrorAction Stop
    
    Write-Host "✅ SUCCESS! Image Generated." -ForegroundColor Green
    # Truncate base64 for display
    if ($response.predictions[0].bytesBase64Encoded) {
        Write-Host "Image Data Received (Base64 length: $($response.predictions[0].bytesBase64Encoded.Length))"
    }
    else {
        $response | ConvertTo-Json -Depth 2
    }
}
catch {
    Write-Host "❌ FAILURE! Vertex Image Gen Failed." -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "Body: $($reader.ReadToEnd())"
    }
    else {
        Write-Host $_.Exception.Message
    }
}
