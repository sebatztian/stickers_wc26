"use client";

import { useState, useTransition } from "react";
import { markDealDone } from "@/lib/actions/trades";

interface Props {
  tradeId: string;
  isInitiator: boolean;
  initiatorDealDone: boolean;
  receiverDealDone: boolean;
}

export function DealDoneButton({ tradeId, isInitiator, initiatorDealDone, receiverDealDone }: Props) {
  const [isPending, startTransition] = useTransition();
  const myDone = isInitiator ? initiatorDealDone : receiverDealDone;
  const [optimistic, setOptimistic] = useState(myDone);

  function toggle() {
    const next = !optimistic;
    setOptimistic(next);
    startTransition(async () => {
      const res = await markDealDone(tradeId, next);
      if (!res.success) setOptimistic(!next);
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 ${
        optimistic
          ? "bg-teal-500/15 border-teal-500/40 text-teal-300 hover:bg-teal-500/25"
          : "bg-panini-blue/10 border-panini-blue/40 text-panini-gray hover:text-panini-white hover:border-panini-gold/40"
      }`}
    >
      <span>{optimistic ? "✓" : "○"}</span>
      <span>{optimistic ? "Deal done" : "Mark deal as done"}</span>
    </button>
  );
}
