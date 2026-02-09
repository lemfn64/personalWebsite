async function loadJSON(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error('Failed to load ' + url);
  return await res.json();
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else node.setAttribute(k, v);
  }
  for (const child of children) node.appendChild(child);
  return node;
}

function getSlugFromPathname(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  const idx = parts.lastIndexOf('work');
  if (idx === -1 || idx + 1 >= parts.length) return null;
  return decodeURIComponent(parts[idx + 1]);
}

function setText(sel, text) {
  const node = document.querySelector(sel);
  if (!node) return;
  node.textContent = text;
}

function setAttr(sel, name, value) {
  const node = document.querySelector(sel);
  if (!node) return;
  node.setAttribute(name, value);
}

function setFacts(p) {
  const wrap = document.querySelector('[data-facts]');
  if (!wrap) return;
  wrap.innerHTML = '';

  const items = [];
  if (p.year) items.push({ k: 'Year', v: String(p.year) });
  if (p.role) items.push({ k: 'Role', v: p.role });
  if (p.orgs && p.orgs.length) items.push({ k: 'Orgs', v: p.orgs.join(', ') });

  for (const it of items) {
    wrap.appendChild(el('span', { class: 'fact' }, [el('b', { text: it.k + ':' }), el('span', { text: it.v })]));
  }
}

function setTags(p) {
  const wrap = document.querySelector('[data-tags]');
  if (!wrap) return;
  wrap.innerHTML = '';
  for (const t of p.tags || []) wrap.appendChild(el('span', { class: 'tag', text: t }));
  if (!p.tags || !p.tags.length) wrap.innerHTML = '<div class="note">Tags coming soon.</div>';
}

function setOutcomes(p) {
  const wrap = document.querySelector('[data-outcomes]');
  if (!wrap) return;
  wrap.innerHTML = '';

  const items = (p.outcomes || []).filter(Boolean);
  if (!items.length) {
    wrap.innerHTML = '<div class="note">Outcomes coming soon.</div>';
    return;
  }

  const ul = el('ul', { class: 'bullets' });
  for (const o of items) ul.appendChild(el('li', { text: o }));
  wrap.appendChild(ul);
}

function setLinks(p) {
  const wrap = document.querySelector('[data-links]');
  if (!wrap) return;
  wrap.innerHTML = '';

  const items = (p.links || []).filter(Boolean);
  if (!items.length) {
    wrap.innerHTML = '<div class="note">Links coming soon.</div>';
    return;
  }

  const row = el('div', { class: 'pub-links' });
  for (const l of items) {
    row.appendChild(el('a', { class: 'chiplink', href: l.url, target: '_blank', rel: 'noreferrer', text: l.label }));
  }
  wrap.appendChild(row);
}

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function imgPath(rel) {
  return '../../assets/img/' + rel;
}

function renderYouTubeEmbed(youtubeId, { loading = 'lazy', title = 'YouTube video player' } = {}) {
  const div = el('div', { class: 'video' });
  const iframe = document.createElement('iframe');
  iframe.loading = loading;
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(youtubeId);
  iframe.title = title;
  div.appendChild(iframe);
  return div;
}

function getSlides(p) {
  const slides = [];
  const seen = new Set();
  if (p.image) {
    slides.push({ image: p.image, alt: p.title || 'Project image', caption: '' });
    seen.add(p.image);
  }

  for (const g of (p.gallery || []).filter(Boolean)) {
    if (!g.image || seen.has(g.image)) continue;
    seen.add(g.image);
    slides.push({
      image: g.image,
      alt: g.alt || p.title || 'Project image',
      caption: g.caption || ''
    });
  }

  return slides;
}

function arrowSVG(dir) {
  // Minimal chevron icon.
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', dir === 'left' ? 'M14 6l-6 6 6 6' : 'M10 6l6 6-6 6');
  svg.appendChild(p);
  return svg;
}

