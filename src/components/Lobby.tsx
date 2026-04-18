import React, { useEffect, useState } from "react";
import { User, Car, Plane, Ship, Anchor, Dog, Cat, Crown, Gem, Hash } from "lucide-react";
import { cn } from "../lib/utils";

interface LobbyProps {
  onJoin: (name: string, token: string, roomId?: string) => void;
}

const STORAGE_KEYS = {
  name: "ptycoon:name",
  token: "ptycoon:token",
  roomId: "ptycoon:roomId",
} as const;

const TOKENS = [
  { id: "car", icon: Car, label: "Race Car" },
  { id: "plane", icon: Plane, label: "Airplane" },
  { id: "ship", icon: Ship, label: "Steamship" },
  { id: "anchor", icon: Anchor, label: "Anchor" },
  { id: "dog", icon: Dog, label: "Dog" },
  { id: "cat", icon: Cat, label: "Cat" },
  { id: "crown", icon: Crown, label: "Crown" },
  { id: "gem", icon: Gem, label: "Gem" },
];

export default function Lobby({ onJoin }: LobbyProps) {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [selectedToken, setSelectedToken] = useState("car");

  useEffect(() => {
    const storedName = localStorage.getItem(STORAGE_KEYS.name);
    const storedToken = localStorage.getItem(STORAGE_KEYS.token);
    const storedRoomId = localStorage.getItem(STORAGE_KEYS.roomId);

    if (storedName) setName(storedName);
    if (storedToken && TOKENS.some((t) => t.id === storedToken)) setSelectedToken(storedToken);
    if (storedRoomId) setRoomId(storedRoomId);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onJoin(name.trim(), selectedToken, roomId.trim() || undefined);
    }
  };

  return (
    <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tighter mb-2 bg-linear-to-br from-orange-400 to-red-600 bg-clip-text text-transparent">
          PROPERTY TYCOON
        </h1>
        <p className="text-zinc-400">
          Enter your name and an optional room ID. Below that, choose your <span className="text-zinc-300">board piece</span>{" "}
          (car, plane, etc.). Joining remembers you on this browser so you can reconnect after a refresh.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">
            Player Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">
            Room ID <span className="text-zinc-600 font-normal normal-case">(optional — leave empty to create)</span>
          </label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Paste a friend's room ID"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-mono text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1">
            Board piece
          </label>
          <p className="text-zinc-600 text-xs mb-2">Tap an icon — this is your token on the board.</p>
          <div className="grid grid-cols-4 gap-3">
            {TOKENS.map((token) => (
              <button
                key={token.id}
                type="button"
                onClick={() => setSelectedToken(token.id)}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-xl border transition-all",
                  selectedToken === token.id
                    ? "bg-orange-500/10 border-orange-500 text-orange-500"
                    : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                )}
              >
                <token.icon className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-medium">{token.label}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-900/20 transition-all active:scale-[0.98]"
        >
          {roomId.trim() ? "JOIN ROOM" : "CREATE OR JOIN GAME"}
        </button>
      </form>
    </div>
  );
}
