param (
    [string]$ApiKey
)

$Url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$ApiKey"

Write-Host ">>> TESTING GOOGLE API KEY DIRECTLY <<<" -ForegroundColor Cyan
Write-Host "Key (masked): $( $ApiKey.Substring(0,5) )..."
Write-Host "Endpoint: $Url"

try {
    $body = @{
        contents = @(
            @{
                parts = @(
                    @{ text = "Hello, are you working?" }
                )
            }
        )
    } | ConvertTo-Json -Depth 5

    $response = Invoke-RestMethod -Uri $Url -Method Post -Headers @{ "Content-Type" = "application/json" } -Body $body -ErrorAction Stop
    
    Write-Host "✅ SUCCESS! The key is VALID." -ForegroundColor Green
    Write-Host "Response: $($response.candidates.content.parts.text)"
}
catch {
    Write-Host "❌ FAILURE! The key is INVALID or Unsupported." -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)"
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errBody = $reader.ReadToEnd()
        Write-Host "Error Body: $errBody" -ForegroundColor Yellow
    }
    else {
        Write-Host $_.Exception.Message
    }
}
