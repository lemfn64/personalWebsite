function setCurrentYear() {
  const el = document.querySelector('[data-year]');
  if (!el) return;
  el.textContent = String(new Date().getFullYear());
}

// Progressive enhancement hook: only hide `.reveal` when JS runs.
try {
  document.documentElement.classList.add('js');
} catch (_) {
  // ignore
}

let __revealIO;

function revealRefresh() {
  const items = Array.from(document.querySelectorAll('.reveal:not([data-reveal-bound])'));
  if (!items.length) return;

  // Older browsers / restricted environments: show content immediately.
  if (typeof IntersectionObserver === 'undefined') {
    for (const el of items) {
      el.setAttribute('data-reveal-bound', 'true');
      el.classList.add('is-on');
    }
    return;
  }

  if (!__revealIO) {
    try {
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
    } catch (err) {
      console.error(err);
      for (const el of items) {
        el.setAttribute('data-reveal-bound', 'true');
        el.classList.add('is-on');
      }
      return;
    }
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
