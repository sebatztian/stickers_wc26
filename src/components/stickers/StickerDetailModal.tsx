"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { COUNTRY_FLAGS } from "@/lib/constants";
import { setOwned } from "@/lib/actions/collection";
import { updateStickerImage } from "@/lib/actions/stickers";
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
  imagePath: string | null;
}

interface Props {
  sticker: StickerData;
  ownedQty: number;
  onClose: () => void;
  onUpdate: (id: string, ownedQty: number) => void;
}

export function StickerDetailModal({ sticker, ownedQty, onClose, onUpdate }: Props) {
  const [isPending, startTransition] = useTransition();
  const [isSavingImage, startImageTransition] = useTransition();
  const [editingImage, setEditingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState(sticker.imagePath ?? "");
  const [cacheBust, setCacheBust] = useState(0);
  const [imageError, setImageError] = useState("");
  const flag = COUNTRY_FLAGS[sticker.code] ?? "🏆";

  function adjustQty(delta: number) {
    const newQty = Math.max(0, ownedQty + delta);
    onUpdate(sticker.id, newQty);
    startTransition(async () => {
      await setOwned(sticker.id, newQty);
    });
  }

  function saveImage() {
    setImageError("");
    startImageTransition(async () => {
      const result = await updateStickerImage(sticker.id, imageUrl.trim());
      if (result.success) {
        sticker.imagePath = result.data.imagePath;
        setCacheBust((n) => n + 1);
        setEditingImage(false);
      } else {
        setImageError(result.error);
      }
    });
  }

  const imageSrc = `/api/stickers/${sticker.id}/image${cacheBust ? `?v=${cacheBust}` : ""}`;

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

        <button
          type="button"
          onClick={() => setEditingImage((v) => !v)}
          title="Click to edit image URL"
          className="relative h-56 w-full bg-gradient-to-b from-panini-blue/60 to-panini-navy overflow-hidden block cursor-pointer group/img"
        >
          <Image
            src={imageSrc}
            alt={sticker.name}
            fill
            className="object-contain"
            sizes="400px"
            unoptimized
          />
          {sticker.isFoil && (
            <div className="absolute inset-0 foil-shimmer opacity-15 mix-blend-overlay pointer-events-none" />
          )}
          <span className="absolute bottom-1.5 right-2 text-[10px] text-panini-white/70 bg-panini-navy/70 rounded px-1.5 py-0.5 opacity-0 group-hover/img:opacity-100 transition-opacity">
            {editingImage ? "Editing image…" : "Click to edit image"}
          </span>
        </button>

        {editingImage && (
          <div className="bg-panini-navy/80 border-b border-panini-blue/40 p-3 space-y-2">
            <label className="block text-panini-gray text-xs">Image URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…"
              className="w-full bg-panini-navy border border-panini-blue/50 rounded-lg px-2.5 py-1.5 text-panini-white text-xs focus:outline-none focus:border-panini-gold"
            />
            {imageError && <p className="text-panini-red text-xs">{imageError}</p>}
            <div className="flex items-center gap-2">
              <button
                onClick={saveImage}
                disabled={isSavingImage}
                className="bg-panini-gold hover:bg-panini-gold-lt text-panini-navy font-bold px-3 py-1 rounded text-xs transition-colors disabled:opacity-50"
              >
                {isSavingImage ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => {
                  setImageUrl(sticker.imagePath ?? "");
                  setImageError("");
                  setEditingImage(false);
                }}
                className="text-panini-gray hover:text-panini-white text-xs px-2 py-1"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

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
