const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;
const adjuntosDir = path.join(rootDir, 'adjuntos');
const zipFile = path.join(adjuntosDir, 'adjuntos.zip');
const filesJsonPath = path.join(adjuntosDir, 'files.json');

if (!fs.existsSync(adjuntosDir)) {
  console.error('Directory "adjuntos" does not exist.');
  process.exit(1);
}

// Format bytes into human-readable string
function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
  return (bytes / 1024).toFixed(1) + ' KB';
}

// Find all files to include
const ignoredExtensions = ['.zip', '.html', '.css', '.js', '.json', '.map'];
const fileNames = fs.readdirSync(adjuntosDir).filter(name => {
  if (name.startsWith('.') || name === 'Thumbs.db') return false;
  const ext = path.extname(name).toLowerCase();
  if (ignoredExtensions.includes(ext)) return false;
  const fullPath = path.join(adjuntosDir, name);
  return fs.statSync(fullPath).isFile();
}).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

console.log(`Found ${fileNames.length} file(s) in adjuntos:`);
let totalBytes = 0;
const fileData = fileNames.map(name => {
  const fullPath = path.join(adjuntosDir, name);
  const size = fs.statSync(fullPath).size;
  totalBytes += size;
  const ext = path.extname(name).toLowerCase().replace('.', '').toUpperCase() || 'FILE';
  const formattedSize = formatBytes(size);
  console.log(` - ${name} (${formattedSize})`);
  return { name, size, formattedSize, ext };
});

const totalFormatted = formatBytes(totalBytes);
console.log(`Total uncompressed: ${totalFormatted}`);

if (fileNames.length === 0) {
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
  const ps1 = path.join(rootDir, 'zip-adjuntos.ps1');
  execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${ps1}"`, { stdio: 'inherit' });
} else {
  const fileArgs = fileNames.map(f => `"${f}"`).join(' ');
  execSync(`cd "${adjuntosDir}" && zip -q "adjuntos.zip" ${fileArgs}`, { stdio: 'inherit' });
}

if (!fs.existsSync(zipFile)) {
  console.error('Failed to create adjuntos.zip');
  process.exit(1);
}

const zipSize = fs.statSync(zipFile).size;
const zipFormatted = formatBytes(zipSize);
console.log(`Success! adjuntos.zip created (${zipFormatted}).`);

// Save files.json
fs.writeFileSync(filesJsonPath, JSON.stringify({
  count: fileNames.length,
  totalBytes,
  totalFormatted,
  zipSize,
  zipFormatted,
  updatedAt: new Date().toISOString(),
  files: fileData
}, null, 2), 'utf-8');
console.log('Saved adjuntos/files.json');

// Generate HTML items list
const fileItemsHtml = fileData.map(f => {
  const badgeClass = f.ext === 'PDF' ? 'file-icon' : 'file-icon file-icon-alt';
  const encodedName = encodeURIComponent(f.name);
  return `            <li class="file-item">
              <div class="file-main">
                <span class="${badgeClass}" aria-hidden="true">${f.ext}</span>
                <div class="file-info">
                  <span class="file-name" title="${f.name}">${f.name}</span>
                  <span class="file-size">${f.formattedSize}</span>
                </div>
              </div>
              <a href="/adjuntos/${encodedName}" download="${f.name}" target="_blank" rel="noopener" class="file-action-btn" title="Descargar ${f.name}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </a>
            </li>`;
}).join('\n\n');

// Function to update HTML document
function updateHtmlFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf-8');

  // 1. Update meta count and size
  // e.g. <span>7 archivos</span> ... <span>2.3 MB</span>
  content = content.replace(
    /<p class="transfer-meta">[\s\S]*?<\/p>/,
    `<p class="transfer-meta">\n            <span>${fileNames.length} archivos</span>\n            <span class="meta-separator">·</span>\n            <span>${totalFormatted}</span>\n            <span class="meta-separator">·</span>\n            <span>Sin caducidad</span>\n          </p>`
  );

  // 2. Update button zip size
  // e.g. <span>Descargar todo (.zip · 1.7 MB)</span>
  content = content.replace(
    /<span>Descargar todo \(\.zip[^\)]*\)<\/span>/,
    `<span>Descargar todo (.zip · ${zipFormatted})</span>`
  );

  // 3. Update header count
  // e.g. <span>Contenido adjunto (7)</span>
  content = content.replace(
    /<span>Contenido adjunto \(\d+\)<\/span>/,
    `<span>Contenido adjunto (${fileNames.length})</span>`
  );

  // 4. Update files list
  content = content.replace(
    /<ul class="files-list"[^>]*>[\s\S]*?<\/ul>/,
    `<ul class="files-list" aria-label="Lista de archivos adjuntos">\n${fileItemsHtml}\n          </ul>`
  );

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Updated ${path.basename(path.dirname(filePath))}/${path.basename(filePath)}`);
}

updateHtmlFile(path.join(rootDir, 'adjuntos.html'));
updateHtmlFile(path.join(adjuntosDir, 'index.html'));

console.log('\nAll done! adjuntos landing pages & zip are synchronized.');
