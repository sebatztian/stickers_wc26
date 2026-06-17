"use client";

import { useState } from "react";
import { formatTradeText } from "@/lib/utils";

interface Props {
  offerIds: string[];
  requestIds: string[];
}

export function CopyTradeProposal({ offerIds, requestIds }: Props) {
  const [label, setLabel] = useState("Copy proposal");

  function handleCopy() {
    const text = formatTradeText([
      { title: "I offer", ids: offerIds },
      { title: "I want", ids: requestIds },
    ]);
    navigator.clipboard.writeText(text).then(() => {
      setLabel("Copied!");
      setTimeout(() => setLabel("Copy proposal"), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      className="text-sm text-panini-gray hover:text-panini-white border border-panini-blue/30 hover:border-panini-gold/40 rounded-lg px-3 py-1.5 transition-colors"
    >
      {label}
    </button>
  );
}
