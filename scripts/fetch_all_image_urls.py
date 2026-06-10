#!/usr/bin/env python3
"""
Fetch Wikimedia image URLs for all stickers and save to data/image_urls.json.
Does NOT download images — just stores URLs for the app to redirect to.

Usage:
  scripts/.venv/bin/python scripts/fetch_all_image_urls.py
  scripts/.venv/bin/python scripts/fetch_all_image_urls.py --code GER
  scripts/.venv/bin/python scripts/fetch_all_image_urls.py --dry-run

Output: data/image_urls.json  { "MEX5": "https://upload.wikimedia.org/...", ... }
Then run: pnpm tsx scripts/import_image_urls.ts
"""

import argparse
import json
import re
import time
from pathlib import Path

import requests

PROJECT_ROOT = Path(__file__).resolve().parent.parent
STICKERS_FILE = PROJECT_ROOT / "data" / "stickers_list.txt"
OUTPUT_FILE = PROJECT_ROOT / "data" / "image_urls.json"
MISSING_FILE = PROJECT_ROOT / "data" / "missing_image_urls.jsonl"

USER_AGENT = "PaniniWC26Scraper/1.0 (personal project; sebastianschreck0807@gmail.com)"
WP_API = "https://en.wikipedia.org/w/api.php"
THUMB_SIZE = 400
RATE_S = 1.2

CORRECTIONS = {"SWI9": "SUI9", "SWI20": "SUI20", "KAS12": "KSA12"}

# Federation/association search queries per team code (federation > association > team)
FEDERATION_QUERIES: dict[str, list[str]] = {
    "ALG": ["Football Federation of Algeria", "Algeria national football team"],
    "ARG": ["Argentine Football Association", "Argentina national football team"],
    "AUS": ["Football Australia", "Australia national football team"],
    "AUT": ["Austrian Football Association", "Österreichischer Fußball-Bund", "Austria national football team"],
    "BEL": ["Royal Belgian Football Association", "Belgium national football team"],
    "BIH": ["Football Federation of Bosnia and Herzegovina", "Bosnia and Herzegovina national football team"],
    "BRA": ["Brazilian Football Confederation", "Confederação Brasileira de Futebol", "Brazil national football team"],
    "CAN": ["Canada Soccer", "Canada national soccer team"],
    "CIV": ["Fédération Ivoirienne de Football", "Ivory Coast national football team"],
    "COD": ["Fédération Congolaise de Football Association", "DR Congo national football team"],
    "COL": ["Colombian Football Federation", "Colombia national football team"],
    "CPV": ["Federação Caboverdiana de Futebol", "Cape Verde national football team"],
    "CRO": ["Croatian Football Federation", "Croatia national football team"],
    "CUW": ["Curaçao Football Federation", "Curaçao national football team"],
    "CZE": ["Football Association of the Czech Republic", "Czech Republic national football team"],
    "ECU": ["Ecuador Football Federation", "Ecuador national football team"],
    "EGY": ["Egyptian Football Association", "Egypt national football team"],
    "ENG": ["The Football Association", "England national football team"],
    "ESP": ["Royal Spanish Football Federation", "Real Federación Española de Fútbol", "Spain national football team"],
    "FRA": ["French Football Federation", "Fédération Française de Football", "France national football team"],
    "GER": ["German Football Association", "Deutscher Fußball-Bund", "Germany national football team"],
    "GHA": ["Ghana Football Association", "Ghana national football team"],
    "HAI": ["Haitian Football Federation", "Haiti national football team"],
    "IRN": ["Football Federation of the Islamic Republic of Iran", "Iran national football team"],
    "IRQ": ["Iraq Football Association", "Iraq national football team"],
    "JOR": ["Jordan Football Association", "Jordan national football team"],
    "JPN": ["Japan Football Association", "Japan national football team"],
    "KOR": ["Korea Football Association", "South Korea national football team"],
    "KSA": ["Saudi Arabia Football Federation", "Saudi Arabia national football team"],
    "MAR": ["Royal Moroccan Football Federation", "Morocco national football team"],
    "MEX": ["Mexican Football Federation", "Federación Mexicana de Fútbol", "Mexico national football team"],
    "NED": ["Royal Dutch Football Association", "Koninklijke Nederlandse Voetbalbond", "Netherlands national football team"],
    "NOR": ["Football Association of Norway", "Norway national football team"],
    "NZL": ["New Zealand Football", "New Zealand national football team"],
    "PAN": ["Federación Panameña de Fútbol", "Panama national football team"],
    "PAR": ["Asociación Paraguaya de Fútbol", "Paraguay national football team"],
    "POR": ["Portuguese Football Federation", "Federação Portuguesa de Futebol", "Portugal national football team"],
    "QAT": ["Qatar Football Association", "Qatar national football team"],
    "RSA": ["South African Football Association", "South Africa national football team"],
    "SCO": ["Scottish Football Association", "Scotland national football team"],
    "SEN": ["Senegal Football Federation", "Fédération Sénégalaise de Football", "Senegal national football team"],
    "SUI": ["Swiss Football Association", "Switzerland national football team"],
    "SWE": ["Swedish Football Association", "Sweden national football team"],
    "TUN": ["Tunisian Football Federation", "Tunisia national football team"],
    "TUR": ["Turkish Football Federation", "Türkiye Futbol Federasyonu", "Turkey national football team"],
    "URU": ["Uruguayan Football Association", "Uruguay national football team"],
    "USA": ["United States Soccer Federation", "United States national soccer team"],
    "UZB": ["Football Association of Uzbekistan", "Uzbekistan national football team"],
}

