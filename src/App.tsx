import React, { useState } from "react";
import client from "./game/client";
import { Room } from "colyseus.js";
import { GameState } from "./game/schema";
import Lobby from "./components/Lobby";
import GameBoard from "./components/GameBoard";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [room, setRoom] = useState<Room<GameState> | null>(null);

  const joinGame = async (name: string, token: string, roomId?: string) => {
    try {
      const joinedRoom = roomId?.trim()
        ? await client.joinById<GameState>(roomId.trim(), { name, token })
        : await client.joinOrCreate<GameState>("property_tycoon", { name, token });
      setRoom(joinedRoom);
    } catch (e: unknown) {
      console.error("Join error details:", e);
      const errorMsg =
        e instanceof Error ? e.message : typeof e === "string" ? e : JSON.stringify(e);
      alert(`Failed to join game: ${errorMsg}`);
    }
  };

  const leaveGame = () => {
    room?.leave(true);
    setRoom(null);
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
            <Lobby onJoin={joinGame} />
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
