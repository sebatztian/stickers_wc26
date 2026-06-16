"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteVirtualTrade } from "@/lib/actions/virtual";

interface Props {
  tradeId: string;
}

export function VirtualTradeActions({ tradeId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function handleDelete() {
    startTransition(async () => {
      await deleteVirtualTrade(tradeId);
      router.push("/trade");
    });
  }

  return (
    <div className="flex items-center gap-3 pt-2 border-t border-panini-blue/20">
      {confirming ? (
        <>
          <span className="text-panini-gray text-sm">Delete this trade?</span>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="text-sm font-medium text-panini-red hover:text-red-400 transition-colors disabled:opacity-50"
          >
            {isPending ? "Deleting…" : "Yes, delete"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="text-sm text-panini-gray hover:text-panini-white transition-colors"
          >
            Cancel
          </button>
        </>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="text-sm text-panini-gray hover:text-panini-red transition-colors"
        >
          Delete trade
        </button>
      )}
    </div>
  );
}