function renderSlideshow(slides, {
  fallbackAlt = 'Project image',
  autoplay = true,
  delayMs = 4500,
  stageLoading = 'lazy'
} = {}) {
  const items = (slides || []).filter((s) => s && s.image);
  if (!items.length) return el('div', { class: 'note', text: 'Gallery coming soon.' });

  const canAutoplay = autoplay && !prefersReducedMotion() && items.length > 1;

  let idx = 0;
  let timer = null;
  let paused = false;

  const wrap = el('div', { class: 'slideshow' });
  wrap.tabIndex = 0;

  const stage = el('div', { class: 'slide-stage' });
  const img = el('img', {
    class: 'slide-img',
    src: imgPath(items[0].image),
    alt: items[0].alt || fallbackAlt,
    loading: stageLoading,
    decoding: 'async'
  });
  stage.appendChild(img);

  const prev = el('button', { class: 'slide-arrow prev', type: 'button', 'aria-label': 'Previous image' }, [arrowSVG('left')]);
  const next = el('button', { class: 'slide-arrow next', type: 'button', 'aria-label': 'Next image' }, [arrowSVG('right')]);
  stage.appendChild(prev);
  stage.appendChild(next);

  const cap = el('div', { class: 'slide-cap' });
  const thumbs = el('div', { class: 'slide-thumbs' });

  function setIndex(i, user) {
    idx = (i + items.length) % items.length;
    const it = items[idx];
    img.src = imgPath(it.image);
    img.alt = it.alt || fallbackAlt;

    if (it.caption) {
      cap.textContent = it.caption;
      cap.hidden = false;
    } else {
      cap.textContent = '';
      cap.hidden = true;
    }

    if (items.length > 1) {
      const btns = thumbs.querySelectorAll('button.thumb');
      for (let j = 0; j < btns.length; j++) btns[j].classList.toggle('is-active', j === idx);
    }

    if (user) restart();
  }

  function stop() {
    if (timer) window.clearTimeout(timer);
    timer = null;
  }

  function schedule() {
    if (!canAutoplay || paused) return;
    stop();
    timer = window.setTimeout(() => {
      setIndex(idx + 1, false);
      schedule();
    }, delayMs);
  }

  function restart() {
    if (!canAutoplay || paused) return;
    schedule();
  }

  function pause() {
    paused = true;
    stop();
  }

  function resume() {
    paused = false;
    schedule();
  }

  prev.addEventListener('click', () => setIndex(idx - 1, true));
  next.addEventListener('click', () => setIndex(idx + 1, true));

  // Swipe support (mobile): left/right to navigate.
  // Keep vertical scrolling working by not calling preventDefault.
  const SWIPE_MIN_PX = 44;
  const SWIPE_MAX_Y_PX = 60;
  let swipeActive = false;
  let startX = 0;
  let startY = 0;
  let startT = 0;

  function swipeStart(x, y) {
    swipeActive = true;
    startX = x;
    startY = y;
    startT = Date.now();
    pause();
  }

  function swipeEnd(x, y) {
    if (!swipeActive) return;
    swipeActive = false;

    const dx = x - startX;
    const dy = y - startY;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    const dt = Date.now() - startT;

    // Require a mostly-horizontal gesture.
    if (ady > SWIPE_MAX_Y_PX) {
      resume();
      return;
    }

    // Ignore long drags that are likely scrolls.
    if (dt > 1200) {
      resume();
      return;
    }

    if (adx >= SWIPE_MIN_PX && adx > ady * 1.2) {
      setIndex(dx < 0 ? idx + 1 : idx - 1, true);
      return;
    }

    resume();
  }

  if (window.PointerEvent) {
    let pid = null;

    stage.addEventListener('pointerdown', (e) => {
      if (items.length <= 1) return;
      if (e.pointerType && e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
      if (e.target && e.target.closest && e.target.closest('button')) return;
      pid = e.pointerId;
      swipeStart(e.clientX, e.clientY);
    });

    stage.addEventListener('pointerup', (e) => {
      if (pid === null || e.pointerId !== pid) return;
      pid = null;
      swipeEnd(e.clientX, e.clientY);
    });

    stage.addEventListener('pointercancel', () => {
      pid = null;
      swipeActive = false;
      resume();
    });
  } else {
    stage.addEventListener(
      'touchstart',
      (e) => {
        if (items.length <= 1) return;
        if (!e.touches || e.touches.length !== 1) return;
        if (e.target && e.target.closest && e.target.closest('button')) return;
        const t = e.touches[0];
        swipeStart(t.clientX, t.clientY);
      },
      { passive: true }
    );

    stage.addEventListener(
      'touchend',
      (e) => {
        if (!e.changedTouches || e.changedTouches.length !== 1) {
          resume();
          return;
        }
        const t = e.changedTouches[0];
        swipeEnd(t.clientX, t.clientY);
      },
      { passive: true }
    );

    stage.addEventListener(
      'touchcancel',
      () => {
        swipeActive = false;
        resume();
      },
      { passive: true }
    );
  }

  wrap.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setIndex(idx - 1, true);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setIndex(idx + 1, true);
    }
  });

  stage.addEventListener('mouseenter', pause);
  stage.addEventListener('mouseleave', resume);
  wrap.addEventListener('focusin', pause);
  wrap.addEventListener('focusout', () => {
    window.setTimeout(() => {
      if (!wrap.contains(document.activeElement)) resume();
    }, 0);
  });

  if (items.length > 1) {
    for (let i = 0; i < items.length; i++) {
      const b = el('button', { class: 'thumb', type: 'button', 'aria-label': 'View image ' + (i + 1) });
      const ti = el('img', {
        src: imgPath(items[i].image),
        alt: items[i].alt || fallbackAlt,
        loading: 'lazy',
        decoding: 'async'
      });
      b.appendChild(ti);
      b.classList.toggle('is-active', i === 0);
      b.addEventListener('click', () => setIndex(i, true));
      thumbs.appendChild(b);
    }
  }

  setIndex(0, false);

  wrap.appendChild(stage);
  wrap.appendChild(cap);
  if (items.length > 1) wrap.appendChild(thumbs);

  schedule();
  return wrap;
}

