# Agent Notes (personalWebsite)

This repo is a static personal website published via GitHub Pages.
There is no Node/React build step: the site is served directly from `public/`.

If you are an agent making changes here, optimize for:
- minimal tooling (plain HTML/CSS/vanilla JS)
- stable URLs (especially `/work/<slug>/`)
- content-driven updates via JSON files in `public/assets/data/`

## Key Paths

- Site root served on Pages: `public/`
- Site-wide content: `public/assets/data/site.json`
- Projects content: `public/assets/data/projects.json`
- Publications content: `public/assets/data/publications.json`
- JS (no bundler): `public/assets/js/*.js`
- CSS: `public/assets/css/main.css`
- Work pages (one per slug): `public/work/<slug>/index.html`
- PDFs: `public/s/Resume.pdf`, `public/s/CV.pdf`
- Imported galleries: `public/assets/img/projects/<slug>/*`
- GitHub Pages workflow: `.github/workflows/pages.yml`

## Build / Lint / Test Commands

There is no formal build, lint, or test framework in this repo.
Use the commands below as “checks”.

### Local preview (dev server)

```bash
python3 -m http.server --directory public 4321
```

Open:
- http://localhost:4321/
- http://localhost:4321/publications/
- http://localhost:4321/work/<slug>/

### Smoke test key pages (headless)

```bash
python3 -m http.server --directory public 4321 &
pid=$!
sleep 0.5
curl -sSf http://localhost:4321/ >/dev/null
curl -sSf http://localhost:4321/publications/ >/dev/null
curl -sSf http://localhost:4321/work/a-low-profile-haptic-interface-based-on-surface-electrical-nerve-stimulation-for-teleoperation/ >/dev/null
kill $pid
```

### Validate data files (JSON)

```bash
python3 -c "import json; json.load(open('public/assets/data/site.json')); json.load(open('public/assets/data/projects.json')); json.load(open('public/assets/data/publications.json')); print('json ok')"
```

### “Single test” equivalent

There is no unit test runner. For a targeted check, validate the one file you touched:

```bash
python3 -c "import json; json.load(open('public/assets/data/projects.json')); print('projects.json ok')"
```

Or smoke-test one route:

```bash
python3 -m http.server --directory public 4321 & pid=$!; sleep 0.5; curl -sSf http://localhost:4321/work/<slug>/ >/dev/null; kill $pid
```

### Python script sanity (if editing `scripts/`)

```bash
python3 -m compileall -q scripts
```

## Deployment

- GitHub Actions deploys `public/` as the Pages artifact (`.github/workflows/pages.yml`).
- Do not introduce a build step unless you also update the workflow.

## Code Style Guidelines

### General

- Prefer small, local changes over large refactors.
- Keep URLs stable; `projects.json.slug` must match the folder in `public/work/<slug>/`.
- Avoid new dependencies and build tooling (no npm) unless explicitly requested.
- Use ASCII-only text in source files unless the file already contains Unicode.

### HTML

- Indentation: 2 spaces.
- Keep pages self-contained (each page links to shared CSS/JS under `public/assets/`).
- Accessibility:
  - keep `aria-label` on icon links
  - keep the skip link (`<a class="skip" ...>`)
  - ensure images have meaningful `alt` (or empty alt for purely decorative images)
- Headers/footers are duplicated across pages. If you change nav or icons, apply it to:
  - `public/index.html`
  - `public/publications/index.html`
  - `public/404.html`
  - all `public/work/*/index.html`

### CSS (`public/assets/css/main.css`)

- Indentation: 2 spaces.
- Prefer CSS variables in `:root` for colors, spacing, radii.
- Class naming: use the existing hyphenated style (`.topbar-inner`, `.proj-media`).
- Keep responsive rules grouped at the bottom; preserve `prefers-reduced-motion` handling.

### JavaScript (vanilla, no bundler)

- Indentation: 2 spaces.
- Use modern browser APIs (Fetch, `addEventListener`, `IntersectionObserver`).
- No module system; keep each file standalone.
- Naming:
  - functions: `camelCase` (`loadJSON`, `renderProjectCard`)
  - constants: `SCREAMING_SNAKE_CASE` only when truly constant
- DOM strategy:
  - use `data-*` hooks (e.g. `[data-project-grid]`) rather than fragile selectors
  - keep rendering functions pure-ish (return nodes; minimal side effects)
- Error handling:
  - for fetch failures: `console.error(err)` and show a minimal inline fallback (`<div class="note">...`)
  - avoid throwing uncaught errors from event handlers
- Globals:
  - avoid new globals; current allowed global is `window.revealRefresh` set in `public/assets/js/common.js`

### Data files (JSON)

- Format: 2-space indentation, trailing newline.
- `public/assets/data/site.json`:
  - `featuredProjectSlugs` controls Featured Projects and the 3-image mosaic.
- `public/assets/data/projects.json`:
  - `slug` must be URL-safe and match `public/work/<slug>/`.
  - `image` is a filename under `public/assets/img/`.
  - `gallery[].image` is relative to `public/assets/img/` (e.g. `projects/<slug>/file.jpg`).
- `public/assets/data/publications.json`:
  - keep `links[]` consistent (`label`, `url`).

### Python scripts (`scripts/`)

- Standard library only (no external deps).
- Imports: stdlib only; group and keep sorted.
- Prefer idempotent scripts (safe to run twice).
- Print warnings to stderr; avoid hard-failing on individual download errors.

## Content Editing Conventions

- Add a new project:
  1) Add entry in `public/assets/data/projects.json`.
  2) Copy an existing template to `public/work/<slug>/index.html`.
  3) Add images under `public/assets/img/` and optionally `public/assets/img/projects/<slug>/`.
- Update Resume/CV:
  - replace `public/s/Resume.pdf` and `public/s/CV.pdf` (keep filenames).

## Cursor/Copilot Rules

- No `.cursor/rules/`, `.cursorrules`, or `.github/copilot-instructions.md` were found in this repo at the time of writing.
