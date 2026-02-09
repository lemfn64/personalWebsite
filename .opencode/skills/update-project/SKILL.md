---
name: update-project
description: Modify an existing project entry/page (metadata, outcomes, links, gallery, youtubeId) without breaking stable URLs.
---

## What I do
I safely edit an existing project's content and assets while preserving the live URL structure.

## When to use me
Use me when you need to tweak project text, tags, images, gallery items, links, or video embed settings.

## How to use me
- Prefer editing fields in `public/assets/data/projects.json` (title/impact/tags/year/role/orgs/outcomes/links/gallery/youtubeId).
- If adding/removing images:
  - Put new hero images in `public/assets/img/`.
  - Put new gallery images in `public/assets/img/projects/<slug>/` and reference them in `gallery[].image` relative to `public/assets/img/`.
- Avoid changing `slug` after publishing; it changes `/work/<slug>/` and will break links. If you must, rename `public/work/<slug>/` to match and update the JSON entry.
- Verify JSON and smoke-test the specific route:
  - `python3 -c "import json; json.load(open('public/assets/data/projects.json')); print('projects.json ok')"`
  - `python3 -m http.server --directory public 4321 & pid=$!; sleep 0.5; curl -sSf http://localhost:4321/work/<slug>/ >/dev/null; kill $pid`
- Optional (Squarespace video migration):
  - `python3 scripts/extract_squarespace_youtube_ids.py --update-projects-json public/assets/data/projects.json`