function setVideoSection(youtubeId) {
  const wrap = document.querySelector('[data-video]');
  if (!wrap) return;
  wrap.innerHTML = '';
  if (!youtubeId) {
    wrap.innerHTML = '<div class="note">Video coming soon.</div>';
    return;
  }
  wrap.appendChild(renderYouTubeEmbed(youtubeId));
}

function setGallerySection(p) {
  const wrap = document.querySelector('[data-gallery]');
  if (!wrap) return;
  wrap.innerHTML = '';
  wrap.appendChild(renderSlideshow(getSlides(p), { fallbackAlt: p.title || 'Project image', autoplay: true, delayMs: 4500 }));
}

function setBanner(p) {
  const heroImg = document.querySelector('[data-hero-img]');
  if (!heroImg) return;
  const slot = heroImg.closest('.gitem');
  if (!slot) return;

  const banner = el('div', { class: 'banner' });
  if (p.youtubeId) {
    banner.appendChild(renderYouTubeEmbed(p.youtubeId, { loading: 'lazy', title: (p.title || 'Project') + ' video' }));
  } else {
    banner.appendChild(
      renderSlideshow(getSlides(p), {
        fallbackAlt: p.title || 'Project image',
        autoplay: true,
        delayMs: 4200,
        stageLoading: 'eager'
      })
    );
  }

  slot.replaceWith(banner);
}

function cleanupWorkSpacers() {
  const container = document.querySelector('main .container');
  if (!container) return;
  // Remove empty spacer divs used by the static templates.
  const kids = Array.from(container.children);
  for (const k of kids) {
    if (k.tagName !== 'DIV') continue;
    if (!k.getAttribute('style')) continue;
    if ((k.textContent || '').trim()) continue;
    const h = k.style && k.style.height ? String(k.style.height).trim() : '';
    if (h === '14px') k.remove();
  }
}

