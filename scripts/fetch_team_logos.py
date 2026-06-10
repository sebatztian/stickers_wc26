#!/usr/bin/env python3
"""
Fetch national football federation logos from Wikipedia.
Stores as data/pictures/{CODE}/{CODE}1.jpg (position 1 = team logo sticker).

Tries queries in order: federation > association > national team.

Usage:
  scripts/.venv/bin/python scripts/fetch_team_logos.py
  scripts/.venv/bin/python scripts/fetch_team_logos.py --code MEX
  scripts/.venv/bin/python scripts/fetch_team_logos.py --dry-run
"""

import argparse
import os
import re
import time
import json
import requests

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
STICKERS_LIST = os.path.join(PROJECT_DIR, "data", "stickers_list.txt")
PICTURES_DIR = os.path.join(PROJECT_DIR, "data", "pictures")
MISSING_LOG = os.path.join(PROJECT_DIR, "data", "missing_logos.jsonl")

USER_AGENT = "PaniniWC26LogoScraper/1.0 (personal project; sebastianschreck0807@gmail.com)"
WIKI_API = "https://en.wikipedia.org/w/api.php"

# Each entry is a list of search queries tried in order until an image is found.
# Order: federation article > association article > national team article.
QUERIES: dict[str, list[str]] = {
    "ALG": [
        "Football Federation of Algeria",
        "Fédération Algérienne de Football",
        "Algeria national football team",
    ],
    "ARG": [
        "Argentine Football Association",
        "Asociación del Fútbol Argentino",
        "Argentina national football team",
    ],
    "AUS": [
        "Football Australia",
        "Football Federation Australia",
        "Australia national football team",
    ],
    "AUT": [
        "Austrian Football Association",
        "Österreichischer Fußball-Bund",
        "Austria national football team",
    ],
    "BEL": [
        "Royal Belgian Football Association",
        "Union Royale Belge des Sociétés de Football Association",
        "Belgium national football team",
    ],
    "BIH": [
        "Football Federation of Bosnia and Herzegovina",
        "Nogometni/Fudbalski savez Bosne i Hercegovine",
        "Bosnia and Herzegovina national football team",
    ],
    "BRA": [
        "Brazilian Football Confederation",
        "Confederação Brasileira de Futebol",
        "Brazil national football team",
    ],
    "CAN": [
        "Canada Soccer",
        "Canadian Soccer Association",
        "Canada national soccer team",
    ],
    "CIV": [
        "Fédération Ivoirienne de Football",
        "Ivory Coast Football Federation",
        "Ivory Coast national football team",
    ],
    "COD": [
        "Fédération Congolaise de Football Association",
        "DR Congo Football Federation",
        "DR Congo national football team",
    ],
    "COL": [
        "Colombian Football Federation",
        "Federación Colombiana de Fútbol",
        "Colombia national football team",
    ],
    "CPV": [
        "Federação Caboverdiana de Futebol",
        "Cape Verde Football Federation",
        "Cape Verde national football team",
    ],
    "CRO": [
        "Croatian Football Federation",
        "Hrvatski nogometni savez",
        "Croatia national football team",
    ],
    "CUW": [
        "Curaçao Football Federation",
        "Federashon Futbol Kòrsou",
        "Curaçao national football team",
    ],
    "CZE": [
        "Football Association of the Czech Republic",
        "Fotbalová asociace České republiky",
        "Czech Republic national football team",
    ],
    "ECU": [
        "Ecuador Football Federation",
        "Federación Ecuatoriana de Fútbol",
        "Ecuador national football team",
    ],
    "EGY": [
        "Egyptian Football Association",
        "Egypt national football team",
    ],
    "ENG": [
        "The Football Association",
        "Football Association England",
        "England national football team",
    ],
    "ESP": [
        "Royal Spanish Football Federation",
        "Real Federación Española de Fútbol",
        "Spain national football team",
    ],
    "FRA": [
        "French Football Federation",
        "Fédération Française de Football",
        "France national football team",
    ],
    "GER": [
        "German Football Association",
        "Deutscher Fußball-Bund",
        "Germany national football team",
    ],
    "GHA": [
        "Ghana Football Association",
        "Ghana national football team",
    ],
    "HAI": [
        "Haitian Football Federation",
        "Fédération Haïtienne de Football",
        "Haiti national football team",
    ],
    "IRN": [
        "Football Federation of the Islamic Republic of Iran",
        "Iran Football Federation",
        "Iran national football team",
    ],
    "IRQ": [
        "Iraq Football Association",
        "Iraq national football team",
    ],
    "JOR": [
        "Jordan Football Association",
        "Jordan national football team",
    ],
    "JPN": [
        "Japan Football Association",
        "Japan national football team",
    ],
    "KOR": [
        "Korea Football Association",
        "Korean Football Association",
        "South Korea national football team",
    ],
    "KSA": [
        "Saudi Arabia Football Federation",
        "Saudi Arabian Football Federation",
        "Saudi Arabia national football team",
    ],
    "MAR": [
        "Royal Moroccan Football Federation",
        "Fédération Royale Marocaine de Football",
        "Morocco national football team",
    ],
    "MEX": [
        "Mexican Football Federation",
        "Federación Mexicana de Fútbol",
        "Mexico national football team",
    ],
    "NED": [
        "Royal Dutch Football Association",
        "Koninklijke Nederlandse Voetbalbond",
        "Netherlands national football team",
    ],
    "NOR": [
        "Football Association of Norway",
        "Norges Fotballforbund",
        "Norway national football team",
    ],
    "NZL": [
        "New Zealand Football",
        "New Zealand national football team",
    ],
    "PAN": [
        "Federación Panameña de Fútbol",
        "Panama Football Federation",
        "Panama national football team",
    ],
    "PAR": [
        "Asociación Paraguaya de Fútbol",
        "Paraguayan Football Association",
        "Paraguay national football team",
    ],
    "POR": [
        "Portuguese Football Federation",
        "Federação Portuguesa de Futebol",
        "Portugal national football team",
    ],
    "QAT": [
        "Qatar Football Association",
        "Qatar national football team",
    ],
    "RSA": [
        "South African Football Association",
        "SAFA South Africa football",
        "South Africa national football team",
    ],
    "SCO": [
        "Scottish Football Association",
        "Scotland national football team",
    ],
    "SEN": [
        "Senegal Football Federation",
        "Fédération Sénégalaise de Football",
        "Senegal national football team",
    ],
    "SUI": [
        "Swiss Football Association",
        "Schweizerischer Fussballverband",
        "Switzerland national football team",
    ],
    "SWE": [
        "Swedish Football Association",
        "Sveriges Fotbollförbund",
        "Sweden national football team",
    ],
    "TUN": [
        "Tunisian Football Federation",
        "Fédération Tunisienne de Football",
        "Tunisia national football team",
    ],
    "TUR": [
        "Turkish Football Federation",
        "Türkiye Futbol Federasyonu",
        "Turkey national football team",
    ],
    "URU": [
        "Uruguayan Football Association",
        "Asociación Uruguaya de Fútbol",
        "Uruguay national football team",
    ],
    "USA": [
        "United States Soccer Federation",
        "US Soccer Federation",
        "United States national soccer team",
    ],
    "UZB": [
        "Football Association of Uzbekistan",
        "Uzbekistan Football Association",
        "Uzbekistan national football team",
    ],
}

