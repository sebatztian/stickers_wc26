"use client";

import { useState, useMemo } from "react";
import { CopyTextButton } from "@/components/ui/CopyTextButton";
import { idsToGroupedText } from "@/lib/utils";

export interface CollectorLists {
  id: string;
  name: string;
  duplicates: string[];
  missing: string[];
}

interface Props {
  collectors: CollectorLists[];
}

type Panel = "duplicates" | "missing" | null;

/**
 * Directory of every other collector with their duplicates (spares) and missing
 * stickers — viewable inline (grouped by team) and copyable as text.
 */
export function CollectorsLists({ collectors }: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return collectors;
    return collectors.filter((c) => c.name.toLowerCase().includes(q));
  }, [collectors, search]);

  if (collectors.length === 0) {
    return <p className="text-panini-gray text-sm">No other collectors yet.</p>;
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search collector…"
        className="w-full sm:w-64 bg-panini-navy border border-panini-blue/50 rounded-lg px-3 py-2 text-panini-white text-sm focus:outline-none focus:border-panini-gold"
      />

      {filtered.length === 0 && (
        <p className="text-panini-gray text-sm py-4 text-center">No collectors found</p>
      )}

      <div className="space-y-3">
        {filtered.map((c) => (
          <CollectorCard key={c.id} collector={c} />
        ))}
      </div>
    </div>
  );
}

function CollectorCard({ collector }: { collector: CollectorLists }) {
  const [open, setOpen] = useState<Panel>(null);

  const dupText = useMemo(() => idsToGroupedText(collector.duplicates), [collector.duplicates]);
  const missText = useMemo(() => idsToGroupedText(collector.missing), [collector.missing]);

  function toggle(panel: Exclude<Panel, null>) {
    setOpen((prev) => (prev === panel ? null : panel));
  }

  return (
    <div className="bg-panini-blue/10 border border-panini-blue/30 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="font-display font-bold text-panini-white text-lg">{collector.name}</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => toggle("duplicates")}
            className={`text-xs font-medium rounded-lg px-3 py-1.5 border transition-colors ${
              open === "duplicates"
                ? "bg-orange-500/20 border-orange-500/40 text-orange-300"
                : "border-panini-blue/40 text-panini-gray hover:text-panini-white hover:border-panini-gold/40"
            }`}
          >
            {collector.duplicates.length} duplicates
          </button>
          <CopyTextButton
            text={dupText}
            label="Copy dupes"
            disabled={collector.duplicates.length === 0}
          />
          <button
            onClick={() => toggle("missing")}
            className={`text-xs font-medium rounded-lg px-3 py-1.5 border transition-colors ${
              open === "missing"
                ? "bg-panini-blue-lt/20 border-panini-blue-lt/40 text-panini-blue-lt"
                : "border-panini-blue/40 text-panini-gray hover:text-panini-white hover:border-panini-gold/40"
            }`}
          >
            {collector.missing.length} missing
          </button>
          <CopyTextButton
            text={missText}
            label="Copy missing"
            disabled={collector.missing.length === 0}
          />
        </div>
      </div>

      {open && (
        <pre className="bg-panini-navy border border-panini-blue/40 rounded-lg p-3 text-panini-white text-xs font-mono whitespace-pre-wrap max-h-72 overflow-y-auto">
          {(open === "duplicates" ? dupText : missText) || "—"}
        </pre>
      )}
    </div>
  );
}
