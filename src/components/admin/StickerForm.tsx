"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSticker } from "@/lib/actions/stickers";
import { TEAM_CODES, COUNTRY_NAMES } from "@/lib/constants";
import { Button } from "@/components/ui/Button";

export function StickerForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createSticker(formData);
      if (result.success) {
        router.push("/collection");
      } else {
        setError(result.error);
      }
    });
  }

  const inputClass =
    "w-full bg-panini-navy border border-panini-blue/50 rounded-lg px-3 py-2 text-panini-white text-sm focus:outline-none focus:border-panini-gold";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-panini-gray mb-1">Sticker ID *</label>
          <input name="id" required placeholder="e.g. GER21" className={inputClass} />
        </div>
        <div>
          <label className="block text-xs text-panini-gray mb-1">Country Code *</label>
          <select name="code" required className={inputClass}>
            <option value="">Select…</option>
            {TEAM_CODES.map((c) => (
              <option key={c} value={c}>{c} — {COUNTRY_NAMES[c]}</option>
            ))}
            <option value="FWC">FWC — Special</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs text-panini-gray mb-1">Player/Card Name *</label>
        <input name="name" required placeholder="e.g. Thomas Müller" className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-panini-gray mb-1">Country (full name)</label>
          <input name="country" placeholder="e.g. Germany" className={inputClass} />
        </div>
        <div>
          <label className="block text-xs text-panini-gray mb-1">Position # *</label>
          <input name="position" type="number" min="1" required placeholder="21" className={inputClass} />
        </div>
      </div>

      <div className="flex gap-6">
        {[
          { name: "isFoil", label: "Foil" },
          { name: "isTeamLogo", label: "Team Logo" },
          { name: "isTeamPhoto", label: "Team Photo" },
          { name: "isSpecial", label: "Special" },
        ].map(({ name, label }) => (
          <label key={name} className="flex items-center gap-2 text-sm text-panini-gray cursor-pointer">
            <input
              type="checkbox"
              name={name}
              value="true"
              className="accent-panini-gold"
              onChange={(e) => {
                const hidden = document.querySelector(`input[name="${name}"][type="hidden"]`);
                if (hidden) (hidden as HTMLInputElement).value = e.target.checked ? "true" : "false";
              }}
            />
            {label}
          </label>
        ))}
      </div>
      <input type="hidden" name="isFoil" value="false" />
      <input type="hidden" name="isTeamLogo" value="false" />
      <input type="hidden" name="isTeamPhoto" value="false" />
      <input type="hidden" name="isSpecial" value="false" />

      <div>
        <label className="block text-xs text-panini-gray mb-1">Player Photo (optional)</label>
        <input
          type="file"
          name="image"
          accept="image/*"
          className="w-full text-sm text-panini-gray file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-panini-blue/40 file:text-panini-white file:text-xs hover:file:bg-panini-blue/60 cursor-pointer"
        />
      </div>

      {error && (
        <p className="text-panini-red text-sm bg-panini-red/10 border border-panini-red/30 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      <Button type="submit" variant="primary" size="lg" disabled={isPending} className="w-full">
        {isPending ? "Adding…" : "Add Sticker"}
      </Button>
    </form>
  );
}