http = requests.Session()
http.headers.update({"User-Agent": USER_AGENT})


def search_image_url(query: str) -> str | None:
    """Try one Wikipedia search query; return thumbnail URL or None."""
    try:
        search = http.get(
            WIKI_API,
            params={"action": "query", "list": "search", "srsearch": query, "srlimit": 1, "format": "json"},
            timeout=15,
        ).json()
        results = search.get("query", {}).get("search", [])
        if not results:
            return None
        title = results[0]["title"]

        img = http.get(
            WIKI_API,
            params={"action": "query", "titles": title, "prop": "pageimages", "pithumbsize": 400, "format": "json"},
            timeout=15,
        ).json()
        for page in img.get("query", {}).get("pages", {}).values():
            src = page.get("thumbnail", {}).get("source")
            if src:
                return src
        return None
    except Exception as exc:
        print(f"  [error] {exc}")
        return None


def find_logo_url(queries: list[str]) -> tuple[str, str] | tuple[None, None]:
    """Try queries in order; return (url, winning_query) or (None, None)."""
    for q in queries:
        url = search_image_url(q)
        time.sleep(0.8)
        if url:
            return url, q
    return None, None


def download_image(url: str, dest: str) -> bool:
    try:
        resp = http.get(url, timeout=30)
        resp.raise_for_status()
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, "wb") as f:
            f.write(resp.content)
        return True
    except Exception as exc:
        print(f"  [error] download: {exc}")
        return False


def get_team_codes_from_stickers() -> set[str]:
    codes: set[str] = set()
    pattern = re.compile(r"^([A-Z]+)(\d+)$")
    with open(STICKERS_LIST, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            parts = line.split(None, 1)
            if not parts:
                continue
            m = pattern.match(parts[0].upper())
            if m:
                code, pos = m.group(1), int(m.group(2))
                if pos == 1 and code != "FWC":
                    codes.add(code)
    return codes


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch national football federation logos.")
    parser.add_argument("--code", help="Fetch only this team code (e.g. MEX)")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be searched without downloading")
    args = parser.parse_args()

    codes_in_album = get_team_codes_from_stickers()
    target_codes = [args.code.upper()] if args.code else sorted(codes_in_album)

    print(f"Fetching logos for {len(target_codes)} teams{'  [DRY RUN]' if args.dry_run else ''}...")

    missing = []
    fetched = 0
    skipped = 0

    for code in target_codes:
        dest = os.path.join(PICTURES_DIR, code, f"{code}1.jpg")

        if os.path.exists(dest):
            print(f"  {code}: already exists, skipping")
            skipped += 1
            continue

        queries = QUERIES.get(code, [f"{code} football federation", f"{code} football association", f"{code} national football team"])

        if args.dry_run:
            print(f"  {code}: would try {len(queries)} queries:")
            for q in queries:
                print(f"    - {q}")
            continue

        print(f"  {code}: trying {len(queries)} queries...")
        url, winning_query = find_logo_url(queries)

        if not url:
            print(f"    [miss] no image found after all queries")
            missing.append({"code": code, "queries": queries})
            continue

        print(f"    matched: '{winning_query}'")
        print(f"    url: {url[:80]}...")
        if download_image(url, dest):
            print(f"    -> saved {dest}")
            fetched += 1
        else:
            missing.append({"code": code, "queries": queries, "url": url})

    if missing:
        with open(MISSING_LOG, "a", encoding="utf-8") as f:
            for entry in missing:
                f.write(json.dumps(entry) + "\n")
        print(f"\n{len(missing)} misses logged to {MISSING_LOG}")

    print(f"\nDone. Fetched: {fetched}, Skipped: {skipped}, Missing: {len(missing)}")


if __name__ == "__main__":
    main()
