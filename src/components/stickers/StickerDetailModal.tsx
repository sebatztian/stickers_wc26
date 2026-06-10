"use client";

import { useTransition } from "react";
import Image from "next/image";
import { COUNTRY_FLAGS } from "@/lib/constants";
import { setOwned } from "@/lib/actions/collection";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

interface StickerData {
  id: string;
  name: string;
  country: string;
  code: string;
  position: number;
  isFoil: boolean;
  isTeamLogo: boolean;
  isTeamPhoto: boolean;
  isSpecial: boolean;
}

interface Props {
  sticker: StickerData;
  ownedQty: number;
  onClose: () => void;
  onUpdate: (id: string, ownedQty: number) => void;
}

export function StickerDetailModal({ sticker, ownedQty, onClose, onUpdate }: Props) {
  const [isPending, startTransition] = useTransition();
  const flag = COUNTRY_FLAGS[sticker.code] ?? "🏆";

  function adjustQty(delta: number) {
    const newQty = Math.max(0, ownedQty + delta);
    onUpdate(sticker.id, newQty);
    startTransition(async () => {
      await setOwned(sticker.id, newQty);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-panini-navy/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-panini-blue/20 border border-panini-blue/40 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 text-panini-gray hover:text-panini-white transition-colors text-lg leading-none"
        >
          ✕
        </button>

        <div className="relative h-56 bg-gradient-to-b from-panini-blue/60 to-panini-navy overflow-hidden">
          <Image
            src={`/api/stickers/${sticker.id}/image`}
            alt={sticker.name}
            fill
            className="object-contain"
            sizes="400px"
            unoptimized
          />
          {sticker.isFoil && (
            <div className="absolute inset-0 foil-shimmer opacity-15 mix-blend-overlay pointer-events-none" />
          )}
        </div>

        <div className="bg-panini-gold px-4 py-2 flex items-center gap-2">
          <span className="text-xl">{flag}</span>
          <div>
            <p className="font-display font-bold text-panini-navy text-lg leading-none uppercase tracking-wide">
              {sticker.isSpecial ? "FIFA WC 2026" : sticker.country}
            </p>
            <p className="text-panini-navy/70 text-xs">{sticker.id}</p>
          </div>
          {sticker.isFoil && (
            <span className="ml-auto text-panini-navy/70 text-xs font-bold">✦ FOIL</span>
          )}
        </div>

        <div className="p-4 space-y-4">
          <p className="text-panini-white font-medium">{sticker.name}</p>

          <div className="flex items-center gap-3">
            <span className="text-panini-gray text-sm w-16">Owned</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => adjustQty(-1)}
                disabled={ownedQty === 0 || isPending}
                className="w-8 h-8 rounded-full bg-panini-blue/40 hover:bg-panini-blue/70 text-panini-white font-bold disabled:opacity-40 transition-colors"
              >
                −
              </button>
              <span className="w-8 text-center text-panini-white font-bold tabular-nums">
                {ownedQty}
              </span>
              <button
                onClick={() => adjustQty(1)}
                disabled={isPending}
                className="w-8 h-8 rounded-full bg-panini-blue/40 hover:bg-panini-blue/70 text-panini-white font-bold disabled:opacity-40 transition-colors"
              >
                +
              </button>
            </div>
            {isPending && <Spinner className="text-panini-gold w-4 h-4" />}
          </div>

          <Button variant="ghost" size="sm" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
