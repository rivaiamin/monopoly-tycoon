import React, { useEffect, useRef } from "react";
import { ScrollText } from "lucide-react";

interface EventLogProps {
  log: string[];
}

export default function EventLog({ log }: EventLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  return (
    <div className="flex flex-col rounded-xl border border-neutral-800 bg-neutral-900/80 overflow-hidden max-h-[220px] sm:max-h-[250px] min-h-0">
      <div className="bg-neutral-800/90 px-3 py-2 text-[10px] font-bold text-neutral-400 tracking-widest uppercase flex items-center gap-2 border-b border-neutral-700 shrink-0">
        <ScrollText className="w-3.5 h-3.5" />
        Quest Log
      </div>
      <div ref={scrollRef} className="p-3 overflow-y-auto flex-1 font-mono text-xs space-y-2 min-h-0">
        {log.map((entry, i) => (
          <div
            key={i}
            className="text-neutral-300 pb-2 border-b border-neutral-800/60 last:border-0 last:pb-0"
          >
            <span className="text-neutral-600 mr-2">{">"}</span>
            {entry}
          </div>
        ))}
        {log.length === 0 && (
          <div className="text-neutral-600 italic text-[11px]">No events yet...</div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
