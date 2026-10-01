Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$destination = Join-Path $PSScriptRoot "adjuntos\adjuntos.zip"
if (Test-Path $destination) { 
    Remove-Item $destination -Force 
}

$files = Get-ChildItem -Path (Join-Path $PSScriptRoot "adjuntos") -File | Where-Object {
    $_.Extension -ne '.zip' -and 
    $_.Extension -ne '.html' -and 
    $_.Extension -ne '.css' -and 
    $_.Extension -ne '.js' -and
    $_.Extension -ne '.json' -and
    $_.Name -ne '.DS_Store'
}

if ($files.Count -gt 0) {
    $zipStream = [System.IO.File]::Open($destination, [System.IO.FileMode]::Create)
    $archive = New-Object System.IO.Compression.ZipArchive($zipStream, [System.IO.Compression.ZipArchiveMode]::Create)

    foreach ($f in $files) {
        $entry = $archive.CreateEntry($f.Name, [System.IO.Compression.CompressionLevel]::Optimal)
        $entryStream = $entry.Open()
        # Open with FileShare.ReadWrite to allow reading files even if opened in PDF reader
        $fileStream = [System.IO.File]::Open($f.FullName, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
        $fileStream.CopyTo($entryStream)
        $fileStream.Close()
        $entryStream.Close()
    }

    $archive.Dispose()
    $zipStream.Close()

    Write-Host "Created $destination with $($files.Count) files."
} else {
    Write-Host "No files found to compress."
}
