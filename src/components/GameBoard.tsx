import React, { useEffect, useMemo, useRef, useState } from "react";
import { Room } from "colyseus.js";
import { GameState, Player, Space } from "../game/schema";
import { cn, copyTextToClipboard } from "../lib/utils";
import PlayerList from "./PlayerList";
import EventLog from "./EventLog";
import ActionBar from "./ActionBar";
import RulesPanel from "./RulesPanel";
import DiceRoller from "./DiceRoller";
import BoardCarousel from "./BoardCarousel";
import { useVisualPawnPositions } from "../hooks/useVisualPawnPositions";
import { useSmoothCarouselCenter } from "../hooks/useSmoothCarouselCenter";
import { useGameLogToasts } from "../hooks/useGameLogToasts";
import { Car, Copy, Check, Shield } from "lucide-react";
import { TOKEN_ICONS } from "../lib/boardTheme";

interface GameBoardProps {
  room: Room<GameState>;
  onLeave: () => void;
}

export default function GameBoard({ room, onLeave }: GameBoardProps) {
  const [copied, setCopied] = useState(false);
  const [passGoFlash, setPassGoFlash] = useState(false);
  const prevTurnVisualRef = useRef<number | null>(null);
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
  const currentTurnPlayer = state.currentTurnId
    ? state.players.get(state.currentTurnId)
    : undefined;

  const rawCarouselStep = useMemo(() => {
    if (currentTurnPlayer && state.gameStarted && !state.gameOver) {
      return visualPositions[currentTurnPlayer.sessionId] ?? currentTurnPlayer.position;
    }
    return currentTurnPlayer?.position ?? playersList[0]?.position ?? 0;
  }, [
    currentTurnPlayer,
    state.gameStarted,
    state.gameOver,
    visualPositions,
    playersList,
  ]);
  const smoothCarouselEnabled = !!(
    currentTurnPlayer &&
    state.gameStarted &&
    !state.gameOver
  );
  const centerSmooth = useSmoothCarouselCenter(rawCarouselStep, smoothCarouselEnabled);
  const isMarching =
    !!currentTurnPlayer &&
    state.gameStarted &&
    !state.gameOver &&
    (visualPositions[currentTurnPlayer.sessionId] ?? currentTurnPlayer.position) !==
      currentTurnPlayer.position;

  useEffect(() => {
    prevTurnVisualRef.current = null;
  }, [state.currentTurnId]);

  useEffect(() => {
    if (!state.gameStarted || !currentTurnPlayer || state.gameOver) {
      setPassGoFlash(false);
      return;
    }
    const v =
      visualPositions[currentTurnPlayer.sessionId] ?? currentTurnPlayer.position;
    const prev = prevTurnVisualRef.current;
    if (prev !== null && prev === 39 && v === 0) {
      setPassGoFlash(true);
      const t = window.setTimeout(() => setPassGoFlash(false), 2200);
      prevTurnVisualRef.current = v;
      return () => clearTimeout(t);
    }
    prevTurnVisualRef.current = v;
  }, [visualPositions, currentTurnPlayer, state.gameStarted, state.gameOver]);

  const copyRoomCode = async () => {
    const code = String(state.roomCode || room.roomId);
    const ok = await copyTextToClipboard(code);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const TurnIcon = currentTurnPlayer
    ? TOKEN_ICONS[currentTurnPlayer.token] || Car
    : Car;

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-neutral-950 text-neutral-100 font-sans">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 px-4 py-3 shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-wider text-amber-500 uppercase flex items-center gap-2">
            <Shield className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" />
            Guild Tycoon
          </h1>
          <p className="text-neutral-500 text-xs sm:text-sm mt-0.5">Multiplayer property game</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {state.gameStarted && !state.gameOver && currentTurnPlayer && (
            <div
              className={cn(
                "px-3 sm:px-4 py-1.5 rounded-full border-2 font-bold uppercase tracking-wide text-xs sm:text-sm flex items-center gap-2",
                "border-amber-500/80 bg-amber-950/40 text-amber-100"
              )}
            >
              <TurnIcon className="w-4 h-4 shrink-0" />
              <span className="truncate max-w-40 sm:max-w-none">{currentTurnPlayer.name}&apos;s Turn</span>
            </div>
          )}

          <button
            type="button"
            onClick={copyRoomCode}
            className="flex items-center gap-2 text-xs bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 hover:border-neutral-600 transition-colors max-w-[200px]"
          >
            <span className="text-neutral-500 shrink-0">Room</span>
            <span className="font-mono text-amber-400 truncate">{state.roomCode || room.roomId}</span>
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
            )}
          </button>

          <button
            type="button"
            onClick={onLeave}
            className="text-xs text-neutral-500 hover:text-neutral-300 px-2 py-1"
          >
            Leave
          </button>
        </div>
      </header>

      <div className="px-4 pt-3 shrink-0">
        <BoardCarousel
          board={Array.from(state.board) as Space[]}
          players={playersList}
          visualPositions={visualPositions}
          centerSmooth={centerSmooth}
          mySessionId={room.sessionId}
          isMarching={isMarching}
          passGoFlash={passGoFlash}
        />
      </div>

      <div className="flex flex-col lg:flex-row flex-1 min-h-0 gap-4 p-4 pt-3">
        <div className="flex-1 min-h-0 overflow-y-auto min-w-0">
          <PlayerList
            players={playersList}
            board={Array.from(state.board) as Space[]}
            currentTurnId={state.currentTurnId}
            myId={room.sessionId}
          />
        </div>

        <div className="w-full lg:w-[min(100%,380px)] lg:shrink-0 flex flex-col gap-3 min-h-0 overflow-y-auto">
          {state.freeParkingJackpot && state.freeParkingPot > 0 && (
            <p className="text-[10px] text-neutral-500 px-1">
              Free Parking pot: <span className="font-mono text-emerald-400">${state.freeParkingPot}</span>
            </p>
          )}

          {state.lastCardText && (
            <div className="rounded-xl border border-violet-900/50 bg-violet-950/30 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-violet-400 mb-1">Last card</p>
              <p className="text-xs text-neutral-200 leading-snug">{state.lastCardText}</p>
            </div>
          )}

          {state.gameStarted && !state.gameOver && state.diceRollSeq > 0 && (
            <div className="flex justify-center py-2">
              <DiceRoller
                die1={state.lastDie1}
                die2={state.lastDie2}
                rollSeq={state.diceRollSeq}
              />
            </div>
          )}

          {!state.gameStarted && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-4 text-center space-y-3">
              <p className="text-sm text-neutral-400">Waiting for players to be ready...</p>
              <button
                type="button"
                onClick={() => room.send("ready", { ready: !currentPlayer?.isReady })}
                className={cn(
                  "w-full py-3 rounded-xl font-bold transition-all",
                  currentPlayer?.isReady
                    ? "bg-neutral-800 text-neutral-400"
                    : "bg-amber-600 text-white hover:bg-amber-500"
                )}
              >
                {currentPlayer?.isReady ? "Cancel ready" : "I'm ready"}
              </button>
            </div>
          )}

          <RulesPanel />
          <EventLog log={Array.from(state.log)} />
          <div className="shrink-0">
            <ActionBar room={room} state={state} currentPlayer={currentPlayer} isMyTurn={isMyTurn} />
          </div>
        </div>
      </div>
    </div>
  );
}
