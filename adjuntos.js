/**
 * SIGNES.STUDIO — WeTransfer Style Transfer Page
 * Handles interactive file download, clipboard sharing, and auto-download
 */

document.addEventListener('DOMContentLoaded', () => {
  const downloadAllBtn = document.getElementById('downloadAllBtn');
  const copyLinkBtn = document.getElementById('copyLinkBtn');
  const toast = document.getElementById('toast');

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // Handle Download All button click feedback
  if (downloadAllBtn) {
    downloadAllBtn.addEventListener('click', () => {
      const originalHtml = downloadAllBtn.innerHTML;
      
      downloadAllBtn.classList.add('downloading');
      downloadAllBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10"></path>
        </svg>
        <span>Iniciando descarga...</span>
      `;

      showToast('Descargando adjuntos.zip...');

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

  // Handle Copy Link button
  if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', async () => {
      const shareUrl = window.location.origin + '/adjuntos';
      
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(shareUrl);
        } else {
          // Fallback
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

  // Check URL query parameters for auto-download
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('download') || urlParams.has('auto') || urlParams.has('descargar')) {
    setTimeout(() => {
      if (downloadAllBtn) {
        downloadAllBtn.click();
      }
    }, 600);
  }
});
