import React, { useEffect, useMemo, useState } from "react";
import { Room } from "colyseus.js";
import { GameState, Player, Space } from "../game/schema";
import { cn, copyTextToClipboard } from "../lib/utils";
import PlayerList from "./PlayerList";
import EventLog from "./EventLog";
import ActionBar from "./ActionBar";
import RulesPanel from "./RulesPanel";
import DiceRoller from "./DiceRoller";
import { useVisualPawnPositions } from "../hooks/useVisualPawnPositions";
import { useGameLogToasts } from "../hooks/useGameLogToasts";
import { motion } from "motion/react";
import { Car, Plane, Ship, Anchor, Copy, Check } from "lucide-react";

interface GameBoardProps {
  room: Room<GameState>;
  onLeave: () => void;
}

const TOKEN_ICONS: Record<string, any> = {
  car: Car,
  plane: Plane,
  ship: Ship,
  anchor: Anchor,
};

const GROUP_COLORS: Record<string, string> = {
  brown: "bg-amber-900",
  lightBlue: "bg-sky-400",
  pink: "bg-pink-500",
  orange: "bg-orange-500",
  red: "bg-red-600",
  yellow: "bg-yellow-400",
  green: "bg-green-600",
  darkBlue: "bg-blue-800",
};

export default function GameBoard({ room, onLeave }: GameBoardProps) {
  const [copied, setCopied] = useState(false);
  // Room state can be applied before this effect runs (WebSocket messages are synchronous).
  // Subscribing only in useEffect misses that first ROOM_STATE and leaves state stuck null.
  const [state, setState] = useState<GameState | null>(() =>
    room.state ? room.state.clone() : null
  );

  useEffect(() => {
    const handler = (newState: GameState) => {
      setState(newState.clone());
    };
    room.onStateChange(handler);
    if (room.state) {
      setState(room.state.clone());
    }
    return () => room.onStateChange.remove(handler);
  }, [room]);

  const playersList = useMemo(
    () => (state ? (Array.from(state.players.values()) as Player[]) : []),
    [state]
  );
  const playerPositions = useMemo(
    () => playersList.map((p) => ({ sessionId: p.sessionId, position: p.position })),
    [playersList]
  );
  const visualPositions = useVisualPawnPositions(playerPositions);
  useGameLogToasts(state ? Array.from(state.log) : []);

  if (!state) return null;

  const currentPlayer = state.players.get(room.sessionId);
  const isMyTurn = state.currentTurnId === room.sessionId;

  // Map spaces to grid positions (11x11 grid)
  // Bottom row: 10 to 0 (left to right)
  // Left column: 11 to 19 (bottom to top)
  // Top row: 20 to 30 (left to right)
  // Right column: 31 to 39 (top to bottom)
  
  const getGridArea = (index: number) => {
    if (index >= 0 && index <= 10) return `${11} / ${11 - index}`;
    if (index >= 11 && index <= 19) return `${11 - (index - 10)} / ${1}`;
    if (index >= 20 && index <= 30) return `${1} / ${index - 19}`;
    if (index >= 31 && index <= 39) return `${index - 29} / ${11}`;
    return "";
  };

  const copyRoomCode = async () => {
    const code = String(state.roomCode || room.roomId);
    const ok = await copyTextToClipboard(code);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-dvh overflow-hidden bg-zinc-950">
      {/* Main Board Area */}
      <div className="flex-1 flex items-center justify-center p-2 md:p-4 relative min-h-0 min-w-0">
        <div className="grid grid-cols-11 grid-rows-11 gap-0.5 md:gap-1 bg-zinc-800 p-0.5 md:p-1 rounded-lg shadow-2xl aspect-square w-[min(92vw,85vh)] max-w-full max-h-[85vh] md:max-h-[min(90vh,90vw)]">
          {/* Center Area */}
          <div className="col-start-2 col-end-11 row-start-2 row-end-11 bg-zinc-900 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 w-[150%] h-20 bg-orange-500" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45 w-[150%] h-20 bg-orange-500" />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-zinc-800 select-none text-center leading-none">
              PROPERTY
              <br />
              TYCOON
            </h1>

            {state.gameStarted && !state.gameOver && state.diceRollSeq > 0 && (
              <div className="mt-4 z-10">
                <DiceRoller
                  die1={state.lastDie1}
                  die2={state.lastDie2}
                  rollSeq={state.diceRollSeq}
                />
              </div>
            )}

            {!state.gameStarted && (
              <div className="mt-8 text-center z-10">
                <p className="text-zinc-400 mb-4">Waiting for players to be ready...</p>
                <button
                  onClick={() => room.send("ready", { ready: !currentPlayer?.isReady })}
                  className={cn(
                    "px-8 py-3 rounded-xl font-bold transition-all",
                    currentPlayer?.isReady 
                      ? "bg-zinc-800 text-zinc-400" 
                      : "bg-orange-600 text-white hover:bg-orange-500"
                  )}
                >
                  {currentPlayer?.isReady ? "CANCEL READY" : "I'M READY"}
                </button>
              </div>
            )}
          </div>

          {/* Spaces */}
          {Array.from(state.board).map((space: any, i) => {
            const s = space as Space;
            const owner = s.ownerId ? state.players.get(s.ownerId) as Player : null;
            return (
              <div
                key={i}
                className={cn(
                  "bg-zinc-900 border border-zinc-800 flex flex-col relative overflow-hidden",
                  s.type === 'go' || s.type === 'jail' || s.type === 'parking' || s.type === 'go_to_jail' 
                    ? "items-center justify-center" 
                    : ""
                )}
                style={{ gridArea: getGridArea(i) }}
              >
                {/* Color Group Header */}
                {s.type === 'property' && (
                  <div className={cn("h-1/4 w-full", GROUP_COLORS[s.groupId])} />
                )}

                {/* Space Content */}
                <div className="flex-1 p-1 flex flex-col items-center justify-between text-center">
                  <span className="text-[8px] font-bold leading-tight uppercase text-zinc-300">
                    {s.name}
                    {s.isMortgaged && <span className="text-red-500"> (M)</span>}
                  </span>
                  
                  {s.price > 0 && s.ownerId === "" && (
                    <span className="text-[8px] font-mono text-zinc-500">${s.price}</span>
                  )}

                  {owner && (
                    <div className="absolute bottom-1 right-1 flex items-center gap-0.5">
                      {s.type === "property" && s.houseCount > 0 && (
                        <span className="text-[7px] font-mono text-green-400 leading-none">
                          {s.houseCount === 5 ? "H" : "×".repeat(s.houseCount)}
                        </span>
                      )}
                      <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.5)]" />
                    </div>
                  )}
                </div>

                {/* Tokens on this space */}
                <div className="absolute inset-0 pointer-events-none flex flex-wrap items-center justify-center gap-0.5 p-1">
                  {playersList
                    .filter((p) => (visualPositions[p.sessionId] ?? p.position) === i)
                    .map((p) => {
                      const player = p;
                      const Icon = TOKEN_ICONS[player.token] || Car;
                      return (
                        <motion.div
                          key={player.sessionId}
                          layoutId={player.sessionId}
                          className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center shadow-lg border-2",
                            player.sessionId === room.sessionId ? "bg-orange-500 border-white" : "bg-zinc-100 border-zinc-400 text-zinc-900"
                          )}
                        >
                          <Icon className="w-3 h-3" />
                        </motion.div>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-full md:w-80 md:border-l border-zinc-800 flex flex-col bg-zinc-900/50 backdrop-blur-xl max-h-[48vh] md:max-h-none shrink-0 md:shrink">
        <div className="p-4 md:p-6 border-b border-zinc-800 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold tracking-tight text-sm md:text-base">GAME STATUS</h2>
            <button type="button" onClick={onLeave} className="text-xs text-zinc-500 hover:text-zinc-300 shrink-0">
              Leave
            </button>
          </div>
          <button
            type="button"
            onClick={copyRoomCode}
            className="flex items-center justify-between gap-2 text-left text-xs bg-zinc-950/80 border border-zinc-800 rounded-lg px-3 py-2 hover:border-zinc-600 transition-colors"
          >
            <span className="text-zinc-500">Room</span>
            <span className="font-mono text-orange-400 truncate">{state.roomCode || room.roomId}</span>
            {copied ? <Check className="w-3.5 h-3.5 text-green-500 shrink-0" /> : <Copy className="w-3.5 h-3.5 text-zinc-500 shrink-0" />}
          </button>
          {state.freeParkingJackpot && state.freeParkingPot > 0 && (
            <p className="text-[10px] text-zinc-500">
              Free Parking pot: <span className="font-mono text-emerald-400">${state.freeParkingPot}</span>
            </p>
          )}
        </div>

        {state.lastCardText && (
          <div className="px-4 py-2 border-b border-zinc-800/80 bg-violet-950/30">
            <p className="text-[10px] uppercase tracking-wider text-violet-400 mb-1">Last card</p>
            <p className="text-xs text-zinc-200 leading-snug">{state.lastCardText}</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          <RulesPanel />
          <PlayerList players={Array.from(state.players.values())} currentTurnId={state.currentTurnId} myId={room.sessionId} />
          <EventLog log={Array.from(state.log)} />
        </div>

        <div className="p-4 bg-zinc-900 border-t border-zinc-800">
          <ActionBar room={room} state={state} currentPlayer={currentPlayer} isMyTurn={isMyTurn} />
        </div>
      </div>
    </div>
  );
}
