"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { UserPicker } from "./UserPicker";
import { createTrade } from "@/lib/actions/trades";
import { Button } from "@/components/ui/Button";
import { StickerSelectGrid } from "@/components/stickers/StickerSelectGrid";
import type { Sticker, UserSticker } from "@/generated/prisma/client";

type MySticker = UserSticker & { sticker: Sticker };
type StickerWithQty = { sticker: Sticker; ownedQty: number };

interface Props {
  myStickers: MySticker[];
  preselectedReceiverId: string;
}

interface SelectedItem {
  stickerId: string;
  name: string;
  quantity: number;
}

interface MatchData {
  iCanGiveThem: StickerWithQty[];
  theyCanGiveMe: StickerWithQty[];
  theirOwned: StickerWithQty[];
}

function matchesSearch(sticker: Sticker, q: string) {
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    sticker.name.toLowerCase().includes(needle) ||
    sticker.id.toLowerCase().includes(needle) ||
    sticker.code.toLowerCase().includes(needle) ||
    sticker.country.toLowerCase().includes(needle)
  );
}

export function TradeCreateWizard({ myStickers, preselectedReceiverId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [receiverId, setReceiverId] = useState(preselectedReceiverId);
  const [matches, setMatches] = useState<MatchData | null>(null);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");
  const [offered, setOffered] = useState<SelectedItem[]>([]);
  const [requested, setRequested] = useState<SelectedItem[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const myDuplicates = useMemo<StickerWithQty[]>(
    () => myStickers.filter((s) => s.ownedQty > 1).map((s) => ({ sticker: s.sticker, ownedQty: s.ownedQty })),
    [myStickers]
  );

  // Load match data whenever the trade partner changes
  useEffect(() => {
    if (!receiverId) {
      setMatches(null);
      return;
    }
    let cancelled = false;
    setLoadingMatches(true);
    fetch(`/api/trade-matches?theirId=${receiverId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) setMatches(data);
      })
      .catch(() => {
        if (!cancelled) setMatches(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingMatches(false);
      });
    return () => {
      cancelled = true;
    };
  }, [receiverId]);

  function toggleOffered(sticker: Sticker) {
    setOffered((prev) => {
      const existing = prev.find((i) => i.stickerId === sticker.id);
      if (existing) return prev.filter((i) => i.stickerId !== sticker.id);
      // Always offer a single duplicate — keep the rest of the stack.
      return [...prev, { stickerId: sticker.id, name: sticker.name, quantity: 1 }];
    });
  }

  function toggleRequested(sticker: Sticker) {
    setRequested((prev) => {
      const existing = prev.find((i) => i.stickerId === sticker.id);
      if (existing) return prev.filter((i) => i.stickerId !== sticker.id);
      return [...prev, { stickerId: sticker.id, name: sticker.name, quantity: 1 }];
    });
  }

  function handleSubmit() {
    if (!receiverId) { setError("Please select a trade partner"); return; }
    if (offered.length === 0 && requested.length === 0) {
      setError("Add at least one sticker on either side");
      return;
    }
    setError("");

    startTransition(async () => {
      const result = await createTrade({ receiverId, offered, requested, message: message || undefined });
      if (result.success) {
        router.push(`/trade/${result.data.id}`);
      } else {
        setError(result.error);
      }
    });
  }

  const isGift = offered.length > 0 && requested.length === 0;
  const isWishRequest = offered.length === 0 && requested.length > 0;

  const offerSource = showAll ? myDuplicates : matches?.iCanGiveThem ?? [];
  const requestSource = showAll ? matches?.theirOwned ?? [] : matches?.theyCanGiveMe ?? [];

  const offerItems = offerSource.filter((i) => matchesSearch(i.sticker, search));
  const requestItems = requestSource.filter((i) => matchesSearch(i.sticker, search));

  const offeredIds = useMemo(() => new Set(offered.map((i) => i.stickerId)), [offered]);
  const requestedIds = useMemo(() => new Set(requested.map((i) => i.stickerId)), [requested]);

  return (
    <div className="space-y-6">
      {/* Partner */}
      <div className="space-y-2">
        <label className="text-panini-white font-medium text-sm">Trade with</label>
        <UserPicker value={receiverId} onChange={setReceiverId} />
      </div>

      {/* Mode hint */}
      {(isGift || isWishRequest) && (
        <div className="bg-panini-gold/10 border border-panini-gold/30 rounded-lg px-4 py-2 text-panini-gold text-sm">
          {isGift ? "This will be sent as a gift — you give without requesting anything in return." : "This is a wish request — you ask for stickers without offering anything."}
        </div>
      )}

      {/* Controls: search + show-all toggle */}
      {receiverId && (
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID or team…"
            className="flex-1 min-w-48 bg-panini-navy border border-panini-blue/50 rounded-lg px-3 py-2 text-panini-white text-sm focus:outline-none focus:border-panini-gold"
          />
          <label className="flex items-center gap-2 text-panini-gray text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
              className="accent-panini-gold"
            />
            Show all
          </label>
        </div>
      )}
      {receiverId && !showAll && (
        <p className="text-panini-gray text-xs -mt-3">
          Showing only matches — your duplicates they need, and their duplicates you need. Toggle <span className="text-panini-white">Show all</span> for every duplicate / everything they own.
        </p>
      )}

      {!receiverId && (
        <p className="text-panini-gray text-sm">Select a trade partner above to see matching stickers.</p>
      )}

      {receiverId && (
        <>
          {/* Stickers I offer */}
          <div className="space-y-3">
            <div>
              <h3 className="font-display font-bold text-panini-white text-lg">Stickers I Offer</h3>
              <p className="text-panini-gray text-xs">
                {showAll ? "All your duplicates (qty > 1)" : "Your duplicates they need"}
              </p>
            </div>
            <StickerSelectGrid
              items={offerItems}
              selectedIds={offeredIds}
              onToggle={toggleOffered}
              ringClass="ring-panini-gold"
              loading={loadingMatches}
              emptyText={showAll ? "No duplicates yet" : "No matching duplicates"}
            />
            {offered.length > 0 && (
              <p className="text-emerald-400 text-xs">{offered.length} sticker{offered.length !== 1 ? "s" : ""} selected</p>
            )}
          </div>

          {/* Stickers I request */}
          <div className="space-y-3">
            <div>
              <h3 className="font-display font-bold text-panini-white text-lg">Stickers I Request</h3>
              <p className="text-panini-gray text-xs">
                {showAll ? "Everything they own" : "Their duplicates you need"}
              </p>
            </div>
            <StickerSelectGrid
              items={requestItems}
              selectedIds={requestedIds}
              onToggle={toggleRequested}
              ringClass="ring-panini-blue-lt"
              loading={loadingMatches}
              emptyText={showAll ? "They own nothing yet" : "No matching duplicates"}
            />
            {requested.length > 0 && (
              <p className="text-panini-blue-lt text-xs">{requested.length} sticker{requested.length !== 1 ? "s" : ""} selected</p>
            )}
          </div>
        </>
      )}

      {/* Message */}
      <div className="space-y-2">
        <label className="text-panini-gray text-sm">Message (optional)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={500}
          rows={2}
          className="w-full bg-panini-navy border border-panini-blue/50 rounded-lg px-3 py-2 text-panini-white text-sm focus:outline-none focus:border-panini-gold resize-none"
          placeholder="Add a note…"
        />
      </div>

      {error && (
        <p className="text-panini-red text-sm bg-panini-red/10 border border-panini-red/30 rounded-lg px-4 py-2">{error}</p>
      )}

      <Button variant="primary" size="lg" onClick={handleSubmit} disabled={isPending} className="w-full">
        {isPending ? "Sending…" : isGift ? "Send as Gift" : isWishRequest ? "Send Wish Request" : "Send Trade Proposal"}
      </Button>
    </div>
  );
}
