param(
    [Parameter(Mandatory=$true)]
    [string]$SourceFolder,
    
    [Parameter(Mandatory=$true)]
    [string]$DestinationZip
)

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

if (Test-Path $DestinationZip) {
    Remove-Item $DestinationZip -Force
}

$ignoredExtensions = @('.zip', '.html', '.css', '.js', '.json', '.map')
$ignoredNames = @('caducidad.txt', 'expires.txt', 'vencimiento.txt', 'fecha.txt', 'info.txt', 'subidas.txt', 'upload.txt', 'onedrive.txt', '.DS_Store', 'Thumbs.db')

$files = Get-ChildItem -Path $SourceFolder -File | Where-Object {
    $ext = $_.Extension.ToLower()
    $name = $_.Name.ToLower()
    (-not $ignoredExtensions.Contains($ext)) -and (-not $ignoredNames.Contains($name))
}

if ($files.Count -gt 0) {
    $zipStream = [System.IO.File]::Open($DestinationZip, [System.IO.FileMode]::Create)
    $archive = New-Object System.IO.Compression.ZipArchive($zipStream, [System.IO.Compression.ZipArchiveMode]::Create)

    foreach ($f in $files) {
        $entry = $archive.CreateEntry($f.Name, [System.IO.Compression.CompressionLevel]::Optimal)
        $entryStream = $entry.Open()
        # Read with FileShare.ReadWrite to prevent locking issues
        $fileStream = [System.IO.File]::Open($f.FullName, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
        $fileStream.CopyTo($entryStream)
        $fileStream.Close()
        $entryStream.Close()
    }

    $archive.Dispose()
    $zipStream.Close()

    Write-Host "Created $DestinationZip with $($files.Count) files."
} else {
    Write-Host "No files found to compress in $SourceFolder."
}
