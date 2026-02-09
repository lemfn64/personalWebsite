---
name: update-featured-content
description: Update site-wide featured content (headline/highlights/focusTags/featuredProjectSlugs) via site.json.
---

## What I do
I adjust the homepage's featured/hero content and featured project selection.

## When to use me
Use me when you want to change the homepage headline, highlights, focus tags, or which projects are featured.

## How to use me
- Edit `public/assets/data/site.json`:
  - `headline`, `subheadline`, `highlights`, `focusTags`, `featuredProjectSlugs`
- Ensure every slug in `featuredProjectSlugs` exists in `public/assets/data/projects.json`.
- Verify:
  - `python3 -c "import json; json.load(open('public/assets/data/site.json')); print('site.json ok')"`
  - `python3 -m http.server --directory public 4321 & pid=$!; sleep 0.5; curl -sSf http://localhost:4321/ >/dev/null; kill $pid`
