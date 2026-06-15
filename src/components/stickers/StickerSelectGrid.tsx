"use client";

import Image from "next/image";
import type { Sticker } from "@/generated/prisma/client";

export interface SelectableSticker {
  sticker: Sticker;
  ownedQty: number;
}

interface Props {
  items: SelectableSticker[];
  selectedIds: Set<string>;
  onToggle: (sticker: Sticker) => void;
  ringClass: string;
  loading?: boolean;
  emptyText: string;
}

/**
 * Grid of sticker thumbnails that can be toggled on/off. Shared by the trade
 * creation wizard and the imported-collection comparison.
 */
export function StickerSelectGrid({
  items,
  selectedIds,
  onToggle,
  ringClass,
  loading = false,
  emptyText,
}: Props) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-64 overflow-y-auto bg-panini-navy/50 rounded-xl p-3">
      {loading && <p className="col-span-full text-panini-gray text-xs text-center py-4">Loading…</p>}
      {!loading && items.length === 0 && (
        <p className="col-span-full text-panini-gray text-xs text-center py-4">{emptyText}</p>
      )}
      {!loading &&
        items.map(({ sticker, ownedQty }) => {
          const isSelected = selectedIds.has(sticker.id);
          return (
            <button
              key={sticker.id}
              onClick={() => onToggle(sticker)}
              className={`relative aspect-[3/4] rounded overflow-hidden transition-all ${
                isSelected ? `ring-2 ${ringClass}` : "ring-1 ring-panini-blue/30 opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={`/api/stickers/${sticker.id}/image`} alt={sticker.name} fill className="object-cover" sizes="80px" unoptimized />
              <div className="absolute bottom-0 left-0 right-0 bg-panini-navy/80 py-0.5">
                <p className="text-[8px] text-center text-panini-white truncate px-1">{sticker.id}</p>
              </div>
              {ownedQty > 1 && (
                <div className="absolute top-0.5 right-0.5 bg-panini-gold text-panini-navy text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  ×{ownedQty}
                </div>
              )}
            </button>
          );
        })}
    </div>
  );
}
