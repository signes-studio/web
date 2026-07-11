// SIGNES.STUDIO — shared site script

document.addEventListener('DOMContentLoaded', () => {

  /* --- Mobile nav toggle --- */
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', links.classList.contains('is-open'));
    });
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => links.classList.remove('is-open'));
    });
  }

  /* --- Mark active nav link --- */
  const current = document.body.dataset.page;
  if (current) {
    document.querySelectorAll('.nav-links a').forEach(a => {
      if (a.dataset.page === current) a.classList.add('is-active');
    });
  }

  /* --- Footer year --- */
  const yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* --- Work-list hover preview (desktop only) --- */
  const preview = document.querySelector('.hover-preview');
  const rows = document.querySelectorAll('.work-row[data-image]');
  if (preview && rows.length && window.matchMedia('(min-width: 901px)').matches) {
    const img = preview.querySelector('img');
    rows.forEach(row => {
      row.addEventListener('mouseenter', () => {
        img.src = row.dataset.image;
        img.alt = row.dataset.title || '';
        preview.classList.add('is-visible');
      });
      row.addEventListener('mousemove', (e) => {
        preview.style.transform = `translate(${e.clientX + 24}px, ${e.clientY - 140}px)`;
      });
      row.addEventListener('mouseleave', () => {
        preview.classList.remove('is-visible');
      });
    });
  }

  /* --- Basic click/inspect deterrent (does not stop a determined user;
     only discourages casual right-click "save image as" on renders) --- */
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F12') e.preventDefault();
    if (e.ctrlKey && e.key.toLowerCase() === 'u') e.preventDefault();
    if (e.ctrlKey && e.shiftKey && ['i', 'c', 'j'].includes(e.key.toLowerCase())) e.preventDefault();
  });
});
