"use client";

import { useState } from "react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { StickerMiniList, type StickerListView } from "@/components/stickers/StickerMiniList";
import type { StickerSortMode } from "@/lib/utils";
import type { Sticker } from "@/generated/prisma/client";

interface TradeStickerSide {
  title: string;
  items: { sticker: Sticker; quantity: number }[];
}

interface Props {
  offered: TradeStickerSide;
  requested: TradeStickerSide;
}

/**
 * Offered/requested sticker lists on the trade detail screen, with shared
 * sort (album / A–Z) and view (cards / list) controls.
 */
export function TradeStickerLists({ offered, requested }: Props) {
  const [sortMode, setSortMode] = useState<StickerSortMode>("album");
  const [view, setView] = useState<StickerListView>("list");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap justify-end">
        <SegmentedControl
          options={[
            { value: "album", label: "Album" },
            { value: "alpha", label: "A–Z" },
          ]}
          value={sortMode}
          onChange={setSortMode}
        />
        <SegmentedControl
          options={[
            { value: "list", label: "List" },
            { value: "cards", label: "Cards" },
          ]}
          value={view}
          onChange={setView}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {[offered, requested].map((side) => (
          <div
            key={side.title}
            className="bg-panini-blue/10 border border-panini-blue/30 rounded-xl p-4 space-y-3"
          >
            <h3 className="font-display font-bold text-panini-white text-lg">{side.title}</h3>
            <StickerMiniList
              items={side.items.map(({ sticker, quantity }) => ({ sticker, qty: quantity }))}
              view={view}
              sortMode={sortMode}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
