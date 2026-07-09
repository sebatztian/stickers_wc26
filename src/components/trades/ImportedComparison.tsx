"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { StickerSelectGrid } from "@/components/stickers/StickerSelectGrid";
import { Button } from "@/components/ui/Button";
import {
  createVirtualCollection,
  updateVirtualCollection,
  deleteVirtualCollection,
  saveVirtualTrade,
} from "@/lib/actions/virtual";
import { compareStickers, formatTradeText, idsToGroupedText } from "@/lib/utils";
import type { VirtualCollectionWithMatches } from "@/lib/queries/trades";
import type { Sticker } from "@/generated/prisma/client";

interface Props {
  collections: VirtualCollectionWithMatches[];
}

type Feedback = { type: "success" | "error"; message: string } | null;
type FormMode = { type: "create" } | { type: "edit"; id: string } | null;

export function ImportedComparison({ collections }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string>(collections[0]?.id ?? "");
  const [formMode, setFormMode] = useState<FormMode>(collections.length === 0 ? { type: "create" } : null);
  const [name, setName] = useState("");
  const [contactUrl, setContactUrl] = useState("");
  const [duplicates, setDuplicates] = useState("");
  const [missing, setMissing] = useState("");
  const [give, setGive] = useState<Set<string>>(new Set());
  const [receive, setReceive] = useState<Set<string>>(new Set());
  // beneficiary userId → selected sticker IDs picked up for that user
  const [receiveFor, setReceiveFor] = useState<Record<string, Set<string>>>({});
  const [feedback, setFeedback] = useState<Feedback>(null);

  const selected = collections.find((c) => c.id === selectedId) ?? null;

  function clearSelection() {
    setGive(new Set());
    setReceive(new Set());
    setReceiveFor({});
  }

  function toggleFor(userId: string, id: string) {
    setReceiveFor((prev) => {
      const next = { ...prev };
      const set = new Set(next[userId] ?? []);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      next[userId] = set;
      return next;
    });
  }

  const forCount = Object.values(receiveFor).reduce((n, s) => n + s.size, 0);

  function openCreate() {
    setName("");
    setContactUrl("");
    setDuplicates("");
    setMissing("");
    setFormMode({ type: "create" });
    setFeedback(null);
  }

  function openEdit(c: VirtualCollectionWithMatches) {
    setName(c.name);
    setContactUrl(c.contactUrl ?? "");
    setDuplicates(idsToGroupedText(c.duplicates));
    setMissing(idsToGroupedText(c.missing));
    setFormMode({ type: "edit", id: c.id });
    setFeedback(null);
  }

  function closeForm() {
    setFormMode(null);
    setFeedback(null);
  }

  function toggle(setter: typeof setGive, id: string) {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmitForm() {
    if (!name.trim()) {
      setFeedback({ type: "error", message: "Name is required" });
      return;
    }
    startTransition(async () => {
      const payload = { name, contactUrl: contactUrl || undefined, duplicates, missing };
      const res = formMode?.type === "edit"
        ? await updateVirtualCollection({ ...payload, id: formMode.id })
        : await createVirtualCollection(payload);

      if (!res.success) {
        setFeedback({ type: "error", message: res.error });
        return;
      }
      const savedId = formMode?.type === "edit"
        ? formMode.id
        : (res as { success: true; data: { id: string }; unknown: string[] }).data.id;
      setFormMode(null);
      setSelectedId(savedId);
      clearSelection();
      setFeedback(
        res.unknown.length > 0
          ? { type: "error", message: `Saved — but ignored unknown codes: ${res.unknown.join(", ")}` }
          : { type: "success", message: formMode?.type === "edit" ? "Collection updated." : "Imported collection saved." }
      );
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteVirtualCollection(id);
      if (selectedId === id) setSelectedId(collections.find((c) => c.id !== id)?.id ?? "");
      if (formMode?.type === "edit" && formMode.id === id) setFormMode(null);
      clearSelection();
      router.refresh();
    });
  }

  function handleSave() {
    if (!selected || (give.size === 0 && receive.size === 0 && forCount === 0)) return;
    const receiveForPayload = Object.entries(receiveFor).flatMap(([forUserId, ids]) =>
      [...ids].map((stickerId) => ({ stickerId, forUserId }))
    );
    startTransition(async () => {
      const res = await saveVirtualTrade({
        virtualCollectionId: selected.id,
        give: [...give],
        receive: [...receive],
        receiveFor: receiveForPayload,
      });
      if (!res.success) {
        setFeedback({ type: "error", message: res.error });
        return;
      }
      clearSelection();
      setFeedback({ type: "success", message: "Trade saved — you can apply it from Trade History." });
      router.push(`/trade/${res.data.id}`);
    });
  }

  function handleCopy() {
    if (!selected) return;
    const giveItems = selected.iCanGiveThem.filter((i) => give.has(i.sticker.id));
    const receiveItems = selected.theyCanGiveMe.filter((i) => receive.has(i.sticker.id));
    const forSections = selected.friendPickups
      .map((p) => ({
        title: `For ${p.userName}`,
        ids: p.stickers.filter((i) => receiveFor[p.userId]?.has(i.sticker.id)).map((i) => i.sticker.id),
      }))
      .filter((s) => s.ids.length > 0);
    const text = formatTradeText([
      { title: "I offer", ids: giveItems.map((i) => i.sticker.id) },
      { title: "I want", ids: receiveItems.map((i) => i.sticker.id) },
      ...forSections,
    ]);
    navigator.clipboard.writeText(text).then(() => {
      setFeedback({ type: "success", message: "Copied to clipboard!" });
    });
  }

  const isEditing = formMode?.type === "edit";

  return (
    <div className="space-y-6">
      {/* Collection pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {collections.map((c) => (
          <div
            key={c.id}
            className={`flex items-center gap-1 rounded-full pl-3 pr-1.5 py-1 text-sm transition-colors ${
              c.id === selectedId
                ? "bg-panini-gold/20 ring-1 ring-panini-gold/50 text-panini-white"
                : "bg-panini-blue/20 text-panini-gray hover:text-panini-white"
            }`}
          >
            <button onClick={() => { setSelectedId(c.id); clearSelection(); setFormMode(null); }}>
              {c.name}
            </button>
            <button
              onClick={() => openEdit(c)}
              title="Edit"
              className="w-5 h-5 rounded-full hover:bg-panini-blue/60 text-panini-gray hover:text-panini-white leading-none text-xs"
            >
              ✎
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
          onClick={formMode?.type === "create" ? closeForm : openCreate}
          className="rounded-full px-3 py-1 text-sm font-medium bg-panini-blue-mid text-panini-white hover:bg-panini-blue transition-colors"
        >
          {formMode?.type === "create" ? "Close" : "+ Import collection"}
        </button>
      </div>

      {feedback && (
        <p className={`text-sm ${feedback.type === "success" ? "text-emerald-400" : "text-panini-red"}`}>
          {feedback.message}
        </p>
      )}

      {/* Create / edit form */}
      {formMode && (
        <div className="bg-panini-blue/10 border border-panini-blue/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-panini-white text-lg">
              {isEditing ? "Edit collection" : "Import collection"}
            </h3>
            {isEditing && (
              <button onClick={closeForm} className="text-panini-gray hover:text-panini-white text-sm transition-colors">
                Cancel
              </button>
            )}
          </div>
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
          <div className="space-y-1">
            <label className="text-panini-white font-medium text-sm">
              Contact / Listing URL{" "}
              <span className="text-panini-gray font-normal">(optional)</span>
            </label>
            <input
              type="url"
              value={contactUrl}
              onChange={(e) => setContactUrl(e.target.value)}
              placeholder="https://www.kleinanzeigen.de/…"
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
                placeholder={"MEX: 1,2,6 (x2)\nGER: 3,15(x2),17\nor MEX1 GER5 FWC2…"}
                className="w-full bg-panini-navy border border-panini-blue/50 rounded-lg px-3 py-2 text-panini-white text-sm font-mono focus:outline-none focus:border-panini-gold resize-y"
              />
            </div>
            <div className="space-y-1">
              <label className="text-panini-white font-medium text-sm">Missing</label>
              <p className="text-panini-gray text-xs">Codes they still need (you can give them)</p>
              <textarea
                value={missing}
                onChange={(e) => setMissing(e.target.value)}
                rows={4}
                placeholder={"ARG: 10, 14, 20\nor ARG10 BRA3…"}
                className="w-full bg-panini-navy border border-panini-blue/50 rounded-lg px-3 py-2 text-panini-white text-sm font-mono focus:outline-none focus:border-panini-gold resize-y"
              />
            </div>
          </div>
          <Button variant="primary" size="md" onClick={handleSubmitForm} disabled={isPending}>
            {isPending ? "Saving…" : isEditing ? "Update collection" : "Save collection"}
          </Button>
        </div>
      )}

      {/* Comparison */}
      {selected && !formMode && (
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
              No trades right now. Update your collection or{" "}
              <button onClick={() => openEdit(selected)} className="text-panini-gold hover:underline">
                edit this import
              </button>
              .
            </p>
          )}

          {/* Pick up for friends: import duplicates other registered users need */}
          {selected.friendPickups.length > 0 && (
            <div className="space-y-3">
              <div>
                <h3 className="font-display font-bold text-panini-white text-xl">Pick Up For Friends</h3>
                <p className="text-panini-gray text-xs">
                  Extra duplicates from this import that other users still need — grab them to pass on.
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {selected.friendPickups.map((p) => (
                  <SelectColumn
                    key={p.userId}
                    title={`For ${p.userName}`}
                    subtitle={`${p.userName} is missing these`}
                    items={p.stickers}
                    selectedIds={receiveFor[p.userId] ?? new Set()}
                    onToggle={(id) => toggleFor(p.userId, id)}
                    ring="ring-panini-gold"
                    emptyText="Nothing to pick up"
                  />
                ))}
              </div>
            </div>
          )}

          {(give.size > 0 || receive.size > 0 || forCount > 0) && (
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <span className="text-panini-gray text-sm">
                Giving <span className="text-emerald-400 font-bold">{give.size}</span> · Receiving{" "}
                <span className="text-panini-blue-lt font-bold">{receive.size}</span>
                {forCount > 0 && (
                  <>
                    {" "}· For friends <span className="text-panini-gold font-bold">{forCount}</span>
                  </>
                )}
              </span>
              <button
                onClick={handleCopy}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-panini-blue/40 text-panini-gray hover:text-panini-white hover:border-panini-gold/40 transition-colors"
              >
                Copy proposal
              </button>
              <Button variant="primary" size="lg" onClick={handleSave} disabled={isPending}>
                {isPending ? "Saving…" : "Save as trade"}
              </Button>
            </div>
          )}
        </>
      )}

      {!selected && !formMode && collections.length > 0 && (
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
