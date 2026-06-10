import Image from "next/image";
import { COUNTRY_FLAGS } from "@/lib/constants";
import { FoilBadge } from "./FoilBadge";

interface StickerCardProps {
  id: string;
  name: string;
  country: string;
  code: string;
  position: number;
  isFoil: boolean;
  isTeamLogo: boolean;
  isTeamPhoto: boolean;
  isSpecial: boolean;
  ownedQty?: number;
}

export function StickerCard({
  id,
  name,
  country,
  code,
  position,
  isFoil,
  isTeamLogo,
  isTeamPhoto,
  isSpecial,
  ownedQty = 0,
}: StickerCardProps) {
  const flag = COUNTRY_FLAGS[code] ?? "🏆";
  const isPlayer = !isTeamLogo && !isTeamPhoto && !isSpecial;

  return (
    <div className="group relative sticker-card w-48 bg-gradient-to-b from-panini-blue to-panini-navy overflow-hidden select-none">
      {isFoil && <FoilBadge />}

      {/* Header strip */}
      <div className="bg-panini-blue px-3 py-1.5 flex items-center justify-between">
        <span className="font-display text-xs font-bold text-panini-gold tracking-widest">
          PANINI
        </span>
        <span className="text-xs text-panini-white/70">{id}</span>
      </div>

      {/* Image area */}
      <div className="relative h-44 bg-gradient-to-b from-panini-navy to-panini-blue/30 overflow-hidden">
        <Image
          src={`/api/stickers/${id}/image`}
          alt={name}
          fill
          className="object-cover"
          sizes="192px"
          unoptimized
        />
        {isFoil && (
          <div className="absolute inset-0 foil-shimmer opacity-10 mix-blend-overlay" />
        )}
      </div>

      {/* Country strip */}
      <div className="bg-panini-gold px-3 py-1 flex items-center gap-1.5">
        <span className="text-sm">{flag}</span>
        <span className="font-display font-bold text-panini-navy text-sm uppercase tracking-wide truncate">
          {isSpecial ? "FIFA WC 2026" : country}
        </span>
      </div>

      {/* Player info */}
      <div className="px-3 py-2 min-h-12">
        <p className="font-medium text-panini-white text-sm leading-tight line-clamp-2">
          {isTeamLogo
            ? `${country} — Team Logo`
            : isTeamPhoto
            ? `${country} — Team Photo`
            : name}
        </p>
        {isPlayer && (
          <p className="text-panini-gray text-xs mt-0.5">
            #{position}
          </p>
        )}
      </div>

      {/* Footer badges */}
      <div className="px-3 pb-2 flex items-center gap-2">
        {ownedQty > 0 && (
          <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded px-1.5 py-0.5">
            ×{ownedQty}
          </span>
        )}
        {isFoil && (
          <span className="text-xs bg-panini-gold/20 text-panini-gold border border-panini-gold/30 rounded px-1.5 py-0.5">
            FOIL ✦
          </span>
        )}
      </div>
    </div>
  );
}
