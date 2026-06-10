"use client";

import Image from "next/image";
import { COUNTRY_FLAGS } from "@/lib/constants";

interface StickerThumbnailProps {
  id: string;
  name: string;
  country: string;
  code: string;
  isFoil: boolean;
  isTeamLogo: boolean;
  isTeamPhoto: boolean;
  isSpecial: boolean;
  ownedQty: number;
  onClick: () => void;
}

export function StickerThumbnail({
  id,
  name,
  code,
  isFoil,
  isTeamLogo,
  isTeamPhoto,
  isSpecial,
  ownedQty,
  onClick,
}: StickerThumbnailProps) {
  const flag = COUNTRY_FLAGS[code] ?? "🏆";
  const owned = ownedQty > 0;

  return (
    <button
      onClick={onClick}
      className={`group relative sticker-card w-full aspect-[3/4] bg-gradient-to-b from-panini-blue/80 to-panini-navy overflow-hidden transition-all ${
        owned ? "ring-2 ring-emerald-500/60" : "ring-1 ring-panini-blue/20"
      }`}
    >
      {isFoil && (
        <div className="absolute inset-0 foil-shimmer opacity-10 group-hover:opacity-25 mix-blend-overlay transition-opacity z-10 pointer-events-none" />
      )}

      <div className="relative w-full h-3/4 overflow-hidden">
        <Image
          src={`/api/stickers/${id}/image`}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 25vw, (max-width: 1024px) 12vw, 8vw"
          unoptimized
        />
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-panini-navy/90 px-1 pt-1 pb-0.5">
        <div className="flex items-center gap-0.5 mb-0.5">
          <span className="text-xs leading-none">{flag}</span>
          <span className="text-[9px] text-panini-gray font-medium truncate">{id}</span>
        </div>
        <p className="text-[9px] text-panini-white/80 leading-tight line-clamp-1">
          {isTeamLogo ? "Team Logo" : isTeamPhoto ? "Team Photo" : isSpecial ? name : name}
        </p>
      </div>

      {ownedQty > 0 && (
        <div className="absolute top-1 right-1 z-20 bg-emerald-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
          {ownedQty > 9 ? "9+" : ownedQty}
        </div>
      )}
    </button>
  );
}
