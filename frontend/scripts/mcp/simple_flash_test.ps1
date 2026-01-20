param([string]$ApiKey)
$Url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$ApiKey"
Write-Host "Testing Endpoint: $Url"

$body = '{ "contents": [{ "parts": [{"text": "Hello"}] }] }'

try {
    $response = Invoke-RestMethod -Uri $Url -Method Post -Headers @{"Content-Type" = "application/json" } -Body $body -ErrorAction Stop
    Write-Host "SUCCESS"
    Write-Host $response.candidates[0].content.parts[0].text
}
catch {
    Write-Host "FAILED"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "Body: $($reader.ReadToEnd())"
    }
    else {
        Write-Host $_.Exception.Message
    }
}
