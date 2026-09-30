$destination = Join-Path $PSScriptRoot "adjuntos\adjuntos.zip"
$files = Get-ChildItem -Path (Join-Path $PSScriptRoot "adjuntos") -File | Where-Object {
    $_.Extension -ne '.zip' -and 
    $_.Extension -ne '.html' -and 
    $_.Extension -ne '.css' -and 
    $_.Extension -ne '.js' -and
    $_.Name -ne '.DS_Store'
}
if ($files.Count -gt 0) {
    Compress-Archive -Path $files.FullName -DestinationPath $destination -Force
    Write-Host "Created $destination with $($files.Count) files."
} else {
    Write-Host "No files found to compress."
}