http = requests.Session()
http.headers["User-Agent"] = USER_AGENT


def wp_search_image(query: str) -> str | None:
    try:
        search = http.get(WP_API, params={
            "action": "query", "list": "search",
            "srsearch": query, "srlimit": 1, "format": "json",
        }, timeout=12).json()
        hits = search.get("query", {}).get("search", [])
        if not hits:
            return None
        title = hits[0]["title"]
        img = http.get(WP_API, params={
            "action": "query", "titles": title,
            "prop": "pageimages", "pithumbsize": THUMB_SIZE, "format": "json",
        }, timeout=12).json()
        for page in img.get("query", {}).get("pages", {}).values():
            src = page.get("thumbnail", {}).get("source")
            if src:
                return src
        return None
    except Exception as exc:
        print(f"    [error] {exc}")
        return None


def find_url(queries: list[str]) -> str | None:
    for q in queries:
        url = wp_search_image(q)
        time.sleep(RATE_S)
        if url:
            return url
    return None


def parse_stickers() -> list[dict]:
    stickers = []
    text = STICKERS_FILE.read_text(encoding="utf-8")
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        m = re.match(r"^([A-Z0-9]+)\s+(.+)$", line)
        if not m:
            continue
        raw_id = CORRECTIONS.get(m.group(1), m.group(1))
        desc = m.group(2)
        id_m = re.match(r"^([A-Z]+)(\d+)$", raw_id)
        if not id_m:
            continue  # skip "00"
        code, pos = id_m.group(1), int(id_m.group(2))
        if code == "FWC":
            continue
        is_team_logo = pos == 1
        is_team_photo = "Team Photo" in desc
        is_foil = "FOIL" in desc
        # Extract player name
        clean = desc.replace(" FOIL", "").strip()
        dash = clean.rfind(" - ")
        name = clean[:dash].strip() if dash >= 0 else clean
        country = clean[dash + 3:].strip() if dash >= 0 else ""
        stickers.append({
            "id": raw_id, "code": code, "pos": pos,
            "name": name, "country": country,
            "is_team_logo": is_team_logo,
            "is_team_photo": is_team_photo,
            "is_foil": is_foil,
        })
    return stickers


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--code", help="Only process this team code")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    stickers = parse_stickers()
    if args.code:
        stickers = [s for s in stickers if s["code"] == args.code.upper()]

    # Load existing results to allow resuming
    existing: dict[str, str] = {}
    if OUTPUT_FILE.exists():
        existing = json.loads(OUTPUT_FILE.read_text(encoding="utf-8"))

    print(f"Processing {len(stickers)} stickers (already have {len(existing)} URLs)…")

    results = dict(existing)
    missing = []
    fetched = 0
    skipped = 0

    for s in stickers:
        sid = s["id"]

        if sid in results:
            skipped += 1
            continue

        if s["is_team_photo"]:
            # Group photos are hard to find reliably — skip
            skipped += 1
            continue

        if s["is_team_logo"]:
            queries = FEDERATION_QUERIES.get(
                s["code"],
                [f"{s['code']} football federation", f"{s['code']} national football team"],
            )
            label = f"{sid} (team logo)"
        else:
            queries = [
                f"{s['name']} footballer",
                f"{s['name']} soccer player",
                f"{s['name']} {s['country']}",
            ]
            label = f"{sid} {s['name']}"

        print(f"  {label} …", end="", flush=True)

        if args.dry_run:
            print(f" [would search: {queries[0]}]")
            continue

        url = find_url(queries)
        if url:
            print(f" ✓")
            results[sid] = url
            fetched += 1
            # Save after each fetch so progress isn't lost on interrupt
            OUTPUT_FILE.write_text(json.dumps(results, indent=2), encoding="utf-8")
        else:
            print(f" [miss]")
            missing.append(sid)

    if missing:
        with open(MISSING_FILE, "a", encoding="utf-8") as f:
            for sid in missing:
                f.write(json.dumps({"id": sid}) + "\n")

    if not args.dry_run:
        OUTPUT_FILE.write_text(json.dumps(results, indent=2), encoding="utf-8")

    print(f"\nDone. Fetched: {fetched}, Skipped: {skipped}, Missing: {len(missing)}")
    print(f"Total URLs in {OUTPUT_FILE.name}: {len(results)}")
    print(f"\nNext step: pnpm tsx scripts/import_image_urls.ts")


if __name__ == "__main__":
    main()
