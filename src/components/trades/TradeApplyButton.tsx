"use client";

import { useState, useTransition } from "react";
import { applyTradeToCollection } from "@/lib/actions/trades";

interface Props {
  tradeId: string;
  alreadyApplied: boolean;
}

export function TradeApplyButton({ tradeId, alreadyApplied }: Props) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(alreadyApplied);
  const [warnings, setWarnings] = useState<string[]>([]);

  function handleApply() {
    startTransition(async () => {
      const result = await applyTradeToCollection(tradeId);
      if (result.success) {
        setDone(true);
        if (result.warnings.length > 0) setWarnings(result.warnings);
      }
    });
  }

  return (
    <div className="space-y-3">
      {warnings.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl px-4 py-3 space-y-1">
          <p className="text-amber-400 font-medium text-sm">
            Some stickers you offered were not in your collection:
          </p>
          <ul className="text-amber-300/80 text-xs list-disc list-inside">
            {warnings.map((id) => (
              <li key={id}>{id} — set to 0 in your collection</li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={handleApply}
        disabled={done || isPending}
        className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${
          done
            ? "bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 cursor-default"
            : "bg-panini-gold hover:bg-panini-gold-lt text-panini-navy disabled:opacity-50"
        }`}
      >
        {done ? "Collection updated" : isPending ? "Updating…" : "Update my collection"}
      </button>
    </div>
  );
}
