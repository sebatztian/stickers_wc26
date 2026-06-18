"use client";

import { useState, useTransition } from "react";
import { markDealDone } from "@/lib/actions/trades";

interface Props {
  tradeId: string;
  isVirtual: boolean;
  isInitiator: boolean;
  initiatorDealDone: boolean;
  receiverDealDone: boolean;
  partnerName: string;
}

export function DealDoneButton({
  tradeId,
  isVirtual,
  isInitiator,
  initiatorDealDone,
  receiverDealDone,
  partnerName,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const myDone = isInitiator ? initiatorDealDone : receiverDealDone;
  const theirDone = isVirtual ? false : isInitiator ? receiverDealDone : initiatorDealDone;
  const bothDone = isVirtual ? myDone : myDone && theirDone;

  const [optimisticMyDone, setOptimisticMyDone] = useState(myDone);
  const optimisticBothDone = isVirtual ? optimisticMyDone : optimisticMyDone && theirDone;

  function toggle() {
    const next = !optimisticMyDone;
    setOptimisticMyDone(next);
    startTransition(async () => {
      const res = await markDealDone(tradeId, next);
      if (!res.success) setOptimisticMyDone(!next); // revert on error
    });
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={toggle}
        disabled={isPending}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 ${
          optimisticMyDone
            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25"
            : "bg-panini-blue/10 border-panini-blue/40 text-panini-gray hover:text-panini-white hover:border-panini-gold/40"
        }`}
      >
        <span>{optimisticMyDone ? "✓" : "○"}</span>
        <span>{optimisticMyDone ? "Deal done (you)" : "Mark deal as done"}</span>
      </button>

      {!isVirtual && (
        <span className={`text-xs ${theirDone ? "text-emerald-400" : "text-panini-gray"}`}>
          {theirDone ? `✓ ${partnerName} confirmed` : `${partnerName} hasn't confirmed yet`}
        </span>
      )}

      {optimisticBothDone && (
        <span className="text-xs font-bold text-emerald-400">🤝 Both confirmed — deal done!</span>
      )}
    </div>
  );
}
