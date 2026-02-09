#!/usr/bin/env python3

"""Download public Squarespace project images into this repo.

This script is intentionally dependency-free.

It downloads images that were discovered on Squarespace work pages and their linked
"img-*" pages (one hop), then updates `public/assets/data/projects.json` to include
them in each project's `gallery`.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.parse
import urllib.request


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PROJECTS_JSON = os.path.join(ROOT, "public", "assets", "data", "projects.json")
IMG_ROOT = os.path.join(ROOT, "public", "assets", "img", "projects")


SQUARESPACE_GALLERIES: dict[str, list[str]] = {
    "a-low-profile-haptic-interface-based-on-surface-electrical-nerve-stimulation-for-teleoperation": [
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1731744608481-NFPZHO0PQJAHP4Y4M0ZZ/SensationFig.png",
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1731744841157-DCVZOMLLUG3C36E8FTZI/trackingSetup.png",
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1731745568966-2J7GY84CSYG2XSDH1PV4/Screenshot+2024-11-14+145022.png",
    ],
    "operator-centric-design-of-a-teleoperation-system": [
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/5e67d0c0-a704-4baa-afe6-711740e303fd/IMG20220715182322.jpg?format=2500w",
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/2a6e5c81-7bae-435d-b00f-3b9aaca4dc43/Handshake.jpg?format=2500w",
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/8df53354-5622-4686-8023-236930fea68f/IMG_8705.JPG?format=2500w",
    ],
    "treatment-and-assessment-of-ocular-disorders-through-vr-games": [
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1657695836671-JQZUFL5Z6AZLPVTLHLIG/ocular+VR.PNG?format=2500w",
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1657700499499-YEDL2941D2WVTTDNOTFA/StereoAcuity.PNG?format=2500w",
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1740519346965-OB8QFUVUP00XT2D9AWBP/treatment.jpg?format=2500w",
    ],
    "artificial-touch-feedback-through-skin-surface-electrical-stimulation-for-vr-applications-44xgk": [
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/9850258e-83b2-4b6f-a8bf-3782f267a427/Stim+system+dev.jpg?format=2500w",
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/c12b71c7-9640-4a89-a63b-1d61b2586f32/tResults52.png?format=2500w",
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1657703298820-XUGJLM5CN3918GHAAHA3/DSC09076.JPG",
    ],
    "e-stim-for-educators-workshop": [
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/aab7fe4c-6b40-4ba5-b4e9-c47c79bef465/flappy+bird+game.jpg?format=2500w",
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1b2e84ea-7922-4214-83fb-4b18704a6d7c/HHI_WhatsInBox1.jpg?format=2500w",
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/3ce1097e-a16b-4c8e-9e01-dc6b449a2827/IMG_8527+%281%29.JPG?format=2500w",
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1657907953611-2ZBQ3LKZIKJF61U0M4C2/CaptureFlappy.JPG",
    ],
    "the-benefits-of-a-virtual-reality-lab-over-a-lab-manual": [
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1575103593764-ETMWP1YJDLCTZ2G1DRAU/4.jpg?format=2500w",
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1575103717438-6E4GFTK22DR1SMBEIZ39/5.jpg?format=2500w",
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1575103810199-BJ5SRL9VCLOTGCICWAZK/Screenshot_20180329-144136.jpg?format=2500w",
    ],
    "tech-love-project": [
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1575102462981-8LZO95LTM3YOZAEFOMF7/IMG_20170602_114000.jpg?format=2500w",
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1575102613707-ZXTHVMXSTAM8GMNXW7Q9/IMG-20170915-WA0004.jpg?format=2500w",
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1575102758688-QS51J5G71C2EXQWRQO7P/IMG-20180712-WA0001.jpg?format=2500w",
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1575102811470-O86TAL9GHULEU9K1Y343/IMG-20180712-WA0006.jpg?format=2500w",
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1575102925677-4AF8NV8MAR39H9WXHG99/IMG-20180712-WA0007.jpg?format=2500w",
    ],
    "honors-institute-app": [
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1575101437993-006KBW4IW311FHZ1J167/image-asset.jpeg?format=2500w",
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1575101376359-9MSOQBMBSTWC1F73D2LH/HonorsBlog.png?format=2500w",
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1575101261053-SXS4RK73SC2ECWCEH140/conference+seattle+poster+stats.jpg?format=2500w",
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1575101187478-XU5KZQ2BI5LAXR4B4Q1V/image-asset.png?format=2500w",
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1575101095628-OMT1AR7RC322012ETZA7/image-asset.png?format=2500w",
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1575101109260-EK7IDUW8HTCIUDTJ4T1S/Calendar.png",
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1575101200801-V3Z666A0IEULB85XS2OX/CarPool.png",
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1575101021892-BMV5JQ04Z700S7RUNMAQ/69CCE079-C441-4E63-86B6-8AE9FF8B765A.jpg?format=2500w",
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1575101455006-RSJ8BS0WCL6JQUTY9AAV/rsz_banner1.jpg",
    ],
    "myographic-activity-tracker": [
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1575101556653-V49P0MX4AXQ7LHEJ5QIV/image-asset.jpeg?format=2500w",
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1575101618235-WFGULU5Y8QXRLV6RHGVH/image-asset.jpeg?format=2500w",
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1575101692901-1F37OJSROTZVL0XZ59KM/image-asset.jpeg?format=2500w",
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1575101572631-YR06EAS38TF3Z3AR7RCE/E459EAAB-8117-44EC-920F-1859FB65EEAB.jpg",
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1575101631412-HEGV1X4JZXBRCULMX7RO/P_20160425_095722.jpg",
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1575101704871-07BCKFXLMMBOV70YTIYO/P_20160502_081459.jpg",
    ],
    "other-projects": [
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1575101796010-WA7HF8HQMWUABBYSKUF5/43330877_2036161073108242_4058784179102139949_n.jpg?format=2500w",
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1575101857044-R8C0FD7OH7JS3TOGNIHW/44396990_349837398920634_590107096207736687_n.jpg?format=2500w",
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1575101977150-4JOWNV6GWB982X23WZLT/image-asset.jpeg?format=2500w",
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1575101990845-3MG2SWZG2R3U4QYF0TWG/43984826_331914127610977_6966156733180856527_n.jpg",
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1575102077524-TG5SO6T3J9IQZO111PD8/FB_IMG_1492789032078.jpg",
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1575102067104-KIBXRQTQZ2B0UDZGYX6B/image-asset.jpeg?format=2500w",
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1575102186780-B6QB5V1Q8Y696QF0PWR5/image-asset.jpeg?format=2500w",
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1575102194999-ZY561GZGODX974BDVOMA/MFVI7425.JPG",
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1575102269442-UPYT00EK2TY0ISBS5YT7/Screenshot_20181116-141005.jpg?format=2500w",
        "https://images.squarespace-cdn.com/content/v1/5dc78b546d7ebd6c3fb316e0/1575109176722-AE5WSRAXPXETVIVTF968/My+Post+%284%29.png?format=2500w",
    ],
}


def _read_json(path: str) -> object:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _write_json(path: str, data: object) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=True)
        f.write("\n")


def _safe_filename(url: str) -> str:
    parsed = urllib.parse.urlparse(url)
    name = os.path.basename(parsed.path)
    name = urllib.parse.unquote(name)
    name = name.replace(" ", "-")
    prev = os.path.basename(os.path.dirname(parsed.path))
    prev = urllib.parse.unquote(prev).replace(" ", "-")

    generic = {
        "image-asset.jpeg",
        "image-asset.jpg",
        "image-asset.png",
    }
    if name.lower() in generic and prev:
        return f"{prev}_{name}"

    return name


def _download(url: str, dest: str) -> None:
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        return

    req = urllib.request.Request(url, headers={"User-Agent": "personalWebsite-migrator/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = r.read()
    with open(dest, "wb") as f:
        f.write(data)


def main() -> int:
    os.makedirs(IMG_ROOT, exist_ok=True)

    projects = _read_json(PROJECTS_JSON)
    if not isinstance(projects, dict) or "projects" not in projects:
        raise SystemExit(f"Unexpected format: {PROJECTS_JSON}")

    proj_list = projects.get("projects")
    if not isinstance(proj_list, list):
        raise SystemExit(f"Unexpected format: {PROJECTS_JSON}")

    by_slug = {p.get("slug"): p for p in proj_list if isinstance(p, dict) and p.get("slug")}

    downloaded = 0
    for slug, urls in SQUARESPACE_GALLERIES.items():
        p = by_slug.get(slug)
        if not p:
            continue

        seen: set[str] = set()
        gallery: list[dict[str, str]] = []
        existing = p.get("gallery")
        if isinstance(existing, list):
            for g in existing:
                if not isinstance(g, dict):
                    continue
                img = g.get("image")
                if isinstance(img, str):
                    seen.add(img)
                    # Preserve any existing keys, but keep it JSON-serializable.
                    gallery.append({
                        "image": img,
                        "caption": str(g.get("caption") or ""),
                        "alt": str(g.get("alt") or ""),
                    })

        for url in urls:
            fn = _safe_filename(url)
            dest = os.path.join(IMG_ROOT, slug, fn)
            try:
                _download(url, dest)
                downloaded += 1
            except Exception as e:
                print(f"WARN: failed download {url}: {e}", file=sys.stderr)
                continue

            rel = f"projects/{slug}/{fn}"
            if rel in seen:
                continue
            seen.add(rel)
            gallery.append({"image": rel, "caption": "", "alt": ""})

        p["gallery"] = gallery

    _write_json(PROJECTS_JSON, projects)
    print(f"Done. Downloaded ~{downloaded} file(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
