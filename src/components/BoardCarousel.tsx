import React, { useLayoutEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Car } from "lucide-react";
import { Player, Space } from "../game/schema";
import { cn } from "../lib/utils";
import { GROUP_COLORS, TOKEN_ICONS, TOKEN_ACCENT_BG, TOKEN_PAWN_RING } from "../lib/boardTheme";

const BOARD_LEN = 40;
const WINDOW = [-3, -2, -1, 0, 1, 2, 3] as const;

interface BoardCarouselProps {
  board: Space[];
  players: Player[];
  visualPositions: Record<string, number>;
  /** Fractional ring position (unwrapped past GO); tiles + slide follow this. */
  centerSmooth: number;
  mySessionId: string;
  /** Current turn player’s pawn is still stepping toward server position. */
  isMarching?: boolean;
  /** Brief highlight when the animated path crosses GO (39 → 0). */
  passGoFlash?: boolean;
}

function spaceHeaderClass(s: Space): string {
  if (s.type === "property" && s.groupId && GROUP_COLORS[s.groupId]) {
    return GROUP_COLORS[s.groupId];
  }
  if (s.type === "railroad") return "bg-zinc-700";
  if (s.type === "utility") return "bg-slate-400";
  if (s.type === "chance") return "bg-purple-300/90";
  if (s.type === "chest") return "bg-blue-300/90";
  if (s.type === "tax") return "bg-red-300/80";
  return "bg-zinc-600";
}

function ringIndex(floorUnwrapped: number, offset: number): number {
  return ((floorUnwrapped + offset) % BOARD_LEN + BOARD_LEN) % BOARD_LEN;
}

export default function BoardCarousel({
  board,
  players,
  visualPositions,
  centerSmooth,
  mySessionId,
  isMarching = false,
  passGoFlash = false,
}: BoardCarouselProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [slotPx, setSlotPx] = useState(120);

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    const measure = () => {
      const first = row.firstElementChild as HTMLElement | null;
      if (!first) return;
      const w = first.getBoundingClientRect().width;
      const cs = getComputedStyle(row);
      const gap = parseFloat(cs.columnGap || cs.gap || "16") || 16;
      setSlotPx(w + gap);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(row);
    return () => ro.disconnect();
  }, []);

  const base = Math.floor(centerSmooth);
  const frac = Math.min(1, Math.max(0, centerSmooth - base));
  const slidePx = frac * slotPx;

  return (
    <section className="relative w-full h-44 sm:h-48 overflow-hidden bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-center shadow-2xl shrink-0">
      <div className="absolute top-2 left-4 text-[10px] font-bold text-neutral-500 tracking-widest uppercase z-20">
        The Map
      </div>
      {isMarching && (
        <div className="absolute top-2 right-4 z-20 text-[10px] font-bold uppercase tracking-widest text-amber-400/95 flex items-center gap-1.5 animate-pulse">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
          Travelling…
        </div>
      )}
      {passGoFlash && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded-full bg-amber-500/95 text-neutral-950 text-[10px] font-bold uppercase tracking-wide shadow-lg ring-2 ring-amber-200/90">
          Passed GO — $200
        </div>
      )}

      <div className="w-full overflow-hidden flex justify-center px-2 pt-5">
        <div
          ref={rowRef}
          className="flex items-center gap-2 sm:gap-4 will-change-transform"
          style={{ transform: `translate3d(${-slidePx}px, 0, 0)` }}
        >
          {WINDOW.map((offset) => {
            const safeIndex = ringIndex(base, offset);
            const s = board[safeIndex] as Space;
            const isCenter = offset === 0;
            const owner = s.ownerId ? (players.find((p) => p.sessionId === s.ownerId) ?? null) : null;
            const ownerAccent = owner
              ? TOKEN_ACCENT_BG[owner.token] ?? "bg-amber-500"
              : null;

            const onSpace = players.filter(
              (p) => (visualPositions[p.sessionId] ?? p.position) === safeIndex
            );

            return (
              <div
                key={safeIndex}
                className={cn(
                  "relative shrink-0 w-22 sm:w-32 h-32 sm:h-36 rounded-lg flex flex-col transition-[transform,opacity,box-shadow,border-color] duration-500 ease-out",
                  isCenter
                    ? "scale-105 sm:scale-110 shadow-[0_0_20px_rgba(255,255,255,0.08)] z-10 border-2 border-amber-100/90"
                    : "opacity-50 scale-[0.88] sm:scale-90 border border-neutral-700",
                  "bg-neutral-800 overflow-hidden"
                )}
              >
                <div
                  className={cn("h-7 sm:h-8 w-full flex items-center justify-center relative", spaceHeaderClass(s))}
                >
                  {owner && (
                    <div
                      className={cn(
                        "w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm",
                        ownerAccent
                      )}
                      title={owner.name}
                    />
                  )}
                </div>

                <div className="flex-1 flex flex-col items-center justify-center p-1.5 text-center min-h-0">
                  <span className="text-[9px] sm:text-[10px] font-bold leading-tight text-neutral-100 line-clamp-3">
                    {s.name}
                    {s.isMortgaged && <span className="text-red-400"> (M)</span>}
                  </span>
                  {s.price > 0 && !s.ownerId && (
                    <span className="text-amber-400/90 text-[9px] font-mono mt-0.5">${s.price}</span>
                  )}
                  {owner && s.type === "property" && s.houseCount > 0 && (
                    <span className="text-[8px] font-mono text-emerald-400 mt-0.5">
                      {s.houseCount === 5 ? "Hotel" : `${s.houseCount}×`}
                    </span>
                  )}
                </div>

                {onSpace.length > 0 && (
                  <div className="absolute bottom-1.5 left-0 w-full flex justify-center gap-0.5 flex-wrap px-0.5">
                    {onSpace.map((p) => {
                      const Icon = TOKEN_ICONS[p.token] || Car;
                      const ring = TOKEN_PAWN_RING[p.token] ?? "bg-zinc-100 border-zinc-400 text-zinc-900";
                      const isMe = p.sessionId === mySessionId;
                      return (
                        <motion.div
                          key={p.sessionId}
                          layoutId={p.sessionId}
                          className={cn(
                            "p-0.5 sm:p-1 rounded-full shadow-md border-2",
                            isMe ? "bg-orange-500 border-white text-white" : ring
                          )}
                        >
                          <Icon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
