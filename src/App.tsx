import React, { useEffect, useState } from "react";
import client from "./game/client";
import { Room } from "colyseus.js";
import { GameState } from "./game/schema";
import Lobby from "./components/Lobby";
import GameBoard from "./components/GameBoard";
import { motion, AnimatePresence } from "motion/react";
import { getOrCreateClientId } from "./lib/playerSession";

const STORAGE_KEYS = {
  roomId: "ptycoon:roomId",
  reconnectionToken: "ptycoon:reconnectionToken",
  name: "ptycoon:name",
  token: "ptycoon:token",
} as const;

const RECONNECT_ATTEMPTS = 4;
const RECONNECT_DELAY_MS = 250;
const JOIN_FALLBACK_DELAY_MS = 350;

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function reconnectWithRetries(reconnectionToken: string): Promise<Room<GameState>> {
  let lastErr: unknown;
  for (let i = 0; i < RECONNECT_ATTEMPTS; i++) {
    try {
      return await client.reconnect<GameState>(reconnectionToken);
    } catch (e) {
      lastErr = e;
      if (i < RECONNECT_ATTEMPTS - 1) await delay(RECONNECT_DELAY_MS);
    }
  }
  throw lastErr;
}

function persistRoomSession(room: Room<GameState>) {
  localStorage.setItem(STORAGE_KEYS.roomId, room.roomId);
  localStorage.setItem(STORAGE_KEYS.reconnectionToken, room.reconnectionToken);
}

export default function App() {
  const [room, setRoom] = useState<Room<GameState> | null>(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      const clientId = getOrCreateClientId();
      try {
        const reconnectionToken = localStorage.getItem(STORAGE_KEYS.reconnectionToken);
        if (reconnectionToken) {
          try {
            const restoredRoom = await reconnectWithRetries(reconnectionToken);
            if (cancelled) {
              // Must not use leave(true) — that consents and removes the player from the room.
              // Strict Mode runs this effect twice in dev; the first completion would kill the session for the second attempt.
              void restoredRoom.leave(false);
              return;
            }
            persistRoomSession(restoredRoom);
            setRoom(restoredRoom);
            return;
          } catch {
            // Do not drop token yet — allowReconnection may still be settling; try joinById after a short delay.
          }
        }

        // Same browser session: re-enter by room id after reconnect failed or token missing (offline seat).
        const roomId = localStorage.getItem(STORAGE_KEYS.roomId);
        const name = localStorage.getItem(STORAGE_KEYS.name);
        const token = localStorage.getItem(STORAGE_KEYS.token);
        if (roomId && name && token) {
          await delay(JOIN_FALLBACK_DELAY_MS);
          if (cancelled) return;
          try {
            const resumed = await client.joinById<GameState>(roomId, { name, token, clientId });
            if (cancelled) {
              void resumed.leave(false);
              return;
            }
            persistRoomSession(resumed);
            setRoom(resumed);
          } catch {
            // Room ended or resume rejected — clear stale reconnect token so the next load does not loop.
            localStorage.removeItem(STORAGE_KEYS.reconnectionToken);
          }
        } else if (reconnectionToken) {
          // Had a token but no room/name/token to fall back — token is useless.
          localStorage.removeItem(STORAGE_KEYS.reconnectionToken);
        }
      } finally {
        if (!cancelled) setRestoring(false);
      }
    };

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const joinGame = async (name: string, token: string, roomId?: string) => {
    try {
      const clientId = getOrCreateClientId();
      const joinedRoom = roomId?.trim()
        ? await client.joinById<GameState>(roomId.trim(), { name, token, clientId })
        : await client.joinOrCreate<GameState>("property_tycoon", { name, token, clientId });

      persistRoomSession(joinedRoom);
      localStorage.setItem(STORAGE_KEYS.name, name);
      localStorage.setItem(STORAGE_KEYS.token, token);

      setRoom(joinedRoom);
    } catch (e: unknown) {
      console.error("Join error details:", e);
      const errorMsg =
        e instanceof Error ? e.message : typeof e === "string" ? e : JSON.stringify(e);
      alert(`Failed to join game: ${errorMsg}`);
    }
  };

  const leaveGame = () => {
    room?.send("leave_game");
    room?.leave(true);
    setRoom(null);
    localStorage.removeItem(STORAGE_KEYS.roomId);
    localStorage.removeItem(STORAGE_KEYS.reconnectionToken);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-orange-500/30">
      <AnimatePresence mode="wait">
        {!room ? (
          <motion.div
            key="lobby"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center justify-center min-h-screen p-4"
          >
            {restoring ? (
              <div className="text-zinc-400 text-sm">Restoring your game…</div>
            ) : (
              <Lobby onJoin={joinGame} />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-dvh flex flex-col overflow-hidden"
          >
            <GameBoard room={room} onLeave={leaveGame} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
