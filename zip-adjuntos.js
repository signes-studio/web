const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const adjuntosDir = path.join(__dirname, 'adjuntos');
const zipFile = path.join(adjuntosDir, 'adjuntos.zip');

if (!fs.existsSync(adjuntosDir)) {
  console.error('Directory "adjuntos" does not exist.');
  process.exit(1);
}

// Find all files to include
const ignoredExtensions = ['.zip', '.html', '.css', '.js', '.map'];
const files = fs.readdirSync(adjuntosDir).filter(name => {
  if (name.startsWith('.') || name === 'Thumbs.db') return false;
  const ext = path.extname(name).toLowerCase();
  if (ignoredExtensions.includes(ext)) return false;
  const fullPath = path.join(adjuntosDir, name);
  return fs.statSync(fullPath).isFile();
});

console.log(`Found ${files.length} file(s) in adjuntos:`);
let totalBytes = 0;
files.forEach(f => {
  const size = fs.statSync(path.join(adjuntosDir, f)).size;
  totalBytes += size;
  console.log(` - ${f} (${(size / 1024).toFixed(1)} KB)`);
});
console.log(`Total uncompressed: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);

if (files.length === 0) {
  console.log('No files to compress.');
  process.exit(0);
}

// Remove old zip if exists
if (fs.existsSync(zipFile)) {
  fs.unlinkSync(zipFile);
}

console.log('\nCreating adjuntos.zip...');

const isWindows = process.platform === 'win32';
if (isWindows) {
  // Use PowerShell Compress-Archive
  const ps1 = path.join(__dirname, 'zip-adjuntos.ps1');
  execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${ps1}"`, { stdio: 'inherit' });
} else {
  // Use unix zip command
  const fileArgs = files.map(f => `"${f}"`).join(' ');
  execSync(`cd "${adjuntosDir}" && zip -q "adjuntos.zip" ${fileArgs}`, { stdio: 'inherit' });
}

if (fs.existsSync(zipFile)) {
  const zipSize = fs.statSync(zipFile).size;
  console.log(`Success! adjuntos.zip created (${(zipSize / (1024 * 1024)).toFixed(2)} MB).`);
} else {
  console.error('Failed to create adjuntos.zip');
  process.exit(1);
}
