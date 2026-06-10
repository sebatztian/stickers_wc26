"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { UserPicker } from "./UserPicker";
import { createTrade } from "@/lib/actions/trades";
import { Button } from "@/components/ui/Button";
import type { Sticker, UserSticker } from "@/generated/prisma/client";

type MySticker = UserSticker & { sticker: Sticker };

interface Props {
  myStickers: MySticker[];
  allStickers: Sticker[];
  preselectedReceiverId: string;
}

interface SelectedItem {
  stickerId: string;
  name: string;
  quantity: number;
}

export function TradeCreateWizard({ myStickers, allStickers, preselectedReceiverId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [receiverId, setReceiverId] = useState(preselectedReceiverId);
  const [offered, setOffered] = useState<SelectedItem[]>([]);
  const [requested, setRequested] = useState<SelectedItem[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function toggleOffered(sticker: Sticker) {
    setOffered((prev) => {
      const existing = prev.find((i) => i.stickerId === sticker.id);
      if (existing) return prev.filter((i) => i.stickerId !== sticker.id);
      const owned = myStickers.find((s) => s.stickerId === sticker.id);
      return [...prev, { stickerId: sticker.id, name: sticker.name, quantity: Math.min(2, owned?.ownedQty ?? 1) }];
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

      {/* Stickers I offer */}
      <div className="space-y-3">
        <div>
          <h3 className="font-display font-bold text-panini-white text-lg">Stickers I Offer</h3>
          <p className="text-panini-gray text-xs">Select from your duplicates (qty &gt; 1) — optional for wish requests</p>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto bg-panini-navy/50 rounded-xl p-3">
          {myStickers.filter((s) => s.ownedQty > 1).map(({ sticker, ownedQty }) => {
            const isSelected = offered.some((i) => i.stickerId === sticker.id);
            return (
              <button
                key={sticker.id}
                onClick={() => toggleOffered(sticker)}
                className={`relative aspect-[3/4] rounded overflow-hidden transition-all ${
                  isSelected ? "ring-2 ring-panini-gold" : "ring-1 ring-panini-blue/30 opacity-70 hover:opacity-100"
                }`}
              >
                <Image src={`/api/stickers/${sticker.id}/image`} alt={sticker.name} fill className="object-cover" sizes="80px" unoptimized />
                <div className="absolute bottom-0 left-0 right-0 bg-panini-navy/80 py-0.5">
                  <p className="text-[8px] text-center text-panini-white truncate px-1">{sticker.id}</p>
                </div>
                <div className="absolute top-0.5 right-0.5 bg-panini-gold text-panini-navy text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  ×{ownedQty}
                </div>
              </button>
            );
          })}
          {myStickers.filter((s) => s.ownedQty > 1).length === 0 && (
            <p className="col-span-full text-panini-gray text-xs text-center py-4">No duplicates yet</p>
          )}
        </div>
        {offered.length > 0 && (
          <p className="text-emerald-400 text-xs">{offered.length} sticker{offered.length !== 1 ? "s" : ""} selected</p>
        )}
      </div>

      {/* Stickers I request */}
      <div className="space-y-3">
        <div>
          <h3 className="font-display font-bold text-panini-white text-lg">Stickers I Request</h3>
          <p className="text-panini-gray text-xs">Any sticker from the album — optional for gifts</p>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto bg-panini-navy/50 rounded-xl p-3">
          {allStickers.map((sticker) => {
            const isSelected = requested.some((i) => i.stickerId === sticker.id);
            return (
              <button
                key={sticker.id}
                onClick={() => toggleRequested(sticker)}
                className={`relative aspect-[3/4] rounded overflow-hidden transition-all ${
                  isSelected ? "ring-2 ring-panini-blue-lt" : "ring-1 ring-panini-blue/30 opacity-70 hover:opacity-100"
                }`}
              >
                <Image src={`/api/stickers/${sticker.id}/image`} alt={sticker.name} fill className="object-cover" sizes="80px" unoptimized />
                <div className="absolute bottom-0 left-0 right-0 bg-panini-navy/80 py-0.5">
                  <p className="text-[8px] text-center text-panini-white truncate px-1">{sticker.id}</p>
                </div>
              </button>
            );
          })}
        </div>
        {requested.length > 0 && (
          <p className="text-panini-blue-lt text-xs">{requested.length} sticker{requested.length !== 1 ? "s" : ""} selected</p>
        )}
      </div>

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
