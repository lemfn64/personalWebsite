async function loadJSON(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error('Failed to load ' + url);
  return await res.json();
}

const DATA_BASE_URL = (() => {
  // Compute relative to the script URL (`.../assets/js/projects.js` -> `.../assets/data/`).
  try {
    if (document.currentScript && document.currentScript.src) return new URL('../data/', document.currentScript.src);
  } catch (_) {
    // ignore
  }
  return null;
})();

function dataURL(filename) {
  if (DATA_BASE_URL) return new URL(filename, DATA_BASE_URL).toString();
  // Fallback for unusual execution environments.
  return './assets/data/' + filename;
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const child of children) node.appendChild(child);
  return node;
}

function normalize(s) {
  return String(s || '').toLowerCase();
}

function uniqSorted(arr) {
  return Array.from(new Set(arr.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function projectHref(slug) {
  return './work/' + encodeURIComponent(slug) + '/';
}

function renderProjectCard(p) {
  const card = el('a', { class: 'proj reveal', href: projectHref(p.slug) });

  const media = el('div', { class: 'proj-media' }, [
    el('img', {
      src: './assets/img/' + p.image,
      alt: p.title,
      loading: 'lazy',
      decoding: 'async'
    })
  ]);

  const tags = (p.tags || []).slice(0, 2).join(' • ');
  const metaLeft = tags ? el('span', { class: 'mini', text: tags }) : el('span', { class: 'mini', text: 'Project' });

  const body = el('div', { class: 'proj-body' }, [
    el('div', {}, [
      el('h3', { class: 'proj-title', text: p.title }),
      el('p', { class: 'proj-impact', text: p.impact || '' })
    ]),
    el('div', { class: 'proj-meta' }, [
      metaLeft,
      el('span', { text: p.year ? String(p.year) : '' })
    ])
  ]);

  card.appendChild(media);
  card.appendChild(body);
  return card;
}

function renderFilters(target, tags, activeTag) {
  target.innerHTML = '';

  const allBtn = el('button', {
    class: 'filter',
    type: 'button',
    'data-tag': '',
    'data-active': activeTag ? 'false' : 'true',
    text: 'All'
  });
  target.appendChild(allBtn);

  for (const t of tags) {
    const btn = el('button', {
      class: 'filter',
      type: 'button',
      'data-tag': t,
      'data-active': activeTag === t ? 'true' : 'false',
      text: t
    });
    target.appendChild(btn);
  }
}

function applyUI(site, projects) {
  const headline = document.querySelector('[data-site-headline]');
  if (headline) headline.textContent = site.headline || '';

  const sub = document.querySelector('[data-site-subheadline]');
  if (sub) sub.textContent = site.subheadline || '';

  const hl = document.querySelector('[data-site-highlights]');
  if (hl) {
    hl.innerHTML = '';
    for (const item of site.highlights || []) hl.appendChild(el('li', { text: item }));
  }

  const tagsWrap = document.querySelector('[data-site-tags]');
  if (tagsWrap) {
    tagsWrap.innerHTML = '';
    for (const t of site.focusTags || []) tagsWrap.appendChild(el('span', { class: 'tag', text: t }));
  }

  const emailBtn = document.querySelector('[data-email-link]');
  if (emailBtn && site.contact && site.contact.email) {
    emailBtn.setAttribute('href', 'mailto:' + site.contact.email);
  }

  const featuredSlugs = site.featuredProjectSlugs || [];
  const featured = featuredSlugs
    .map((s) => projects.find((p) => p.slug === s))
    .filter(Boolean);

  const featGrid = document.querySelector('[data-featured-grid]');
  if (featGrid) {
    featGrid.innerHTML = '';
    for (const p of featured) featGrid.appendChild(renderProjectCard(p));
  }

  const mosaic = document.querySelector('[data-mosaic]');
  if (mosaic) {
    const pics = featured.slice(0, 3);
    const tiles = mosaic.querySelectorAll('img[data-mosaic-img]');
    for (let i = 0; i < tiles.length; i++) {
      const p = pics[i];
      if (!p) continue;
      tiles[i].setAttribute('src', './assets/img/' + p.image);
      tiles[i].setAttribute('alt', p.title);
    }
  }
}

function filterProjects(projects, activeTag, query) {
  const q = normalize(query).trim();
  return projects.filter((p) => {
    if (activeTag) {
      const tags = p.tags || [];
      if (!tags.includes(activeTag)) return false;
    }
    if (q) {
      const hay = normalize([p.title, p.impact, (p.tags || []).join(' '), p.role, (p.orgs || []).join(' ')].join(' '));
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function sortProjects(projects) {
  return [...projects].sort((a, b) => {
    const ya = Number(a.year || 0);
    const yb = Number(b.year || 0);
    if (ya !== yb) return yb - ya;
    return String(a.title || '').localeCompare(String(b.title || ''));
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const allGrid = document.querySelector('[data-project-grid]');
  const featGrid = document.querySelector('[data-featured-grid]');
  const filtersWrap = document.querySelector('[data-project-filters]');
  const search = document.querySelector('[data-project-search]');
  const activePill = document.querySelector('[data-active-filter]');

  try {
    const [siteData, projData] = await Promise.all([
      loadJSON(dataURL('site.json')),
      loadJSON(dataURL('projects.json'))
    ]);

    const projects = sortProjects(projData.projects || []);
    applyUI(siteData, projects);

    const tags = uniqSorted(projects.flatMap((p) => p.tags || [])).filter((t) => t !== 'Misc');

    let activeTag = '';
    let query = '';

    function renderAll() {
      if (!allGrid) return;
      const filtered = filterProjects(projects, activeTag, query);
      allGrid.innerHTML = '';
      for (const p of filtered) allGrid.appendChild(renderProjectCard(p));
      if (activePill) activePill.textContent = activeTag ? activeTag : 'All';
      if (window.revealRefresh) window.revealRefresh();
    }

    function renderFilterUI() {
      if (!filtersWrap) return;
      renderFilters(filtersWrap, tags, activeTag);
    }

    renderFilterUI();
    renderAll();
    if (window.revealRefresh) window.revealRefresh();

    if (filtersWrap) {
      filtersWrap.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-tag]');
        if (!btn) return;
        activeTag = btn.getAttribute('data-tag') || '';
        renderFilterUI();
        renderAll();
      });
    }

    if (search) {
      search.addEventListener('input', () => {
        query = search.value || '';
        renderAll();
      });
    }
  } catch (err) {
    console.error(err);
    if (featGrid) {
      featGrid.innerHTML = '<div class="note">Could not load featured projects.</div>';
    }
    if (allGrid) {
      allGrid.innerHTML = '<div class="note">Could not load project data.</div>';
    }
    if (filtersWrap) filtersWrap.innerHTML = '';
  }
});
