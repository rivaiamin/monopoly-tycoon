import React, { useState } from "react";
import { ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { cn } from "../lib/utils";

export default function RulesPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/50">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200"
      >
        <span className="flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Quick rules
        </span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <ul
          className={cn(
            "px-3 pb-3 text-[11px] text-zinc-500 space-y-1.5 leading-relaxed border-t border-zinc-800/80 pt-2"
          )}
        >
          <li>Roll two dice, move clockwise; passing GO pays $200.</li>
          <li>Three doubles in one turn sends you to Jail.</li>
          <li>Buy unowned properties or send them to auction.</li>
          <li>Monopoly (full color set): double rent on empty lots; then build houses evenly.</li>
          <li>Railroads scale with how many you own; utilities use 4× or 10× a rent dice roll.</li>
          <li>Chance / Community Chest are drawn from shuffled decks.</li>
          <li>Bankrupt players are eliminated; last player standing wins.</li>
        </ul>
      )}
    </div>
  );
}