function setWorkLayout(p) {
  cleanupWorkSpacers();

  const grid = document.querySelector('.work-grid');
  const videoWrap = document.querySelector('[data-video]');
  const galleryWrap = document.querySelector('[data-gallery]');
  const linksWrap = document.querySelector('[data-links]');

  const videoSection = videoWrap ? videoWrap.closest('section') : null;
  const gallerySection = galleryWrap ? galleryWrap.closest('section') : null;
  const linksSection = linksWrap ? linksWrap.closest('section') : null;

  if (p.youtubeId) {
    if (videoSection) videoSection.hidden = true;
    if (gallerySection) gallerySection.hidden = false;
    if (linksSection && gallerySection) linksSection.insertAdjacentElement('afterend', gallerySection);
  } else {
    if (gallerySection) gallerySection.hidden = true;
    if (videoSection) {
      videoSection.hidden = false;
      setVideoSection('');
      if (linksSection) linksSection.insertAdjacentElement('afterend', videoSection);
    }
  }

  if (grid) {
    const visible = Array.from(grid.children).filter((n) => n.tagName === 'SECTION' && !n.hidden);
    grid.setAttribute('data-cols', visible.length <= 1 ? '1' : '2');
  }
}

function scoreRelated(a, b) {
  const at = new Set(a.tags || []);
  const bt = new Set(b.tags || []);
  let overlap = 0;
  for (const t of at) if (bt.has(t)) overlap++;
  return overlap;
}

function renderRelated(all, current) {
  const wrap = document.querySelector('[data-related]');
  if (!wrap) return;
  wrap.innerHTML = '';

  const candidates = all
    .filter((p) => p.slug !== current.slug)
    .map((p) => ({ p, s: scoreRelated(current, p) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 3)
    .map((x) => x.p);

  if (!candidates.length) {
    wrap.innerHTML = '<div class="note">More projects coming soon.</div>';
    return;
  }

  const grid = el('div', { class: 'grid' });
  for (const p of candidates) {
    const a = el('a', { class: 'proj reveal', href: '../' + encodeURIComponent(p.slug) + '/' });
    const media = el('div', { class: 'proj-media' }, [
      el('img', { src: '../../assets/img/' + p.image, alt: p.title, loading: 'lazy', decoding: 'async' })
    ]);
    const body = el('div', { class: 'proj-body' }, [
      el('div', {}, [
        el('h3', { class: 'proj-title', text: p.title }),
        el('p', { class: 'proj-impact', text: p.impact || '' })
      ]),
      el('div', { class: 'proj-meta' }, [
        el('span', { class: 'mini', text: (p.tags || []).slice(0, 2).join(' • ') || 'Project' }),
        el('span', { text: p.year ? String(p.year) : '' })
      ])
    ]);
    a.appendChild(media);
    a.appendChild(body);
    grid.appendChild(a);
  }
  wrap.appendChild(grid);
}

document.addEventListener('DOMContentLoaded', async () => {
  const slug = getSlugFromPathname(window.location.pathname);
  if (!slug) return;

  try {
    const data = await loadJSON('../../assets/data/projects.json');
    const projects = data.projects || [];
    const p = projects.find((x) => x.slug === slug);

    if (!p) {
      setText('[data-title]', 'Project');
      setText('[data-impact]', 'This page exists, but the project entry is missing.');
      return;
    }

    document.title = p.title + ' — Luis Mesias';

    setText('[data-title]', p.title);
    setText('[data-impact]', p.impact || '');
    setFacts(p);
    setTags(p);

    setAttr('[data-hero-img]', 'src', imgPath(p.image));
    setAttr('[data-hero-img]', 'alt', p.title);

    setOutcomes(p);
    setVideoSection(p.youtubeId);
    setGallerySection(p);
    setLinks(p);
    setBanner(p);
    setWorkLayout(p);
    renderRelated(projects, p);
    if (window.revealRefresh) window.revealRefresh();
  } catch (err) {
    console.error(err);
    setText('[data-impact]', 'Could not load project data.');
  }
});
