param([string]$ApiKey)
$Url = "https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=$ApiKey"
Write-Host "Testing Endpoint: $Url"

$body = '{ "instances": [ { "prompt": "Red sports car" } ], "parameters": { "sampleCount": 1 } }'

try {
    $response = Invoke-RestMethod -Uri $Url -Method Post -Headers @{"Content-Type" = "application/json" } -Body $body -ErrorAction Stop
    Write-Host "SUCCESS"
    $base64 = $response.predictions[0].bytesBase64Encoded
    if ($base64) {
        Write-Host "Image Base64 Length: $($base64.Length)"
    }
    else {
        Write-Host "No Base64 in response"
    }
}
catch {
    Write-Host "FAILED"
    Write-Host $_.Exception.Message
}
