import type { Sticker } from "@/generated/prisma/client";

export type StickerSortMode = "album" | "alpha";

/**
 * Shared comparator for sticker lists.
 * - "album": natural Panini album order (albumNumber ascending)
 * - "alpha": grouped by team code A–Z, then album order within a team
 */
export function compareStickers(a: Sticker, b: Sticker, mode: StickerSortMode): number {
  if (mode === "alpha") {
    return a.code.localeCompare(b.code) || a.albumNumber - b.albumNumber;
  }
  return a.albumNumber - b.albumNumber;
}

/**
 * Parse free-form text into a list of unique sticker IDs. Accepts any mix of
 * commas, whitespace and newlines as separators and tolerates an optional space
 * inside a code (e.g. "MEX 18" → "MEX18"). IDs are normalized to uppercase.
 */
export function parseStickerIds(text: string): string[] {
  const matches = text.match(/[A-Za-z]{2,}\s*\d+/g) ?? [];
  const seen = new Set<string>();
  for (const m of matches) {
    seen.add(m.replace(/\s+/g, "").toUpperCase());
  }
  return [...seen];
}
