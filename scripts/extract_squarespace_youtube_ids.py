#!/usr/bin/env python3
"""Extract YouTube video IDs from Squarespace work pages.

This repo is static and keeps per-project video embeds as `youtubeId` in:
  public/assets/data/projects.json

This script:
  1) pulls the Squarespace sitemap
  2) enumerates `/work/<slug>` pages
  3) searches for common YouTube URL/embed patterns
  4) if not found, follows one hop to any `/img-...` links from the work page
  5) optionally updates projects.json in-place

Stdlib only.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET


BASE = "https://luismesias.squarespace.com"
SITEMAP_URL = BASE + "/sitemap.xml"


YOUTUBE_PATTERNS = [
    # iframe embeds
    re.compile(r"youtube(?:-nocookie)?\.com/embed/([A-Za-z0-9_-]{11})", re.IGNORECASE),
    # short URLs
    re.compile(r"youtu\.be/([A-Za-z0-9_-]{11})", re.IGNORECASE),
    # watch URLs
    re.compile(r"youtube\.com/watch\?v=([A-Za-z0-9_-]{11})", re.IGNORECASE),
    # legacy /v/ embeds
    re.compile(r"youtube(?:-nocookie)?\.com/v/([A-Za-z0-9_-]{11})", re.IGNORECASE),
    # some Squarespace blocks expose IDs directly
    re.compile(r"data-video-id=\"([A-Za-z0-9_-]{11})\"", re.IGNORECASE),
]


def eprint(*args: object) -> None:
    print(*args, file=sys.stderr)


def fetch_text(url: str, timeout: float = 30.0) -> str:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "personalWebsite-migration/1.0 (+https://github.com/) python-urllib",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        data = resp.read()
    # Squarespace pages are UTF-8, but be forgiving.
    return data.decode("utf-8", errors="replace")


def extract_youtube_ids(text: str) -> list[str]:
    found: list[str] = []
    seen: set[str] = set()
    for pat in YOUTUBE_PATTERNS:
        for vid in pat.findall(text):
            if vid in seen:
                continue
            seen.add(vid)
            found.append(vid)
    return found


def work_slugs_from_sitemap(sitemap_xml: str) -> list[str]:
    try:
        root = ET.fromstring(sitemap_xml)
    except ET.ParseError as exc:
        raise RuntimeError("Failed to parse sitemap.xml") from exc

    slugs: list[str] = []
    seen: set[str] = set()

    # Namespace-agnostic locate <loc> elements.
    for loc in root.findall(".//{*}loc"):
        if not loc.text:
            continue
        url = loc.text.strip()
        if "/work/" not in url:
            continue
        parsed = urllib.parse.urlparse(url)
        parts = [p for p in parsed.path.split("/") if p]
        if len(parts) >= 2 and parts[0] == "work":
            slug = urllib.parse.unquote(parts[1])
            if slug and slug not in seen:
                seen.add(slug)
                slugs.append(slug)
    return slugs


def extract_img_hop_urls(work_html: str) -> list[str]:
    # Follow one hop to Squarespace image gallery pages (usually /img-...)
    hrefs = re.findall(r'href="([^"]+)"', work_html)
    out: list[str] = []
    seen: set[str] = set()
    for h in hrefs:
        if not h:
            continue
        # Skip anchors/mailto/etc.
        if h.startswith("#") or h.startswith("mailto:") or h.startswith("tel:"):
            continue
        abs_url = urllib.parse.urljoin(BASE + "/", h)
        if "/img-" not in abs_url:
            continue
        # Keep within the same site.
        if not abs_url.startswith(BASE + "/"):
            continue
        if abs_url in seen:
            continue
        seen.add(abs_url)
        out.append(abs_url)
    return out


def find_youtube_for_slug(slug: str, timeout: float = 30.0, sleep: float = 0.2) -> tuple[str, str]:
    """Returns (youtube_id, source_url). Empty id if not found."""
    work_url = f"{BASE}/work/{urllib.parse.quote(slug)}"

    try:
        html = fetch_text(work_url, timeout=timeout)
    except (urllib.error.URLError, urllib.error.HTTPError) as exc:
        eprint(f"WARN: fetch failed: {work_url} ({exc})")
        return "", work_url

    ids = extract_youtube_ids(html)
    if ids:
        return ids[0], work_url

    # One-hop follow to /img- pages referenced by the work page.
    for hop_url in extract_img_hop_urls(html):
        time.sleep(sleep)
        try:
            hop_html = fetch_text(hop_url, timeout=timeout)
        except (urllib.error.URLError, urllib.error.HTTPError):
            continue
        hop_ids = extract_youtube_ids(hop_html)
        if hop_ids:
            return hop_ids[0], hop_url

    return "", work_url


def update_projects_json(path: str, mapping: dict[str, str], overwrite: bool) -> int:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    projects = data.get("projects")
    if not isinstance(projects, list):
        raise RuntimeError("projects.json missing top-level 'projects' array")

    changed = 0
    for p in projects:
        if not isinstance(p, dict):
            continue
        slug = p.get("slug")
        if not isinstance(slug, str) or not slug:
            continue
        vid = mapping.get(slug, "")
        if not vid:
            continue

        cur = p.get("youtubeId", "")
        if isinstance(cur, str) and cur and not overwrite:
            continue
        if cur == vid:
            continue

        p["youtubeId"] = vid
        changed += 1

    if changed:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
            f.write("\n")

    return changed


def main(argv: list[str]) -> int:
    global BASE, SITEMAP_URL
    ap = argparse.ArgumentParser(description="Extract YouTube IDs from Squarespace /work pages")
    ap.add_argument("--base", default=BASE, help="Squarespace base URL")
    ap.add_argument("--sitemap", default=SITEMAP_URL, help="Sitemap URL")
    ap.add_argument("--timeout", type=float, default=30.0, help="HTTP timeout seconds")
    ap.add_argument("--sleep", type=float, default=0.2, help="Sleep seconds between hop requests")
    ap.add_argument(
        "--update-projects-json",
        default="",
        help="Path to projects.json to update (e.g. public/assets/data/projects.json)",
    )
    ap.add_argument("--overwrite", action="store_true", help="Overwrite existing non-empty youtubeId")
    args = ap.parse_args(argv)

    BASE = args.base.rstrip("/")
    SITEMAP_URL = args.sitemap

    try:
        sitemap_xml = fetch_text(SITEMAP_URL, timeout=args.timeout)
    except (urllib.error.URLError, urllib.error.HTTPError) as exc:
        eprint(f"ERROR: could not fetch sitemap: {SITEMAP_URL} ({exc})")
        return 2

    slugs = work_slugs_from_sitemap(sitemap_xml)
    if not slugs:
        eprint("ERROR: no /work/<slug> entries found in sitemap")
        return 2

    mapping: dict[str, str] = {}
    sources: dict[str, str] = {}

    for slug in slugs:
        vid, src = find_youtube_for_slug(slug, timeout=args.timeout, sleep=args.sleep)
        mapping[slug] = vid
        sources[slug] = src

    found = {k: v for k, v in mapping.items() if v}
    missing = [k for k, v in mapping.items() if not v]

    print(json.dumps({"found": found, "missing": missing, "sources": sources}, indent=2))

    if args.update_projects_json:
        changed = update_projects_json(args.update_projects_json, mapping, overwrite=args.overwrite)
        eprint(f"Updated {changed} project(s) in {args.update_projects_json}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
