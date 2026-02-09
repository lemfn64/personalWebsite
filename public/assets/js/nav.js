function setupMobileNav() {
  const btn = document.querySelector('[data-menu-btn]');
  const nav = document.querySelector('[data-nav-left]');
  if (!btn || !nav) return;

  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  document.addEventListener('click', (e) => {
    if (!nav.classList.contains('is-open')) return;
    if (nav.contains(e.target) || btn.contains(e.target)) return;
    nav.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupMobileNav();
});
