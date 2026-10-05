/**
 * SIGNES.STUDIO — Files / WeTransfer Transfer Engine Generator
 * Automatically manages /files/[folder-name] routes, zips, expiration dates, and 404 root.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;
const filesDir = path.join(rootDir, 'files');
const configFile = path.join(filesDir, 'config.json');

// Ensure files directory exists
if (!fs.existsSync(filesDir)) {
  fs.mkdirSync(filesDir, { recursive: true });
}

// Read configuration
let config = {
  webhookUrl: "",
  studioName: "SIGNES.STUDIO",
  studioEmail: "office@signes.studio",
  studioPhone: "+34 614 459 144",
  defaultBgImage: "/img/portfolio/2506-DESEMBOCADURA-02-Pantalan.jpg"
};
if (fs.existsSync(configFile)) {
  try {
    config = Object.assign(config, JSON.parse(fs.readFileSync(configFile, 'utf-8')));
  } catch (e) {}
}

// Helper: Format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  if (bytes >= 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
  return (bytes / 1024).toFixed(1) + ' KB';
}

// Helper: Parse Expiration Date from text file
function parseExpiration(text) {
  if (!text) return null;
  const cleaned = text.trim();
  
  // 1. YYYY-MM-DD
  let m = cleaned.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) {
    return new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]), 23, 59, 59);
  }
  
  // 2. DD/MM/YYYY or DD-MM-YYYY
  m = cleaned.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (m) {
    return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]), 23, 59, 59);
  }

  // 3. DD de [mes] de YYYY
  const months = { enero:0, febrero:1, marzo:2, abril:3, mayo:4, junio:5, julio:6, agosto:7, septiembre:8, setiembre:8, octubre:9, noviembre:10, diciembre:11 };
  m = cleaned.toLowerCase().match(/(\d{1,2})\s+de\s+([a-z]+)(?:\s+de)?\s+(\d{4})/);
  if (m && months[m[2]] !== undefined) {
    return new Date(parseInt(m[3]), months[m[2]], parseInt(m[1]), 23, 59, 59);
  }

  return null;
}

// Helper: Get File Type Class
function getFileTypeClass(ext) {
  const e = ext.toLowerCase();
  if (e === 'pdf') return 'pdf';
  if (['dwg', 'dxf'].includes(e)) return 'dwg';
  if (['jpg', 'jpeg', 'png', 'webp', 'tif', 'tiff'].includes(e)) return 'img';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(e)) return 'zip';
  if (['doc', 'docx', 'odt'].includes(e)) return 'doc';
  return 'other';
}

// Helper: Generate 404 HTML content
function get404Html() {
  const base404 = path.join(rootDir, '404.html');
  if (fs.existsSync(base404)) {
    return fs.readFileSync(base404, 'utf-8');
  }
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>404 Not Found</title></head><body><h1>404 Not Found</h1></body></html>`;
}

// Helper: Generate WeTransfer Folder HTML Page
function generateFolderHtml(folderName, folderData) {
  const { files, totalFormatted, zipName, zipFormatted, expiration, count } = folderData;

  const filesListHtml = files.map(f => {
    const encodedName = encodeURIComponent(f.name);
    return `            <li class="file-item">
              <div class="file-main">
                <span class="file-icon ${f.typeClass}" aria-hidden="true">${f.ext}</span>
                <div class="file-info">
                  <span class="file-name" title="${f.name}">${f.name}</span>
                  <span class="file-size">${f.formattedSize}</span>
                </div>
              </div>
              <a href="/files/${folderName}/${encodedName}" download="${f.name}" data-filename="${f.name}" target="_blank" rel="noopener" class="file-action-btn" title="Descargar ${f.name}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </a>
            </li>`;
  }).join('\n\n');

  // Expiration Badge
  let expirationBadgeHtml = '';
  if (expiration && expiration.date) {
    if (expiration.isExpired) {
      expirationBadgeHtml = `
          <div class="expiration-notice expired" title="Esta transferencia ha superado su fecha de caducidad.">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>⚠️ Enlace caducado el ${expiration.formattedDate}</span>
          </div>`;
    } else if (expiration.daysLeft <= 3) {
      expirationBadgeHtml = `
          <div class="expiration-notice expiring-soon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Caduca el ${expiration.formattedDate} (en ${expiration.daysLeft} días)</span>
          </div>`;
    } else {
      expirationBadgeHtml = `
          <div class="expiration-notice active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>Disponible hasta el ${expiration.formattedDate} (${expiration.daysLeft} días restantes)</span>
          </div>`;
    }
  } else {
    expirationBadgeHtml = `
          <div class="expiration-notice active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 14 14"></polyline>
            </svg>
            <span>Sin fecha de caducidad</span>
          </div>`;
  }

  const transferTitleDisplay = folderName.toUpperCase();

  return `<!--
    SIGNES.STUDIO — Transferencia de archivos (/files/${folderName})
    https://signes.studio · 2026
-->
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SIGNES.STUDIO — Transferencia ${folderName}</title>
  <meta name="description" content="Descarga de archivos para ${folderName} por SIGNES.STUDIO.">
  
  <!-- Strict Privacy Directives: Private URL, do not index -->
  <meta name="robots" content="noindex, nofollow">
  <meta name="googlebot" content="noindex, nofollow">

  <!-- Open Graph / Link Previews -->
  <meta property="og:title" content="SIGNES.STUDIO — Transferencia ${folderName}">
  <meta property="og:description" content="Descarga de documentación y archivos por SIGNES.STUDIO.">
  <meta property="og:image" content="https://signes.studio${config.defaultBgImage}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://signes.studio/files/${folderName}">

  <!-- Favicons -->
  <link rel="icon" href="/favicon.ico" sizes="48x48">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">

  <!-- Fonts & Stylesheet -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@200;500&family=Manrope:wght@300;400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/files/transfer.css?v=1.0">
</head>
<body>

  <!-- Fullscreen Architectural Background -->
  <img 
    src="${config.defaultBgImage}" 
    alt="SIGNES.STUDIO Visual Research" 
    class="bg-image" 
    fetchpriority="high"
  >
  <div class="bg-overlay"></div>

  <!-- Viewport Container -->
  <main class="transfer-viewport">
    <div class="transfer-container">
      
      <!-- WeTransfer-style Transfer Window Card -->
      <section class="transfer-card" aria-label="Transferencia de archivos">
        
        <!-- Brand Row -->
        <div class="card-brand">
          <div>
            <a href="/" class="brand-link" aria-label="SIGNES.STUDIO Inicio">
              <span class="bold">SIGNES</span><span class="light">.STUDIO</span>
            </a>
            <p class="brand-tagline">Visual Research for Architecture</p>
          </div>
          <span class="folder-badge">${transferTitleDisplay}</span>
        </div>

        <!-- Transfer Status Overview -->
        <div class="card-overview">
          <div class="transfer-icon-wrap" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </div>
          <h1 class="transfer-title">Archivos listos para descargar</h1>
          <p class="transfer-meta">
            <span>${count} archivo${count === 1 ? '' : 's'}</span>
            <span class="meta-separator">·</span>
            <span>${totalFormatted}</span>
          </p>
          ${expirationBadgeHtml}
        </div>

        <!-- Actions -->
        <div class="card-actions">
          <!-- Primary CTA Button (Instant ZIP Download) -->
          <a 
            href="/files/${folderName}/${zipName}" 
            download="${zipName}" 
            class="btn-download-all" 
            id="downloadAllBtn"
            title="Descargar todos los archivos comprimidos en un archivo .zip"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Descargar todo (.zip · ${zipFormatted})</span>
          </a>

          <!-- Secondary Action: Copy Transfer Link -->
          <button type="button" class="btn-copy" id="copyLinkBtn" title="Copiar enlace de descarga para compartir">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            <span>Copiar enlace de descarga</span>
          </button>
        </div>

        <!-- Files List Breakdown -->
        <div class="card-files-section">
          <div class="files-header">
            <span>Contenido incluido (${count})</span>
            <span>Descargar</span>
          </div>

          <ul class="files-list" aria-label="Lista de archivos incluidos">
${filesListHtml}
          </ul>
        </div>
${folderData.uploadUrl ? `
        <!-- Card Upload Section (OneDrive) -->
        <div class="card-upload-section">
          <div class="upload-header">
            <span>Aportar archivos</span>
            <span>OneDrive</span>
          </div>
          <p class="upload-desc">¿Necesitas enviarnos planos, modelos o documentación para este proyecto? Puedes subirlos directamente a nuestro OneDrive aquí:</p>
          <a 
            href="${folderData.uploadUrl}" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="btn-upload" 
            title="Subir archivos directamente a OneDrive"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <span>Subir archivos a esta carpeta</span>
          </a>
        </div>` : ''}

        <!-- Card Footer -->
        <footer class="card-footer">
          <span>${config.studioName}</span>
          <a href="mailto:${config.studioEmail}" class="footer-link">${config.studioEmail}</a>
        </footer>

      </section>

    </div>
  </main>

  <!-- Bottom Right Credits (Desktop) -->
  <aside class="bg-credits" aria-hidden="true">
    <span>SIGNES.STUDIO</span>
    <span class="bg-credits-dot"></span>
    <span>Visual Research for Architecture</span>
  </aside>

  <!-- Toast Notification -->
  <div id="toast" class="toast-msg" role="status" aria-live="polite"></div>

  <!-- Embedded Transfer Engine Config -->
  <script>
    window.__TRANSFER_CONFIG__ = {
      folderName: ${JSON.stringify(folderName)},
      zipName: ${JSON.stringify(zipName)},
      webhookUrl: ${JSON.stringify(config.webhookUrl || "")}
    };
  </script>
  <script src="/files/transfer.js?v=1.0"></script>
</body>
</html>`;
}

// MAIN BUILD EXECUTION
function buildAllTransfers() {
  console.log('====================================================');
  console.log('  SIGNES.STUDIO — Files Transfer Engine Builder     ');
  console.log('====================================================\n');

  // 1. Generate 404 for Root /files (files/index.html & files.html)
  const notFoundHtml = get404Html();
  fs.writeFileSync(path.join(filesDir, 'index.html'), notFoundHtml, 'utf-8');
  fs.writeFileSync(path.join(rootDir, 'files.html'), notFoundHtml, 'utf-8');
  console.log('[404] Configured files/index.html and files.html -> Returns 404 on /files\n');

  // 2. Discover all subfolders in files/
  const items = fs.readdirSync(filesDir, { withFileTypes: true });
  const subfolders = items
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .filter(name => !name.startsWith('.') && name !== 'node_modules');

  if (subfolders.length === 0) {
    console.log('No transfer folders found in /files.');
    return;
  }

  const ignoredExtensions = ['.zip', '.html', '.css', '.js', '.json', '.map'];
  const expirationFilenames = ['caducidad.txt', 'expires.txt', 'vencimiento.txt', 'fecha.txt', 'info.txt'];
  const uploadFilenames = ['subidas.txt', 'upload.txt', 'onedrive.txt', 'subir.txt'];

  const now = new Date();
  const summaryReport = [];

  for (const folder of subfolders) {
    const currentFolderDir = path.join(filesDir, folder);
    console.log(`Processing folder: "${folder}"...`);

    // Check expiration file
    let expiration = null;
    for (const expFile of expirationFilenames) {
      const expPath = path.join(currentFolderDir, expFile);
      if (fs.existsSync(expPath)) {
        const text = fs.readFileSync(expPath, 'utf-8');
        const parsedDate = parseExpiration(text);
        if (parsedDate) {
          const isExpired = now.getTime() > parsedDate.getTime();
          const daysLeft = Math.ceil((parsedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const formattedDate = parsedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
          expiration = {
            raw: text.trim(),
            date: parsedDate.toISOString(),
            isExpired,
            daysLeft,
            formattedDate
          };
          break;
        }
      }
    }

    // Check upload URL file (e.g. OneDrive Request link)
    let uploadUrl = null;
    for (const upFile of uploadFilenames) {
      const upPath = path.join(currentFolderDir, upFile);
      if (fs.existsSync(upPath)) {
        const text = fs.readFileSync(upPath, 'utf-8');
        const validLine = text.split('\n')
          .map(l => l.trim())
          .filter(l => l && !l.startsWith('#') && !l.startsWith('//'))
          .find(l => /^https?:\/\//i.test(l));
        if (validLine) {
          uploadUrl = validLine.match(/https?:\/\/[^\s]+/)[0];
          break;
        }
      }
    }

    // List downloadable files
    const allFiles = fs.readdirSync(currentFolderDir).filter(name => {
      if (name.startsWith('.') || name === 'Thumbs.db') return false;
      const ext = path.extname(name).toLowerCase();
      if (ignoredExtensions.includes(ext)) return false;
      if (expirationFilenames.includes(name.toLowerCase())) return false;
      if (uploadFilenames.includes(name.toLowerCase())) return false;
      const full = path.join(currentFolderDir, name);
      return fs.statSync(full).isFile();
    }).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    if (allFiles.length === 0) {
      console.warn(` [!] Warning: Folder "${folder}" has no files to download.`);
      continue;
    }

    let totalBytes = 0;
    const fileEntries = allFiles.map(name => {
      const full = path.join(currentFolderDir, name);
      const size = fs.statSync(full).size;
      totalBytes += size;
      const ext = path.extname(name).toLowerCase().replace('.', '').toUpperCase() || 'FILE';
      return {
        name,
        size,
        formattedSize: formatBytes(size),
        ext,
        typeClass: getFileTypeClass(ext)
      };
    });

    const totalFormatted = formatBytes(totalBytes);
    const zipName = `${folder}.zip`;
    const zipPath = path.join(currentFolderDir, zipName);

    // Create zip archive
    console.log(` -> Compressing ${allFiles.length} file(s) into ${zipName}...`);
    const isWindows = process.platform === 'win32';
    if (isWindows) {
      const ps1 = path.join(rootDir, 'zip-folder.ps1');
      execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${ps1}" -SourceFolder "${currentFolderDir}" -DestinationZip "${zipPath}"`, { stdio: 'inherit' });
    } else {
      const fileArgs = allFiles.map(f => `"${f}"`).join(' ');
      execSync(`cd "${currentFolderDir}" && zip -q "${zipName}" ${fileArgs}`, { stdio: 'inherit' });
    }

    const zipSize = fs.existsSync(zipPath) ? fs.statSync(zipPath).size : 0;
    const zipFormatted = formatBytes(zipSize);

    // Generate HTML for folder
    const folderData = {
      files: fileEntries,
      count: fileEntries.length,
      totalBytes,
      totalFormatted,
      zipName,
      zipSize,
      zipFormatted,
      expiration,
      uploadUrl
    };

    const folderHtml = generateFolderHtml(folder, folderData);
    
    // Save files/[folder]/index.html (for /files/folder/)
    fs.writeFileSync(path.join(currentFolderDir, 'index.html'), folderHtml, 'utf-8');
    
    // Save files/[folder].html (for /files/folder without trailing slash)
    fs.writeFileSync(path.join(filesDir, `${folder}.html`), folderHtml, 'utf-8');

    // Save info.json
    fs.writeFileSync(path.join(currentFolderDir, 'info.json'), JSON.stringify({
      folder,
      updatedAt: new Date().toISOString(),
      ...folderData
    }, null, 2), 'utf-8');

    console.log(` -> Generated: /files/${folder} (${fileEntries.length} archivos, zip: ${zipFormatted}, subidas: ${uploadUrl ? 'OneDrive' : 'no'})\n`);

    summaryReport.push({
      folder,
      url: `https://signes.studio/files/${folder}`,
      filesCount: fileEntries.length,
      size: totalFormatted,
      zipSize: zipFormatted,
      expiration: expiration 
        ? (expiration.isExpired ? `⚠️ CADUCADO (${expiration.formattedDate})` : `Activo (hasta ${expiration.formattedDate}, quedan ${expiration.daysLeft} d)`)
        : 'Sin caducidad',
      subidasOneDrive: uploadUrl ? '✅ Activado' : 'No'
    });
  }

  // Update _headers if needed
  updateHeadersFile();

  // Print Summary Table
  console.log('====================================================');
  console.log('                 TRANSFER DASHBOARD                 ');
  console.log('====================================================');
  console.table(summaryReport);
  console.log('Root URL: https://signes.studio/files -> Shows 404 (Hidden directory)');
  console.log('All routes generated successfully!\n');
}

// Helper: Ensure _headers includes /files rules
function updateHeadersFile() {
  const headersPath = path.join(rootDir, '_headers');
  if (!fs.existsSync(headersPath)) return;
  let headers = fs.readFileSync(headersPath, 'utf-8');

  const filesRules = [
    '/files',
    '  X-Robots-Tag: noindex, nofollow',
    '',
    '/files/*',
    '  X-Robots-Tag: noindex, nofollow',
    '',
    '/files.html',
    '  X-Robots-Tag: noindex, nofollow'
  ].join('\n');

  if (!headers.includes('/files/*')) {
    headers = headers.trim() + '\n\n' + filesRules + '\n';
    fs.writeFileSync(headersPath, headers, 'utf-8');
    console.log('Updated _headers with /files/* privacy directives.');
  }
}

// Run builder
buildAllTransfers();
