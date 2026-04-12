import React, { useEffect, useRef } from "react";

interface EventLogProps {
  log: string[];
}

export default function EventLog({ log }: EventLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [log]);

  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 px-2">Game Log</h3>
      <div 
        ref={scrollRef}
        className="h-48 bg-zinc-950 border border-zinc-800 rounded-xl p-3 overflow-y-auto space-y-2 scrollbar-hide"
      >
        {log.map((entry, i) => (
          <div key={i} className="text-[11px] leading-relaxed text-zinc-400 border-l-2 border-zinc-800 pl-2">
            {entry}
          </div>
        ))}
        {log.length === 0 && (
          <div className="text-[11px] text-zinc-600 italic">No events yet...</div>
        )}
      </div>
    </div>
  );
}
