"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Sticker } from "@/generated/prisma/client";

type StickerWithQty = { sticker: Sticker; ownedQty: number };

interface RankedUser {
  id: string;
  name: string;
  uniqueCount: number;
  totalCount: number;
  duplicateCount: number;
  isMe: boolean;
}

interface Props {
  myId: string;
  users: RankedUser[];
  totalStickers: number;
}

export function TradeComparison({ users, totalStickers }: Props) {
  const router = useRouter();
  const [theirId, setTheirId] = useState("");
  const [search, setSearch] = useState("");
  const [matches, setMatches] = useState<{
    iCanGiveThem: StickerWithQty[];
    theyCanGiveMe: StickerWithQty[];
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedUser = users.find((u) => u.id === theirId) ?? null;

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.name.toLowerCase().includes(q));
  }, [users, search]);

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
      {/* Leaderboard / user picker */}
      <div className="bg-panini-blue/10 border border-panini-blue/30 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="font-display font-bold text-panini-white text-lg">Collectors</h3>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search user…"
            className="bg-panini-navy border border-panini-blue/50 rounded-lg px-3 py-1.5 text-panini-white text-sm focus:outline-none focus:border-panini-gold"
          />
        </div>
        <div className="space-y-1 max-h-72 overflow-y-auto">
          {filteredUsers.length === 0 && (
            <p className="text-panini-gray text-sm py-4 text-center">No users found</p>
          )}
          {filteredUsers.map((u) => {
            const isSelected = u.id === theirId;
            const rank = users.indexOf(u) + 1;
            const pct = totalStickers > 0 ? Math.round((u.uniqueCount / totalStickers) * 100) : 0;

            const inner = (
              <>
                <div className="flex items-center gap-3">
                  <span
                    className={`font-display font-bold text-sm w-6 shrink-0 text-center ${
                      u.isMe ? "text-panini-gray" : rank <= 3 ? "text-panini-gold" : "text-panini-gray"
                    }`}
                  >
                    {rank}
                  </span>
                  <span className="flex-1 text-panini-white font-medium truncate">
                    {u.name}
                    {u.isMe && <span className="text-panini-gray font-normal ml-1.5">(You)</span>}
                  </span>
                  <span className="text-emerald-400 text-xs font-bold tabular-nums">
                    {u.uniqueCount} <span className="text-panini-gray font-normal">unique</span>
                  </span>
                  <span className="text-panini-gray text-xs tabular-nums hidden sm:inline">
                    {u.totalCount} total · {u.duplicateCount} dupes
                  </span>
                </div>
                {/* Completion bar */}
                <div className="flex items-center gap-2 mt-1.5 pl-9">
                  <div className="h-1.5 flex-1 bg-panini-blue/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-panini-gold to-panini-gold-lt rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-panini-gray text-[10px] tabular-nums w-8 text-right">{pct}%</span>
                </div>
              </>
            );

            if (u.isMe) {
              return (
                <div
                  key={u.id}
                  title="This is you"
                  className="w-full px-3 py-2 rounded-lg bg-panini-navy/40 opacity-50 cursor-default"
                >
                  {inner}
                </div>
              );
            }

            return (
              <button
                key={u.id}
                onClick={() => handleCompare(u.id)}
                className={`w-full px-3 py-2 rounded-lg text-left transition-colors ${
                  isSelected
                    ? "bg-panini-gold/20 ring-1 ring-panini-gold/50"
                    : "bg-panini-navy/40 hover:bg-panini-blue/20"
                }`}
              >
                {inner}
              </button>
            );
          })}
        </div>
      </div>

      {selectedUser && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-panini-gray text-sm">
            Comparing with <span className="text-panini-gold font-medium">{selectedUser.name}</span>
          </span>
          {isPending && <span className="text-panini-gold text-sm">Loading…</span>}
        </div>
      )}

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
  items: StickerWithQty[];
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
