import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
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
  onSpaceClick?: (spaceIndex: number) => void;
}

function spaceCode(s: Space, index: number): string {
  const letters = (s.name || "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
  const a = letters[0] ?? "X";
  const b = letters[Math.min(letters.length - 1, 2)] ?? "Y";
  const n = String((index % 90) + 10);
  return `${a}${b}-${n}`;
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
  onSpaceClick,
}: BoardCarouselProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [slotPx, setSlotPx] = useState(120);
  const [panTiles, setPanTiles] = useState(0);
  const [dragPx, setDragPx] = useState(0);
  const dragPxRef = useRef(0);
  const dragStateRef = useRef<{ active: boolean; startX: number } | null>(null);
  const ignoreClickRef = useRef(false);

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

  const effectiveCenter = useMemo(() => {
    const dragTiles = slotPx > 0 ? -dragPx / slotPx : 0;
    return centerSmooth + panTiles + dragTiles;
  }, [centerSmooth, panTiles, dragPx, slotPx]);

  const base = Math.floor(effectiveCenter);
  const frac = Math.min(1, Math.max(0, effectiveCenter - base));
  const slidePx = frac * slotPx;

  const commitDragToTiles = (finalDragPx: number) => {
    if (slotPx <= 0) return;
    const deltaTiles = Math.round(-finalDragPx / slotPx);
    if (deltaTiles !== 0) setPanTiles((t) => t + deltaTiles);
    dragPxRef.current = 0;
    setDragPx(0);
  };

  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = { active: true, startX: e.clientX };
    ignoreClickRef.current = false;
    setDragPx(0);
  };

  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const st = dragStateRef.current;
    if (!st?.active) return;
    const dx = e.clientX - st.startX;
    if (Math.abs(dx) > 6) ignoreClickRef.current = true;
    dragPxRef.current = dx;
    setDragPx(dx);
  };

  const onPointerUp: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const st = dragStateRef.current;
    if (!st?.active) return;
    dragStateRef.current = null;
    commitDragToTiles(dragPxRef.current);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // no-op
    }
  };

  const onPointerCancel: React.PointerEventHandler<HTMLDivElement> = () => {
    dragStateRef.current = null;
    commitDragToTiles(dragPxRef.current);
  };

  return (
    <section
      className="relative w-full h-56 sm:h-64 overflow-hidden bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-center shadow-2xl shrink-0"
      tabIndex={0}
      aria-label="Board map carousel"
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          setPanTiles((t) => t - 1);
        }
        if (e.key === "ArrowRight") {
          e.preventDefault();
          setPanTiles((t) => t + 1);
        }
        if (e.key === "Escape") {
          setPanTiles(0);
          setDragPx(0);
        }
      }}
    >
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

      <button
        type="button"
        aria-label="Previous tiles"
        onClick={() => setPanTiles((t) => t - 1)}
        className={cn(
          "absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-30",
          "w-9 h-9 rounded-full border border-white/10 bg-black/35 backdrop-blur-sm",
          "text-white/90 hover:bg-black/55 hover:border-white/20",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/80",
          "transition"
        )}
      >
        <span aria-hidden="true">‹</span>
      </button>

      <button
        type="button"
        aria-label="Next tiles"
        onClick={() => setPanTiles((t) => t + 1)}
        className={cn(
          "absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-30",
          "w-9 h-9 rounded-full border border-white/10 bg-black/35 backdrop-blur-sm",
          "text-white/90 hover:bg-black/55 hover:border-white/20",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/80",
          "transition"
        )}
      >
        <span aria-hidden="true">›</span>
      </button>

      {panTiles !== 0 && (
        <button
          type="button"
          aria-label="Recenter map view"
          onClick={() => setPanTiles(0)}
          className={cn(
            "absolute top-2 left-1/2 -translate-x-1/2 z-30",
            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
            "bg-black/35 border border-white/10 text-white/80 hover:bg-black/55 hover:text-white/95",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/80",
            "transition"
          )}
        >
          Recenter
        </button>
      )}

      <div
        className="w-full overflow-hidden flex justify-center h-full px-2 pt-5 touch-pan-y select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
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
                  "bg-neutral-800 overflow-hidden",
                  onSpaceClick && "cursor-pointer"
                )}
                role={onSpaceClick ? "button" : undefined}
                tabIndex={onSpaceClick ? 0 : undefined}
                onClick={() => {
                  if (!onSpaceClick) return;
                  if (ignoreClickRef.current) {
                    ignoreClickRef.current = false;
                    return;
                  }
                  onSpaceClick(safeIndex);
                }}
                onKeyDown={(e) => {
                  if (!onSpaceClick) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSpaceClick(safeIndex);
                  }
                }}
              >
                <div
                  className={cn(
                    "h-7 sm:h-8 w-full flex items-center justify-center relative overflow-hidden",
                    spaceHeaderClass(s)
                  )}
                >
                  <img
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover opacity-40"
                    loading="lazy"
                    decoding="async"
                    src={`https://picsum.photos/seed/${encodeURIComponent(
                      `${s.type}-${safeIndex}-${s.name}`
                    )}/200/300`}
                  />
                  <div className="absolute inset-0 bg-linear-to-b from-black/20 to-black/40" />

                  <div className="absolute left-1 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-black/35 border border-white/10 text-[8px] sm:text-[9px] font-mono text-white/90 tracking-wider">
                    {spaceCode(s, safeIndex)}
                  </div>
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
                            ring,
                            isMe && "ring-2 ring-white/90 ring-offset-1 ring-offset-neutral-800 z-10 scale-110"
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
