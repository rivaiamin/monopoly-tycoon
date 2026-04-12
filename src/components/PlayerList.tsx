import React from "react";
import { Player } from "../game/schema";
import { cn } from "../lib/utils";
import { Wallet, User as UserIcon, CheckCircle2 } from "lucide-react";

interface PlayerListProps {
  players: Player[];
  currentTurnId: string;
  myId: string;
}

export default function PlayerList({ players, currentTurnId, myId }: PlayerListProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 px-2">Players</h3>
      <div className="space-y-2">
        {players.map((player) => (
          <div
            key={player.sessionId}
            className={cn(
              "p-3 rounded-xl border transition-all flex items-center gap-3",
              currentTurnId === player.sessionId
                ? "bg-orange-500/10 border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.1)]"
                : "bg-zinc-950 border-zinc-800"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
              player.sessionId === myId ? "bg-orange-600" : "bg-zinc-800"
            )}>
              <UserIcon className="w-5 h-5 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "font-bold truncate text-sm",
                    player.isBankrupt && "line-through text-zinc-600"
                  )}
                >
                  {player.name}
                </span>
                {player.isReady && !currentTurnId && (
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                )}
                {player.inJail && (
                  <span className="text-[9px] uppercase text-amber-600 font-bold">Jail</span>
                )}
              </div>
              <div className="flex items-center gap-1 text-zinc-400">
                <Wallet className="w-3 h-3" />
                <span className="text-xs font-mono">
                  {player.isBankrupt ? "—" : `$${player.balance}`}
                </span>
              </div>
            </div>

            {currentTurnId === player.sessionId && (
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
