/**
 * SIGNES.STUDIO — WeTransfer Transfer Engine & Download Logger (/files/*)
 * Handles file downloads, clipboard copying, telemetry beacon logging, and admin log viewer
 */

(function() {
  'use strict';

  // Read configuration embedded by build script
  const config = window.__TRANSFER_CONFIG__ || {};
  const currentFolder = config.folderName || window.location.pathname.split('/').filter(Boolean).pop() || 'files';
  const zipFile = config.zipName || (currentFolder + '.zip');
  const webhookUrl = config.webhookUrl || '';

  // Local storage key for persistent client log
  const LOGS_STORAGE_KEY = 'signes_download_logs';

  /**
   * Log download event to localStorage and remote webhook (if configured)
   */
  function logDownloadEvent(file, type) {
    const event = {
      folder: currentFolder,
      file: file,
      type: type || 'file',
      timestamp: new Date().toISOString(),
      localTime: new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'medium' }),
      url: window.location.href,
      referrer: document.referrer || 'direct',
      screen: `${window.innerWidth}x${window.innerHeight}`,
      userAgent: navigator.userAgent
    };

    // 1. Save to localStorage
    try {
      const existing = JSON.parse(localStorage.getItem(LOGS_STORAGE_KEY) || '[]');
      existing.unshift(event);
      // Keep up to 200 events
      if (existing.length > 200) existing.length = 200;
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(existing));
    } catch (e) {
      console.warn('Could not save download log to localStorage:', e);
    }

    // 2. Send to Remote Webhook (Google Sheets Apps Script, Discord, or serverless endpoint)
    if (webhookUrl) {
      try {
        const payload = JSON.stringify(event);
        if (navigator.sendBeacon) {
          const blob = new Blob([payload], { type: 'text/plain;charset=UTF-8' });
          navigator.sendBeacon(webhookUrl, blob);
        } else {
          fetch(webhookUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: payload
          }).catch(() => {});
        }
      } catch (err) {
        console.warn('Webhook transmission error:', err);
      }
    }

    // 3. Send to Google Analytics 4 (if gtag is active)
    if (typeof window.gtag === 'function') {
      try {
        window.gtag('event', 'file_download', {
          folder_name: currentFolder,
          file_name: file,
          download_type: type
        });
      } catch (e) {}
    }

    console.log(`[SIGNES LOG] Download registered: ${currentFolder} -> ${file} at ${event.localTime}`);
  }

  // Toast notifications helper
  function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // Initialize interactive controls on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    const fileActionBtns = document.querySelectorAll('.file-action-btn');

    // 1. Download All (.zip) Button
    if (downloadAllBtn) {
      downloadAllBtn.addEventListener('click', () => {
        logDownloadEvent(zipFile, 'zip_all');

        const originalHtml = downloadAllBtn.innerHTML;
        downloadAllBtn.classList.add('downloading');
        downloadAllBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
            <path d="M12 2a10 10 0 0 1 10 10"></path>
          </svg>
          <span>Iniciando descarga...</span>
        `;

        showToast('Descargando ' + zipFile + '...');

        setTimeout(() => {
          downloadAllBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Descarga iniciada</span>
          `;
        }, 1200);

        setTimeout(() => {
          downloadAllBtn.classList.remove('downloading');
          downloadAllBtn.innerHTML = originalHtml;
        }, 4000);
      });
    }

    // 2. Individual File Download links
    fileActionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const fileName = btn.getAttribute('download') || btn.getAttribute('data-filename') || 'archivo';
        logDownloadEvent(fileName, 'single_file');
        showToast('Descargando ' + fileName);
      });
    });

    // 3. Copy Link Button
    if (copyLinkBtn) {
      copyLinkBtn.addEventListener('click', async () => {
        const shareUrl = window.location.origin + window.location.pathname.replace(/\/index\.html$/, '');
        
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(shareUrl);
          } else {
            const tempInput = document.createElement('input');
            tempInput.value = shareUrl;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
          }

          copyLinkBtn.classList.add('copied');
          const origCopyHtml = copyLinkBtn.innerHTML;
          copyLinkBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>¡Enlace copiado!</span>
          `;
          showToast('Enlace de transferencia copiado');

          setTimeout(() => {
            copyLinkBtn.classList.remove('copied');
            copyLinkBtn.innerHTML = origCopyHtml;
          }, 2500);
        } catch (err) {
          console.error('Failed to copy', err);
          showToast('No se pudo copiar el enlace automáticamente');
        }
      });
    }

    // 4. Auto-download URL query param support (?download=1 or ?auto=1)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('download') || urlParams.has('auto') || urlParams.has('descargar')) {
      setTimeout(() => {
        if (downloadAllBtn) {
          downloadAllBtn.click();
        }
      }, 600);
    }

    // 5. Admin / Logs viewer modal if URL has ?logs=1 or ?admin=1
    if (urlParams.has('logs') || urlParams.has('admin')) {
      renderLogsModal();
    }
  });

  /**
   * Render logs modal when requested via ?logs=1
   */
  function renderLogsModal() {
    let modal = document.getElementById('logsModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'logsModal';
      modal.className = 'logs-modal visible';
      document.body.appendChild(modal);
    }

    let logs = [];
    try {
      logs = JSON.parse(localStorage.getItem(LOGS_STORAGE_KEY) || '[]');
    } catch (e) {}

    const folderLogs = logs.filter(l => l.folder === currentFolder);

    modal.innerHTML = `
      <div class="logs-modal-header">
        <span>📊 Registro de descargas — /files/${currentFolder}</span>
        <button id="closeLogsBtn" style="background:none;border:none;cursor:pointer;font-size:14px;">✕</button>
      </div>
      <p style="margin-bottom:8px;color:#666;">
        Total descargas registradas en este navegador: <strong>${folderLogs.length}</strong>
        ${webhookUrl ? '<br><span style="color:#2E7D32;">● Webhook remoto activo</span>' : '<br><span style="color:#E65100;">○ Sin webhook remoto (ver files/CONFIGURAR-LOGS.md)</span>'}
      </p>
      <ul class="logs-modal-list">
        ${folderLogs.length === 0 
          ? '<li style="color:#888;padding:8px 0;">No hay descargas registradas todavía en este navegador.</li>' 
          : folderLogs.map(l => `<li><strong>${l.localTime}</strong> · ${l.file} (${l.type})</li>`).join('')}
      </ul>
      <div style="margin-top:10px;display:flex;gap:8px;">
        <button id="clearLogsBtn" style="padding:4px 8px;font-size:10px;border:1px solid #ccc;border-radius:4px;background:#f9f9f9;cursor:pointer;">Limpiar historial local</button>
      </div>
    `;

    document.getElementById('closeLogsBtn')?.addEventListener('click', () => {
      modal.classList.remove('visible');
    });

    document.getElementById('clearLogsBtn')?.addEventListener('click', () => {
      if (confirm('¿Vaciar historial local de descargas?')) {
        localStorage.removeItem(LOGS_STORAGE_KEY);
        renderLogsModal();
      }
    });
  }

})();
