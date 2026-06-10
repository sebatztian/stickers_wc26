"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { UserPicker } from "./UserPicker";
import { COUNTRY_FLAGS } from "@/lib/constants";
import type { Sticker, UserSticker } from "@/generated/prisma/client";

type UserStickerWithSticker = UserSticker & { sticker: Sticker };

interface Props {
  myId: string;
}

export function TradeComparison({ myId }: Props) {
  const router = useRouter();
  const [theirId, setTheirId] = useState("");
  const [matches, setMatches] = useState<{
    iCanGiveThem: UserStickerWithSticker[];
    theyCanGiveMe: UserStickerWithSticker[];
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCompare(userId: string) {
    setTheirId(userId);
    if (!userId) {
      setMatches(null);
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/trade-matches?theirId=${userId}`);
      if (res.ok) setMatches(await res.json());
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-panini-gray text-sm">Compare with:</span>
        <UserPicker value={theirId} onChange={handleCompare} />
        {isPending && (
          <div className="text-panini-gold text-sm">Loading…</div>
        )}
      </div>

      {matches && (
        <div className="grid md:grid-cols-2 gap-6">
          <ComparisonColumn
            title="I Can Give Them"
            subtitle="My duplicates they need"
            items={matches.iCanGiveThem}
            accent="emerald"
          />
          <ComparisonColumn
            title="They Can Give Me"
            subtitle="Their duplicates I need"
            items={matches.theyCanGiveMe}
            accent="blue"
          />
        </div>
      )}

      {matches && matches.iCanGiveThem.length === 0 && matches.theyCanGiveMe.length === 0 && (
        <div className="text-center py-12 text-panini-gray">
          No trades possible right now. Update your collection and wishlist to find matches.
        </div>
      )}

      {matches && (matches.iCanGiveThem.length > 0 || matches.theyCanGiveMe.length > 0) && (
        <div className="flex justify-center">
          <button
            onClick={() => router.push(`/trade/new?receiverId=${theirId}`)}
            className="bg-panini-gold hover:bg-panini-gold-lt text-panini-navy font-bold px-6 py-3 rounded-xl transition-colors"
          >
            Propose a Trade →
          </button>
        </div>
      )}
    </div>
  );
}

function ComparisonColumn({
  title,
  subtitle,
  items,
  accent,
}: {
  title: string;
  subtitle: string;
  items: UserStickerWithSticker[];
  accent: "emerald" | "blue";
}) {
  const borderColor = accent === "emerald" ? "border-emerald-500/30" : "border-panini-blue-lt/30";
  const badgeColor =
    accent === "emerald"
      ? "bg-emerald-500/10 text-emerald-400"
      : "bg-panini-blue-lt/10 text-panini-blue-lt";

  return (
    <div className={`bg-panini-blue/10 border ${borderColor} rounded-xl p-4 space-y-3`}>
      <div>
        <h3 className="font-display font-bold text-panini-white text-xl">{title}</h3>
        <p className="text-panini-gray text-xs">{subtitle}</p>
        <span className={`text-xs font-medium ${badgeColor} rounded-full px-2 py-0.5 mt-1 inline-block`}>
          {items.length} sticker{items.length !== 1 ? "s" : ""}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-panini-gray text-sm py-4 text-center">None available</p>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-80 overflow-y-auto">
          {items.map(({ sticker, ownedQty }) => (
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
                <p className="text-[9px] text-panini-white/70 truncate leading-tight">{sticker.name}</p>
              </div>
              <div className="absolute top-0.5 right-0.5 bg-panini-gold text-panini-navy text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                ×{ownedQty}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
