---
name: add-publication
description: Add a new publication entry to publications.json and verify it renders on /publications/.
---

## What I do
I add a new publication record in the site's JSON-driven publications list.

## When to use me
Use me when you have a new paper/poster/thesis/talk entry to add.

## How to use me
- Add an entry in `public/assets/data/publications.json` (see README “Publications” for recommended fields).
- Keep `links[]` consistent (`label`, `url`) when present.
- Verify:
  - `python3 -c "import json; json.load(open('public/assets/data/publications.json')); print('publications.json ok')"`
  - `python3 -m http.server --directory public 4321 & pid=$!; sleep 0.5; curl -sSf http://localhost:4321/publications/ >/dev/null; kill $pid`
