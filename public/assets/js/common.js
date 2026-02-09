function setCurrentYear() {
  const el = document.querySelector('[data-year]');
  if (!el) return;
  el.textContent = String(new Date().getFullYear());
}

let __revealIO;

function revealRefresh() {
  const items = Array.from(document.querySelectorAll('.reveal:not([data-reveal-bound])'));
  if (!items.length) return;

  if (!__revealIO) {
    __revealIO = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add('is-on');
          __revealIO.unobserve(e.target);
        }
      },
      { rootMargin: '40px 0px', threshold: 0.08 }
    );
  }

  for (const el of items) {
    el.setAttribute('data-reveal-bound', 'true');
    __revealIO.observe(el);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setCurrentYear();
  window.revealRefresh = revealRefresh;
  revealRefresh();
});
