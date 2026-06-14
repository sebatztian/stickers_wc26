"use client";

import { useState, useMemo, useTransition } from "react";
import { TeamFilter } from "./TeamFilter";
import { StickerThumbnail } from "./StickerThumbnail";
import { StickerDetailModal } from "./StickerDetailModal";
import { QuickAddByCode } from "./QuickAddByCode";
import { setOwned } from "@/lib/actions/collection";
import type { Sticker, UserSticker } from "@/generated/prisma/client";

interface Props {
  stickers: Sticker[];
  initialUserStickers: Record<string, Pick<UserSticker, "ownedQty">>;
}

type FilterMode = "all" | "owned" | "missing" | "duplicates";
type ViewMode = "card" | "quick";
type SortMode = "album" | "alpha";

function QuickRow({
  sticker,
  ownedQty,
  onUpdate,
}: {
  sticker: Sticker;
  ownedQty: number;
  onUpdate: (id: string, qty: number) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function adjust(delta: number) {
    const next = Math.max(0, ownedQty + delta);
    onUpdate(sticker.id, next);
    startTransition(async () => {
      await setOwned(sticker.id, next);
    });
  }

  return (
    <div
      className={`flex items-center gap-2 px-2 py-1 rounded text-sm transition-colors ${
        ownedQty > 0 ? "bg-emerald-900/20" : "bg-panini-blue/5"
      }`}
    >
      <span
        className={`font-mono font-bold w-14 shrink-0 text-xs ${
          ownedQty > 0 ? "text-emerald-400" : "text-panini-gray"
        }`}
      >
        {sticker.id}
      </span>
      <span className="flex-1 text-panini-white/70 text-xs truncate">{sticker.name}</span>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => adjust(-1)}
          disabled={ownedQty === 0 || isPending}
          className="w-6 h-6 rounded bg-panini-blue/40 hover:bg-panini-blue/70 text-panini-white font-bold text-sm disabled:opacity-30 transition-colors leading-none"
        >
          −
        </button>
        <span className="w-5 text-center text-panini-white font-bold tabular-nums text-xs">
          {ownedQty}
        </span>
        <button
          onClick={() => adjust(1)}
          disabled={isPending}
          className="w-6 h-6 rounded bg-panini-blue/40 hover:bg-panini-blue/70 text-panini-white font-bold text-sm disabled:opacity-30 transition-colors leading-none"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function StickerGrid({ stickers, initialUserStickers }: Props) {
  const [userStickers, setUserStickers] = useState(initialUserStickers);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [sortMode, setSortMode] = useState<SortMode>("album");
  const [selectedSticker, setSelectedSticker] = useState<Sticker | null>(null);

  const filtered = useMemo(() => {
    const result = stickers.filter((s) => {
      if (selectedCode !== null && s.code !== selectedCode) return false;
      const qty = userStickers[s.id]?.ownedQty ?? 0;
      if (filterMode === "owned") return qty > 0;
      if (filterMode === "missing") return qty === 0;
      if (filterMode === "duplicates") return qty > 1;
      return true;
    });

    if (sortMode === "alpha") {
      // Group teams alphabetically by abbreviation (e.g. ESP); keep album order within a team
      result.sort((a, b) => a.code.localeCompare(b.code) || a.albumNumber - b.albumNumber);
    }

    return result;
  }, [stickers, selectedCode, filterMode, sortMode, userStickers]);

  function handleUpdate(id: string, ownedQty: number) {
    setUserStickers((prev) => ({ ...prev, [id]: { ownedQty } }));
  }

  const totalOwned = stickers.filter((s) => (userStickers[s.id]?.ownedQty ?? 0) > 0).length;

  // Group by code for quick view
  const groupedByCode = useMemo(() => {
    if (viewMode !== "quick") return null;
    const map = new Map<string, Sticker[]>();
    for (const s of filtered) {
      const arr = map.get(s.code) ?? [];
      arr.push(s);
      map.set(s.code, arr);
    }
    return map;
  }, [filtered, viewMode]);

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="text-panini-gray text-sm">
          <span className="text-panini-gold font-bold text-lg">{totalOwned}</span>
          <span className="ml-1">/ {stickers.length} collected</span>
        </div>
        <div className="h-2 flex-1 bg-panini-blue/20 rounded-full overflow-hidden min-w-32">
          <div
            className="h-full bg-gradient-to-r from-panini-gold to-panini-gold-lt rounded-full transition-all"
            style={{ width: `${(totalOwned / stickers.length) * 100}%` }}
          />
        </div>
        <span className="text-panini-gray text-sm">
          {Math.round((totalOwned / stickers.length) * 100)}%
        </span>
      </div>

      {/* Quick add by code */}
      <QuickAddByCode onAdded={handleUpdate} />

      {/* Controls row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Filter chips */}
        {(["all", "owned", "missing", "duplicates"] as FilterMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setFilterMode(mode)}
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
              filterMode === mode
                ? "bg-panini-blue-mid text-panini-white"
                : "bg-panini-blue/20 text-panini-gray hover:text-panini-white"
            }`}
          >
            {mode}
          </button>
        ))}

        <span className="text-panini-gray text-xs ml-1">{filtered.length} stickers</span>

        {/* Sort toggle — pushed to the right */}
        <div className="ml-auto flex rounded-lg overflow-hidden border border-panini-blue/40">
          <button
            onClick={() => setSortMode("album")}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              sortMode === "album"
                ? "bg-panini-blue text-panini-white"
                : "bg-panini-navy text-panini-gray hover:text-panini-white"
            }`}
          >
            Album
          </button>
          <button
            onClick={() => setSortMode("alpha")}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              sortMode === "alpha"
                ? "bg-panini-blue text-panini-white"
                : "bg-panini-navy text-panini-gray hover:text-panini-white"
            }`}
          >
            A–Z
          </button>
        </div>

        {/* View mode toggle */}
        <div className="flex rounded-lg overflow-hidden border border-panini-blue/40">
          <button
            onClick={() => setViewMode("card")}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              viewMode === "card"
                ? "bg-panini-blue text-panini-white"
                : "bg-panini-navy text-panini-gray hover:text-panini-white"
            }`}
          >
            Cards
          </button>
          <button
            onClick={() => setViewMode("quick")}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              viewMode === "quick"
                ? "bg-panini-blue text-panini-white"
                : "bg-panini-navy text-panini-gray hover:text-panini-white"
            }`}
          >
            Quick
          </button>
        </div>
      </div>

      {/* Team filter */}
      <TeamFilter selected={selectedCode} onChange={setSelectedCode} sortMode={sortMode} />

      {/* Card view */}
      {viewMode === "card" && (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
          {filtered.map((sticker) => {
            const us = userStickers[sticker.id];
            return (
              <StickerThumbnail
                key={sticker.id}
                id={sticker.id}
                name={sticker.name}
                country={sticker.country}
                code={sticker.code}
                isFoil={sticker.isFoil}
                isTeamLogo={sticker.isTeamLogo}
                isTeamPhoto={sticker.isTeamPhoto}
                isSpecial={sticker.isSpecial}
                ownedQty={us?.ownedQty ?? 0}
                onClick={() => setSelectedSticker(sticker)}
              />
            );
          })}
        </div>
      )}

      {/* Quick view */}
      {viewMode === "quick" && groupedByCode && (
        <div className="space-y-4">
          {[...groupedByCode.entries()].map(([code, stickersInGroup]) => (
            <div key={code}>
              <h3 className="text-panini-gold font-display font-bold text-sm uppercase tracking-wide mb-1 px-1">
                {code}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0.5">
                {stickersInGroup.map((sticker) => (
                  <QuickRow
                    key={sticker.id}
                    sticker={sticker}
                    ownedQty={userStickers[sticker.id]?.ownedQty ?? 0}
                    onUpdate={handleUpdate}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-panini-gray">No stickers match this filter.</div>
      )}

      {/* Detail modal — card view only */}
      {selectedSticker && viewMode === "card" && (
        <StickerDetailModal
          sticker={selectedSticker}
          ownedQty={userStickers[selectedSticker.id]?.ownedQty ?? 0}
          onClose={() => setSelectedSticker(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
