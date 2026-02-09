---
name: update-publication
description: Edit an existing publication entry (title/authors/venue/links) and verify the publications page renders correctly.
---

## What I do
I modify publication metadata and links while keeping the list consistent and searchable.

## When to use me
Use me when you need to fix citation text, add DOI/PDF links, or adjust fields used by filters/search.

## How to use me
- Edit the relevant entry in `public/assets/data/publications.json`.
- Maintain consistent formatting and link structure.
- Verify:
  - `python3 -c "import json; json.load(open('public/assets/data/publications.json')); print('publications.json ok')"`
  - `python3 -m http.server --directory public 4321 & pid=$!; sleep 0.5; curl -sSf http://localhost:4321/publications/ >/dev/null; kill $pid`
