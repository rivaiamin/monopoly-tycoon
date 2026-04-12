import React from "react";
import { Player, Space } from "../game/schema";
import { cn } from "../lib/utils";
import { GROUP_COLORS, TOKEN_ICONS } from "../lib/boardTheme";
import { Car, Coins, CheckCircle2 } from "lucide-react";

const STARTING_GOLD = 1500;

interface PlayerListProps {
  players: Player[];
  board: Space[];
  currentTurnId: string;
  myId: string;
}

function inventorySwatchesForPlayer(board: Space[], sessionId: string) {
  return board.filter(
    (s) => s.ownerId === sessionId && ["property", "railroad", "utility"].includes(s.type)
  );
}

function swatchClass(s: Space): string {
  if (s.type === "property" && s.groupId && GROUP_COLORS[s.groupId]) {
    return GROUP_COLORS[s.groupId];
  }
  if (s.type === "railroad") return "bg-zinc-600";
  if (s.type === "utility") return "bg-slate-400";
  return "bg-neutral-800";
}

export default function PlayerList({ players, board, currentTurnId, myId }: PlayerListProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500 px-1">
        Party
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {players.map((player) => {
          const Icon = TOKEN_ICONS[player.token] || Car;
          const isTurn = currentTurnId === player.sessionId;
          const owned = inventorySwatchesForPlayer(board, player.sessionId);
          const goldPct = player.isBankrupt
            ? 0
            : Math.min(100, (player.balance / STARTING_GOLD) * 100);

          return (
            <div
              key={player.sessionId}
              className={cn(
                "rounded-xl border p-3 flex flex-col gap-2.5 transition-colors duration-300",
                isTurn
                  ? "border-amber-500/70 bg-neutral-900/90 shadow-[0_0_18px_rgba(245,158,11,0.12)]"
                  : "border-neutral-800 bg-neutral-950/80 opacity-90"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "p-2.5 rounded-lg shrink-0 text-white",
                    player.sessionId === myId ? "bg-orange-600" : "bg-neutral-700"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        "font-bold uppercase tracking-wide text-sm truncate",
                        player.isBankrupt && "line-through text-neutral-600"
                      )}
                    >
                      {player.name}
                    </span>
                    {player.sessionId === myId && (
                      <span className="text-[9px] text-amber-600/90 font-semibold">You</span>
                    )}
                    {player.isReady && !currentTurnId && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    )}
                    {player.inJail && (
                      <span className="text-[9px] uppercase text-amber-600 font-bold">Jail</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-amber-400 font-mono text-xs mt-0.5">
                    <Coins className="w-3.5 h-3.5 shrink-0" />
                    {player.isBankrupt ? "—" : `${player.balance} G`}
                  </div>
                </div>
                {isTurn && (
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                )}
              </div>

              <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${goldPct}%` }}
                />
              </div>

              <div className="flex flex-wrap gap-1 min-h-5 items-center">
                {owned.length === 0 && (
                  <span className="text-[10px] text-neutral-600 italic">No properties</span>
                )}
                {owned.map((s) => (
                  <div
                    key={s.index}
                    className={cn("w-3 h-3 rounded-sm border border-neutral-700/80", swatchClass(s))}
                    title={s.name}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
