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
 * Parse free-form text into a list of unique sticker IDs. Handles two formats:
 *
 * 1. Prefixed lists — team code followed by ":" or "-" then a separator-delimited
 *    list of numbers, e.g.:  MEX: 1,2,6(x2)   GER: 3; 15 x2 / 17
 *    Separators: comma, semicolon, slash, or whitespace.
 *    Quantity annotations (x2, 2x, (x2), (2x)) are stripped.
 *
 * 2. Adjacent codes — classic "CODE number" pairs scattered in text,
 *    e.g.: MEX1  GER 5  FWC 2
 *
 * IDs are normalised to uppercase with no spaces (e.g. "MEX18").
 */
export function parseStickerIds(text: string): string[] {
  const upper = text.toUpperCase();
  const seen = new Set<string>();

  // Strategy 1: "CODE:" or "CODE-" prefix with a list of numbers
  // Find every "LETTERS:" segment boundary
  const prefixRe = /\b([A-Z]{2,4})\s*[:\-]/g;
  let m: RegExpExecArray | null;
  const segments: { code: string; start: number }[] = [];
  while ((m = prefixRe.exec(upper)) !== null) {
    segments.push({ code: m[1], start: m.index + m[0].length });
  }

  for (let i = 0; i < segments.length; i++) {
    const { code, start } = segments[i];
    // The segment runs until the next prefix marker (or end of string)
    const end = i + 1 < segments.length
      ? segments[i + 1].start - segments[i + 1].code.length - 1
      : upper.length;
    let segment = upper.slice(start, end);

    // Strip quantity annotations, keeping the sticker number itself.
    // Compact "NxM" (no spaces) is treated as sticker N, qty M (sticker-first).
    // Step 1 — trailing annotation (after a digit): "7x2" "15(x2)" "6 (x2)" "1(2x)"
    segment = segment.replace(/(?<=\d)\s*\(?\s*(?:[Xx×]\d+|\d+[Xx×])\s*\)?/g, " ");
    // Step 2 — leading annotation (before a digit, not adjacent to one): "(x2)5" "x2 5" "(2x) 5"
    segment = segment.replace(/(?<!\d)\(?\s*(?:[Xx×]\d+|\d+[Xx×])\s*\)?\s*(?=\d)/g, " ");

    // Collect numbers
    const nums = segment.match(/\d+/g) ?? [];
    for (const n of nums) seen.add(`${code}${n}`);
  }

  // Strategy 2: adjacent "CODE number" pairs (no colon) e.g. "MEX1" or "GER 5"
  const adjRe = /\b([A-Z]{2,4})\s+(\d+)/g;
  while ((m = adjRe.exec(upper)) !== null) {
    seen.add(`${m[1]}${m[2]}`);
  }
  // Also pure-adjacent with no space: MEX18
  const compactRe = /\b([A-Z]{2,4})(\d+)\b/g;
  while ((m = compactRe.exec(upper)) !== null) {
    seen.add(`${m[1]}${m[2]}`);
  }

  return [...seen];
}
