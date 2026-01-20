param (
    [string]$ApiKey
)

$Url = "https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=$ApiKey"

Write-Host ">>> TESTING IMAGEN 4 FAST (via Gemini API) <<<" -ForegroundColor Cyan
Write-Host "Endpoint: $Url"

$body = @{
    instances  = @(
        @{ prompt = "A futuristic cyberpunk city with neon lights" }
    )
    parameters = @{
        aspectRatio = "16:9"
        sampleCount = 1
    }
} | ConvertTo-Json -Depth 5

try {
    Write-Host "Sending Request..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri $Url -Method Post -Headers @{ "Content-Type" = "application/json" } -Body $body -ErrorAction Stop
    
    Write-Host "✅ SUCCESS! Image Generated." -ForegroundColor Green
    
    if ($response.predictions) {
        $p = $response.predictions[0]
        if ($p.bytesBase64Encoded) {
            $len = $p.bytesBase64Encoded.Length
            Write-Host "📸 Image Data Received! (Base64 Size: $len characters)" -ForegroundColor Green
            Write-Host "This confirms the key works for High-End Image Generation."
        }
        else {
            Write-Host "Prediction received but no base64 found. Check response structure."
        }
    }
    else {
        Write-Host "No predictions array in response."
    }

}
catch {
    Write-Host "❌ FAILURE." -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errBody = $reader.ReadToEnd()
        Write-Host "Body: $errBody"
    } 
}
