"use client";

import { useMemo } from "react";
import { COUNTRY_FLAGS, COUNTRY_NAMES, TEAM_CODES } from "@/lib/constants";

interface TeamFilterProps {
  selected: string | null;
  onChange: (code: string | null) => void;
  sortMode?: "album" | "alpha";
}

export function TeamFilter({ selected, onChange, sortMode = "album" }: TeamFilterProps) {
  const teamCodes = useMemo(() => {
    if (sortMode === "alpha") {
      return [...TEAM_CODES].sort((a, b) => a.localeCompare(b));
    }
    return TEAM_CODES;
  }, [sortMode]);

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
      <button
        onClick={() => onChange(null)}
        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
          selected === null
            ? "bg-panini-gold text-panini-navy"
            : "bg-panini-blue/20 text-panini-gray hover:text-panini-white hover:bg-panini-blue/40"
        }`}
      >
        All Teams
      </button>
      <button
        onClick={() => onChange("FWC")}
        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
          selected === "FWC"
            ? "bg-panini-gold text-panini-navy"
            : "bg-panini-blue/20 text-panini-gray hover:text-panini-white hover:bg-panini-blue/40"
        }`}
      >
        🏆 Special
      </button>
      {teamCodes.map((code) => (
        <button
          key={code}
          onClick={() => onChange(code)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
            selected === code
              ? "bg-panini-gold text-panini-navy"
              : "bg-panini-blue/20 text-panini-gray hover:text-panini-white hover:bg-panini-blue/40"
          }`}
        >
          {COUNTRY_FLAGS[code]} {COUNTRY_NAMES[code] ?? code}
        </button>
      ))}
    </div>
  );
}
