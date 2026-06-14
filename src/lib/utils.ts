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
