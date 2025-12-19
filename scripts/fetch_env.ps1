$headers = @{ 'X-Master-Key' = $env:JSONBIN_API_KEY }
$response = Invoke-RestMethod -Uri $env:JSONBIN_URL -Headers $headers

# Build env file content
$envContent = ""
foreach ($prop in $response.record.PSObject.Properties) {
    $envContent += "$($prop.Name)=$($prop.Value)`n"
}

# Write to .env file without BOM
[System.IO.File]::WriteAllText(".env", $envContent.TrimEnd())
