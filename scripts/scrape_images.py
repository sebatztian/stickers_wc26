#!/usr/bin/env python3
"""
Scrape player photos from Wikipedia for the Panini WC26 sticker album.

Usage:
  python scripts/scrape_images.py              # scrape all missing player images
  python scripts/scrape_images.py --code GER   # scrape only Germany
  python scripts/scrape_images.py --dry-run    # show what would be fetched

Stores images at: data/pictures/{CODE}/{CODE}{NUM}.jpg
Logs misses to:   data/missing_images.jsonl
"""

import re
import json
import time
import logging
import argparse
from pathlib import Path

import requests

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
PICTURES_DIR = DATA_DIR / "pictures"
STICKERS_FILE = DATA_DIR / "stickers_list.txt"
MISSING_FILE = DATA_DIR / "missing_images.jsonl"
LOG_FILE = DATA_DIR / "scraper.log"

RATE_LIMIT_S = 1.5
TIMEOUT_S = 10
THUMB_SIZE = 400

CORRECTIONS = {"SWI9": "SUI9", "SWI20": "SUI20", "KAS12": "KSA12"}

USER_AGENT = "PaniniWC26Scraper/1.0 (personal project; sebastianschreck0807@gmail.com)"

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# HTTP session
# ---------------------------------------------------------------------------
SESSION = requests.Session()
SESSION.headers["User-Agent"] = USER_AGENT


# ---------------------------------------------------------------------------
# Parse stickers_list.txt
# ---------------------------------------------------------------------------
def parse_stickers() -> list[dict]:
    """Return player stickers only (skip logos, team photos, FWC specials)."""
    results = []
    text = STICKERS_FILE.read_text(encoding="utf-8")
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue

        m = re.match(r"^([A-Z0-9]+)\s+(.+)$", line)
        if not m:
            continue

        raw_id, desc = m.group(1), m.group(2)
        raw_id = CORRECTIONS.get(raw_id, raw_id)

        code_m = re.match(r"^([A-Z]+)(\d+)$", raw_id)
        if not code_m:
            continue  # skip "00"

        code, num = code_m.group(1), int(code_m.group(2))

        # Skip non-player cards
        if code == "FWC":
            continue
        if "FOIL" in desc or "Team Photo" in desc:
            continue

        dash_idx = desc.rfind(" - ")
        if dash_idx < 0:
            continue

        name = desc[:dash_idx].strip()
        country = desc[dash_idx + 3:].strip()

        results.append(
            {"id": raw_id, "code": code, "num": num, "name": name, "country": country}
        )

    return results


# ---------------------------------------------------------------------------
# Wikipedia helpers
# ---------------------------------------------------------------------------
WP_API = "https://en.wikipedia.org/w/api.php"


def _wp_get(params: dict) -> dict:
    params.setdefault("format", "json")
    try:
        r = SESSION.get(WP_API, params=params, timeout=TIMEOUT_S)
        r.raise_for_status()
        return r.json()
    except Exception as exc:
        log.warning("Wikipedia API error: %s", exc)
        return {}


def search_page(player_name: str, country: str) -> str | None:
    """Return the Wikipedia page title for a footballer."""
    queries = [
        f"{player_name} footballer",
        f"{player_name} soccer player",
        f"{player_name} {country}",
    ]
    for q in queries:
        data = _wp_get({"action": "query", "list": "search", "srsearch": q,
                        "srnamespace": 0, "srlimit": 1})
        hits = data.get("query", {}).get("search", [])
        if hits:
            return hits[0]["title"]
        time.sleep(RATE_LIMIT_S)

    return None


def get_thumbnail(page_title: str) -> str | None:
    """Return thumbnail URL for the page's lead image."""
    data = _wp_get({"action": "query", "titles": page_title,
                    "prop": "pageimages", "pithumbsize": THUMB_SIZE,
                    "piprop": "thumbnail"})
    pages = data.get("query", {}).get("pages", {})
    for page in pages.values():
        src = page.get("thumbnail", {}).get("source")
        if src:
            return src
    time.sleep(RATE_LIMIT_S)
    return None


# ---------------------------------------------------------------------------
# Download
# ---------------------------------------------------------------------------
def download(url: str, dest: Path) -> bool:
    dest.parent.mkdir(parents=True, exist_ok=True)
    try:
        r = SESSION.get(url, timeout=TIMEOUT_S, stream=True)
        r.raise_for_status()
        if "image" not in r.headers.get("Content-Type", ""):
            log.warning("Non-image content for %s", url)
            return False
        dest.write_bytes(r.content)
        return True
    except Exception as exc:
        log.error("Download failed for %s: %s", url, exc)
        return False


def log_missing(sticker: dict) -> None:
    with open(MISSING_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(sticker) + "\n")


# ---------------------------------------------------------------------------
# Main scrape logic
# ---------------------------------------------------------------------------
def scrape_player(sticker: dict, dry_run: bool) -> str:
    """Returns: 'skipped' | 'success' | 'not_found' | 'error'"""
    dest = PICTURES_DIR / sticker["code"] / f"{sticker['id']}.jpg"

    if dest.exists():
        log.debug("[SKIP] %s already exists", sticker["id"])
        return "skipped"

    if dry_run:
        log.info("[DRY] Would fetch: %s — %s (%s)", sticker["id"], sticker["name"], sticker["country"])
        return "skipped"

    log.info("[FETCH] %s — %s (%s)", sticker["id"], sticker["name"], sticker["country"])

    title = search_page(sticker["name"], sticker["country"])
    if not title:
        log.warning("[NOT FOUND] %s — %s: no Wikipedia page", sticker["id"], sticker["name"])
        log_missing(sticker)
        return "not_found"

    thumb_url = get_thumbnail(title)
    if not thumb_url:
        log.warning("[NO IMAGE] %s — '%s' has no thumbnail", sticker["id"], title)
        log_missing(sticker)
        return "not_found"

    ok = download(thumb_url, dest)
    time.sleep(RATE_LIMIT_S)
    return "success" if ok else "error"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--code", help="Only scrape stickers for this country code (e.g. GER)")
    parser.add_argument("--dry-run", action="store_true", help="Log without downloading")
    args = parser.parse_args()

    stickers = parse_stickers()
    if args.code:
        stickers = [s for s in stickers if s["code"] == args.code.upper()]

    log.info("Processing %d stickers…", len(stickers))
    counts: dict[str, int] = {"skipped": 0, "success": 0, "not_found": 0, "error": 0}

    for sticker in stickers:
        result = scrape_player(sticker, dry_run=args.dry_run)
        counts[result] += 1

    log.info("Done. skipped=%d success=%d not_found=%d error=%d",
             counts["skipped"], counts["success"], counts["not_found"], counts["error"])


if __name__ == "__main__":
    main()
