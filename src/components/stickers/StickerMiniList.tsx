"use client";

import { useMemo } from "react";
import Image from "next/image";
import { compareStickers, type StickerSortMode } from "@/lib/utils";
import type { Sticker } from "@/generated/prisma/client";

export type StickerListView = "cards" | "list";

export interface StickerListItem {
  sticker: Sticker;
  qty: number;
}

interface Props {
  items: StickerListItem[];
  view: StickerListView;
  sortMode: StickerSortMode;
  emptyText?: string;
  className?: string;
}

/**
 * Read-only list of stickers with a quantity badge. Supports a compact "list"
 * view and a "cards" grid view, and sorts by album or alpha order. Shared by
 * the compare screen and the trade detail screen.
 */
export function StickerMiniList({
  items,
  view,
  sortMode,
  emptyText = "None",
  className = "",
}: Props) {
  const sorted = useMemo(
    () => [...items].sort((a, b) => compareStickers(a.sticker, b.sticker, sortMode)),
    [items, sortMode]
  );

  if (sorted.length === 0) {
    return <p className="text-panini-gray text-sm py-4 text-center">{emptyText}</p>;
  }

  if (view === "cards") {
    return (
      <div className={`grid grid-cols-4 sm:grid-cols-5 gap-2 ${className}`}>
        {sorted.map(({ sticker, qty }) => (
          <div key={sticker.id} className="relative">
            <div className="aspect-[3/4] relative bg-panini-navy rounded overflow-hidden">
              <Image
                src={`/api/stickers/${sticker.id}/image`}
                alt={sticker.name}
                fill
                className="object-cover"
                sizes="80px"
                unoptimized
              />
            </div>
            <div className="mt-0.5 text-center">
              <p className="text-[9px] text-panini-gray truncate">{sticker.id}</p>
              <p className="text-[9px] text-panini-white/70 truncate leading-tight">
                {sticker.name}
              </p>
            </div>
            <div className="absolute top-0.5 right-0.5 bg-panini-gold text-panini-navy text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              ×{qty}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {sorted.map(({ sticker, qty }) => (
        <div key={sticker.id} className="flex items-center gap-3">
          <div className="relative w-10 h-14 shrink-0 rounded overflow-hidden bg-panini-navy">
            <Image
              src={`/api/stickers/${sticker.id}/image`}
              alt={sticker.name}
              fill
              className="object-cover"
              sizes="40px"
              unoptimized
            />
          </div>
          <div className="min-w-0">
            <p className="text-panini-white text-sm truncate">{sticker.name}</p>
            <p className="text-panini-gray text-xs">
              {sticker.id} · ×{qty}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
