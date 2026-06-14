"use client";

import { useState, useTransition } from "react";
import { addByCode } from "@/lib/actions/collection";
import { Button } from "@/components/ui/Button";

interface Props {
  onAdded: (id: string, ownedQty: number) => void;
}

type Feedback = { type: "success" | "error"; message: string } | null;

export function QuickAddByCode({ onAdded }: Props) {
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    const code = value.trim();
    if (!code) return;

    startTransition(async () => {
      const result = await addByCode(code);
      if (result.success) {
        onAdded(result.data.stickerId, result.data.ownedQty);
        setFeedback({
          type: "success",
          message: `Added ${result.data.stickerId} — ${result.data.name} (×${result.data.ownedQty})`,
        });
        setValue("");
      } else {
        setFeedback({ type: "error", message: result.error });
      }
    });
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Quick add by code (e.g. MEX 18)"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          disabled={isPending}
          className="flex-1 min-w-0 bg-panini-navy border border-panini-blue/40 rounded-lg px-3 py-2 text-sm text-panini-white placeholder:text-panini-gray uppercase font-mono focus:outline-none focus:border-panini-gold transition-colors disabled:opacity-50"
        />
        <Button variant="primary" size="md" onClick={submit} disabled={isPending || !value.trim()}>
          Add
        </Button>
      </div>
      {feedback && (
        <p
          className={`text-xs px-1 ${
            feedback.type === "success" ? "text-emerald-400" : "text-panini-red"
          }`}
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}
