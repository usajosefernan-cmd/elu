param([string]$ApiKey)
# Minimal memory usage script
$Url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=$ApiKey"
try {
    $r = Invoke-RestMethod -Uri $Url -Method Post -Body '{"contents":[{"parts":[{"text":"Hi"}]}]}' -ContentType "application/json"
    Write-Host "SUCCESS: $($r.candidates[0].content.parts[0].text)"
}
catch {
    Write-Host "FAILED: $_"
}
