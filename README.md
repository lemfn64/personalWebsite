# personalWebsite

Static personal website (GitHub Pages).

Local preview:

```bash
python3 -m http.server --directory public 4321
```

Then open http://localhost:4321

Edit content:
- `public/assets/data/site.json`
- `public/assets/data/projects.json`
- `public/assets/data/publications.json`

## Editing Guide

### Site summary + featured content

Edit `public/assets/data/site.json`:
- `headline` and `subheadline` (home page header)
- `highlights` (2-3 resume bullets)
- `focusTags` (tag chips)
- `featuredProjectSlugs` (controls Featured Projects + the 3-image mosaic)

### Projects

1) Add/update an entry in `public/assets/data/projects.json`.

Minimum fields you should fill:
- `slug` (used for the URL: `/work/<slug>/`)
- `title`
- `impact` (1-line description)
- `year`
- `tags` (used for filtering)
- `image` (filename under `public/assets/img/`)

Optional but recommended:
- `role`, `orgs`
- `outcomes` (2-5 bullets)
- `links` (paper/code/demo)
- `youtubeId` (YouTube video id; work pages embed via `youtube-nocookie.com`)
- `gallery` (extra images for the work page)

2) Add the project page (URL stays stable):
- Copy any existing file like `public/work/other-projects/index.html` to `public/work/<slug>/index.html`.

3) Add images:
- Card/hero image: put it in `public/assets/img/` and set `image` to the filename.
- Gallery images: put them in `public/assets/img/projects/<slug>/` and add entries to `gallery`.

### Publications

Edit `public/assets/data/publications.json`.

Recommended fields:
- `title`, `authors`, `year`, `type`, `venue`, `note`
- `url` and `links` (DOI/PDF/etc)

### Resume + CV

Replace these files (keep the same names):
- `public/s/Resume.pdf`
- `public/s/CV.pdf`
