// SIGNES.STUDIO — Portfolio Lightbox Interaction
document.addEventListener('DOMContentLoaded', () => {
  const images = Array.from(document.querySelectorAll('.gallery-img'));
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxContent = document.getElementById('lightbox-content');
  const closeBtn = document.getElementById('lightbox-close');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');

  let currentIndex = -1;

  function openLightbox(index) {
    if (index < 0 || index >= images.length) return;
    currentIndex = index;
    const target = images[currentIndex];
    lightboxImg.src = target.src;
    lightboxImg.alt = target.alt || 'Enlarged image';
    lightbox.hidden = false;
    void lightbox.offsetWidth;
    lightbox.classList.add('is-open');
    document.body.classList.add('lightbox-active');
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    document.body.classList.remove('lightbox-active');
    setTimeout(() => {
      if (!lightbox.classList.contains('is-open')) {
        lightbox.hidden = true;
        lightboxImg.src = '';
      }
    }, 250);
  }

  function prevImage() {
    if (currentIndex > 0) {
      openLightbox(currentIndex - 1);
    } else {
      openLightbox(images.length - 1);
    }
  }

  function nextImage() {
    if (currentIndex < images.length - 1) {
      openLightbox(currentIndex + 1);
    } else {
      openLightbox(0);
    }
  }

  images.forEach((img, idx) => {
    img.addEventListener('click', () => openLightbox(idx));
  });

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); prevImage(); });
  if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); nextImage(); });

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target === lightboxContent) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') prevImage();
    else if (e.key === 'ArrowRight') nextImage();
  });

  let touchStartX = 0;
  let touchEndX = 0;
  lightbox.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  lightbox.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchEndX - touchStartX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) prevImage();
      else nextImage();
    }
  }, { passive: true });
});
