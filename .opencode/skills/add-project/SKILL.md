---
name: add-project
description: Add a new project to the site (projects.json, /work/<slug>/ page, images), following README.md conventions.
---

## What I do
I add a new project end-to-end: data entry, work page, and assets, keeping URLs stable and the site fully static.

## When to use me
Use me when you want a brand-new project to appear on the home/projects page and have a `/work/<slug>/` detail page.

## How to use me
- Update `public/assets/data/projects.json` with a new entry (see README “Projects” for required/optional fields).
- Ensure `slug` is URL-safe and matches the folder name `public/work/<slug>/`.
- Create the work page by copying an existing template (example: `public/work/other-projects/index.html`) to `public/work/<slug>/index.html`.
- Add images:
  - Card/hero image: place in `public/assets/img/` and set `image` to that filename.
  - Gallery images: place in `public/assets/img/projects/<slug>/` and add to `gallery`.
- Optional: set `youtubeId` (YouTube video id) to enable embedding on the work page.
- Verify:
  - `python3 -c "import json; json.load(open('public/assets/data/projects.json')); print('projects.json ok')"`
  - `python3 -m http.server --directory public 4321 & pid=$!; sleep 0.5; curl -sSf http://localhost:4321/work/<slug>/ >/dev/null; kill $pid`
