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

function setVideo(youtubeId) {
  const wrap = document.querySelector('[data-video]');
  if (!wrap) return;
  wrap.innerHTML = '';
  if (!youtubeId) {
    wrap.innerHTML = '<div class="note">Video coming soon.</div>';
    return;
  }

  const div = el('div', { class: 'video' });
  const iframe = document.createElement('iframe');
  iframe.loading = 'lazy';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(youtubeId);
  iframe.title = 'YouTube video player';
  div.appendChild(iframe);
  wrap.appendChild(div);
}

function setGallery(p) {
  const wrap = document.querySelector('[data-gallery]');
  if (!wrap) return;
  wrap.innerHTML = '';

  const items = (p.gallery || []).filter(Boolean);
  if (!items.length) {
    wrap.innerHTML = '<div class="note">Gallery coming soon.</div>';
    return;
  }

  const grid = el('div', { class: 'gallery' });
  for (const g of items) {
    const img = el('img', {
      src: '../../assets/img/' + g.image,
      alt: g.alt || p.title,
      loading: 'lazy',
      decoding: 'async'
    });
    const box = el('div', { class: 'gitem' }, [img]);
    if (g.caption) box.appendChild(el('div', { class: 'gcap', text: g.caption }));
    grid.appendChild(box);
  }
  wrap.appendChild(grid);
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

    setAttr('[data-hero-img]', 'src', '../../assets/img/' + p.image);
    setAttr('[data-hero-img]', 'alt', p.title);

    setOutcomes(p);
    setVideo(p.youtubeId);
    setGallery(p);
    setLinks(p);
    renderRelated(projects, p);
    if (window.revealRefresh) window.revealRefresh();
  } catch (err) {
    console.error(err);
    setText('[data-impact]', 'Could not load project data.');
  }
});
