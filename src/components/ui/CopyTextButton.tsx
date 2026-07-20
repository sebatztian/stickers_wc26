"use client";

import { useState } from "react";

interface Props {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Copies an arbitrary text blob to the clipboard, briefly swapping its label to
 * confirm. Used for copying sticker lists (duplicates / missing / proposals).
 */
export function CopyTextButton({
  text,
  label = "Copy",
  copiedLabel = "Copied!",
  className = "text-sm text-panini-gray hover:text-panini-white border border-panini-blue/30 hover:border-panini-gold/40 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
  disabled = false,
}: Props) {
  const [current, setCurrent] = useState(label);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCurrent(copiedLabel);
      setTimeout(() => setCurrent(label), 2000);
    });
  }

  return (
    <button onClick={handleCopy} disabled={disabled} className={className}>
      {current}
    </button>
  );
}
