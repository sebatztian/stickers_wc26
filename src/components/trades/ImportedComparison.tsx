"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { StickerSelectGrid } from "@/components/stickers/StickerSelectGrid";
import { Button } from "@/components/ui/Button";
import {
  createVirtualCollection,
  deleteVirtualCollection,
  applyVirtualTrade,
} from "@/lib/actions/virtual";
import { compareStickers } from "@/lib/utils";
import type { VirtualCollectionWithMatches } from "@/lib/queries/trades";
import type { Sticker } from "@/generated/prisma/client";

interface Props {
  collections: VirtualCollectionWithMatches[];
}

type Feedback = { type: "success" | "error"; message: string } | null;

export function ImportedComparison({ collections }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string>(collections[0]?.id ?? "");
  const [showForm, setShowForm] = useState(collections.length === 0);
  const [name, setName] = useState("");
  const [duplicates, setDuplicates] = useState("");
  const [missing, setMissing] = useState("");
  const [give, setGive] = useState<Set<string>>(new Set());
  const [receive, setReceive] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<Feedback>(null);

  const selected = collections.find((c) => c.id === selectedId) ?? null;

  function toggle(setter: typeof setGive, id: string) {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleCreate() {
    if (!name.trim()) {
      setFeedback({ type: "error", message: "Name is required" });
      return;
    }
    startTransition(async () => {
      const res = await createVirtualCollection({ name, duplicates, missing });
      if (!res.success) {
        setFeedback({ type: "error", message: res.error });
        return;
      }
      setName("");
      setDuplicates("");
      setMissing("");
      setShowForm(false);
      setSelectedId(res.data.id);
      setFeedback(
        res.unknown.length > 0
          ? { type: "error", message: `Added — but ignored unknown codes: ${res.unknown.join(", ")}` }
          : { type: "success", message: "Imported collection saved." }
      );
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteVirtualCollection(id);
      if (selectedId === id) setSelectedId("");
      setGive(new Set());
      setReceive(new Set());
      router.refresh();
    });
  }

  function handleApply() {
    if (give.size === 0 && receive.size === 0) return;
    startTransition(async () => {
      const res = await applyVirtualTrade({ give: [...give], receive: [...receive] });
      if (!res.success) {
        setFeedback({ type: "error", message: res.error });
        return;
      }
      setGive(new Set());
      setReceive(new Set());
      setFeedback({
        type: "success",
        message:
          res.warnings.length > 0
            ? `Collection updated (some weren't in your collection: ${res.warnings.join(", ")}).`
            : "Collection updated.",
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Existing imports + add toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        {collections.map((c) => (
          <div
            key={c.id}
            className={`flex items-center gap-1.5 rounded-full pl-3 pr-1.5 py-1 text-sm transition-colors ${
              c.id === selectedId
                ? "bg-panini-gold/20 ring-1 ring-panini-gold/50 text-panini-white"
                : "bg-panini-blue/20 text-panini-gray hover:text-panini-white"
            }`}
          >
            <button onClick={() => { setSelectedId(c.id); setGive(new Set()); setReceive(new Set()); }}>
              {c.name}
            </button>
            <button
              onClick={() => handleDelete(c.id)}
              disabled={isPending}
              title="Delete"
              className="w-5 h-5 rounded-full hover:bg-panini-red/30 text-panini-gray hover:text-panini-red leading-none"
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-full px-3 py-1 text-sm font-medium bg-panini-blue-mid text-panini-white hover:bg-panini-blue transition-colors"
        >
          {showForm ? "Close" : "+ Import collection"}
        </button>
      </div>

      {feedback && (
        <p className={`text-sm ${feedback.type === "success" ? "text-emerald-400" : "text-panini-red"}`}>
          {feedback.message}
        </p>
      )}

      {/* Add form */}
      {showForm && (
        <div className="bg-panini-blue/10 border border-panini-blue/30 rounded-xl p-4 space-y-3">
          <div className="space-y-1">
            <label className="text-panini-white font-medium text-sm">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              placeholder="e.g. Tom from work"
              className="w-full bg-panini-navy border border-panini-blue/50 rounded-lg px-3 py-2 text-panini-white text-sm focus:outline-none focus:border-panini-gold"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-panini-white font-medium text-sm">Duplicates</label>
              <p className="text-panini-gray text-xs">Codes they have spares of (they can give you)</p>
              <textarea
                value={duplicates}
                onChange={(e) => setDuplicates(e.target.value)}
                rows={4}
                placeholder="MEX1, GER5, FWC2…"
                className="w-full bg-panini-navy border border-panini-blue/50 rounded-lg px-3 py-2 text-panini-white text-sm font-mono uppercase focus:outline-none focus:border-panini-gold resize-y"
              />
            </div>
            <div className="space-y-1">
              <label className="text-panini-white font-medium text-sm">Missing</label>
              <p className="text-panini-gray text-xs">Codes they still need (you can give them)</p>
              <textarea
                value={missing}
                onChange={(e) => setMissing(e.target.value)}
                rows={4}
                placeholder="ARG10, BRA3…"
                className="w-full bg-panini-navy border border-panini-blue/50 rounded-lg px-3 py-2 text-panini-white text-sm font-mono uppercase focus:outline-none focus:border-panini-gold resize-y"
              />
            </div>
          </div>
          <Button variant="primary" size="md" onClick={handleCreate} disabled={isPending}>
            {isPending ? "Saving…" : "Save collection"}
          </Button>
        </div>
      )}

      {/* Comparison + immediate apply */}
      {selected && (
        <>
          <div className="grid md:grid-cols-2 gap-6">
            <SelectColumn
              title="I Can Give Them"
              subtitle="Your duplicates they're missing"
              items={selected.iCanGiveThem}
              selectedIds={give}
              onToggle={(id) => toggle(setGive, id)}
              ring="ring-emerald-400"
              emptyText="Nothing to give"
            />
            <SelectColumn
              title="They Can Give Me"
              subtitle="Their duplicates you need"
              items={selected.theyCanGiveMe}
              selectedIds={receive}
              onToggle={(id) => toggle(setReceive, id)}
              ring="ring-panini-blue-lt"
              emptyText="Nothing to receive"
            />
          </div>

          {selected.iCanGiveThem.length === 0 && selected.theyCanGiveMe.length === 0 && (
            <p className="text-center py-8 text-panini-gray">
              No trades right now. Update your collection or edit this import.
            </p>
          )}

          {(give.size > 0 || receive.size > 0) && (
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <span className="text-panini-gray text-sm">
                Giving <span className="text-emerald-400 font-bold">{give.size}</span> · Receiving{" "}
                <span className="text-panini-blue-lt font-bold">{receive.size}</span>
              </span>
              <Button variant="primary" size="lg" onClick={handleApply} disabled={isPending}>
                {isPending ? "Updating…" : "Apply to my collection"}
              </Button>
            </div>
          )}
        </>
      )}

      {!selected && collections.length > 0 && (
        <p className="text-panini-gray text-sm">Select an imported collection above to compare.</p>
      )}
    </div>
  );
}

function SelectColumn({
  title,
  subtitle,
  items,
  selectedIds,
  onToggle,
  ring,
  emptyText,
}: {
  title: string;
  subtitle: string;
  items: { sticker: Sticker; ownedQty: number }[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  ring: string;
  emptyText: string;
}) {
  const sorted = useMemo(
    () => [...items].sort((a, b) => compareStickers(a.sticker, b.sticker, "album")),
    [items]
  );

  return (
    <div className="bg-panini-blue/10 border border-panini-blue/30 rounded-xl p-4 space-y-3">
      <div>
        <h3 className="font-display font-bold text-panini-white text-xl">{title}</h3>
        <p className="text-panini-gray text-xs">{subtitle}</p>
        <span className="text-xs font-medium text-panini-gray">
          {items.length} sticker{items.length !== 1 ? "s" : ""}
        </span>
      </div>
      <StickerSelectGrid
        items={sorted}
        selectedIds={selectedIds}
        onToggle={(s) => onToggle(s.id)}
        ringClass={ring}
        emptyText={emptyText}
      />
    </div>
  );
}
