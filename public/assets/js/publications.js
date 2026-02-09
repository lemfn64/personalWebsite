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

function normalize(s) {
  return String(s || '').toLowerCase();
}

function uniqSorted(arr, sortFn) {
  const base = Array.from(new Set(arr.filter(Boolean)));
  if (sortFn) return base.sort(sortFn);
  return base.sort((a, b) => String(a).localeCompare(String(b)));
}

function renderPub(pub) {
  const wrap = el('article', { class: 'pub reveal' });

  const title = el('h3', { class: 'pub-title' }, [
    el('a', { href: pub.url, target: '_blank', rel: 'noreferrer', text: pub.title })
  ]);

  const metaParts = [];
  if (pub.authors) metaParts.push(pub.authors);
  const venue = [pub.venue, pub.type].filter(Boolean).join(' • ');
  if (venue) metaParts.push(venue);
  if (pub.year) metaParts.push(String(pub.year));

  const meta = el('div', { class: 'pub-meta', text: metaParts.join(' — ') });
  const note = pub.note ? el('div', { class: 'pub-note', text: pub.note }) : null;

  const links = el('div', { class: 'pub-links' });
  for (const l of pub.links || []) {
    links.appendChild(el('a', { class: 'chiplink', href: l.url, target: '_blank', rel: 'noreferrer', text: l.label }));
  }
  if (!pub.links || !pub.links.length) {
    links.appendChild(el('a', { class: 'chiplink', href: pub.url, target: '_blank', rel: 'noreferrer', text: 'Link' }));
  }

  wrap.appendChild(title);
  wrap.appendChild(meta);
  if (note) wrap.appendChild(note);
  wrap.appendChild(links);
  return wrap;
}

function filterPubs(pubs, activeType, activeYear, query) {
  const q = normalize(query).trim();
  return pubs.filter((p) => {
    if (activeType && String(p.type || '') !== activeType) return false;
    if (activeYear && String(p.year || '') !== activeYear) return false;
    if (q) {
      const hay = normalize([p.title, p.authors, p.venue, p.type, p.note, p.doi].join(' '));
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function renderFilterRow(target, items, active, label) {
  target.innerHTML = '';

  const all = el('button', {
    class: 'filter',
    type: 'button',
    'data-value': '',
    'data-active': active ? 'false' : 'true',
    text: label
  });
  target.appendChild(all);

  for (const it of items) {
    target.appendChild(
      el('button', {
        class: 'filter',
        type: 'button',
        'data-value': String(it),
        'data-active': String(active) === String(it) ? 'true' : 'false',
        text: String(it)
      })
    );
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const list = document.querySelector('[data-pub-list]');
  const typeRow = document.querySelector('[data-pub-type-filters]');
  const yearRow = document.querySelector('[data-pub-year-filters]');
  const search = document.querySelector('[data-pub-search]');

  try {
    const data = await loadJSON('../assets/data/publications.json');
    const pubs = (data.publications || []).slice().sort((a, b) => Number(b.year || 0) - Number(a.year || 0));

    const types = uniqSorted(pubs.map((p) => p.type));
    const years = uniqSorted(pubs.map((p) => p.year), (a, b) => Number(b) - Number(a));

    let activeType = '';
    let activeYear = '';
    let query = '';

    function render() {
      if (!list) return;
      const filtered = filterPubs(pubs, activeType, activeYear, query);
      list.innerHTML = '';
      for (const p of filtered) list.appendChild(renderPub(p));
      if (!filtered.length) list.innerHTML = '<div class="note">No matches.</div>';
      if (window.revealRefresh) window.revealRefresh();
    }

    function renderFilters() {
      if (typeRow) renderFilterRow(typeRow, types, activeType, 'All types');
      if (yearRow) renderFilterRow(yearRow, years, activeYear, 'All years');
    }

    renderFilters();
    render();

    if (typeRow) {
      typeRow.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-value]');
        if (!btn) return;
        activeType = btn.getAttribute('data-value') || '';
        renderFilters();
        render();
      });
    }

    if (yearRow) {
      yearRow.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-value]');
        if (!btn) return;
        activeYear = btn.getAttribute('data-value') || '';
        renderFilters();
        render();
      });
    }

    if (search) {
      search.addEventListener('input', () => {
        query = search.value || '';
        render();
      });
    }
  } catch (err) {
    console.error(err);
    if (list) list.innerHTML = '<div class="note">Could not load publication data.</div>';
  }
});
