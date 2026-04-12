import React, { useState, useEffect, useRef } from 'react';
import { Dice5, Coins, Shield, Wand2, Sword, Cross, Map, ScrollText } from 'lucide-react';

// --- GAME DATA (RPG THEMED MONOPOLY) ---
const BOARD_SIZE = 40;
const SPACES = [
  { name: "Town Gate (GO)", type: "go", color: "bg-gray-200" },
  { name: "Goblin Slums", type: "property", group: "Brown", price: 60, rent: 10, color: "bg-amber-800" },
  { name: "Thieves' Cache", type: "chest", color: "bg-blue-200" },
  { name: "Orc Campsite", type: "property", group: "Brown", price: 60, rent: 10, color: "bg-amber-800" },
  { name: "Guild Tax", type: "tax", amount: 200, color: "bg-red-200" },
  { name: "North Griffin Roost", type: "railroad", price: 200, rent: 25, color: "bg-gray-800" },
  { name: "Merchant's Row", type: "property", group: "LightBlue", price: 100, rent: 15, color: "bg-sky-400" },
  { name: "Fate's Whisper", type: "chance", color: "bg-purple-200" },
  { name: "Bazaar Tents", type: "property", group: "LightBlue", price: 100, rent: 15, color: "bg-sky-400" },
  { name: "Trade Outpost", type: "property", group: "LightBlue", price: 120, rent: 20, color: "bg-sky-400" },
  { name: "Dungeon (Just Visiting)", type: "jail", color: "bg-gray-400" },
  { name: "Artisan Quarters", type: "property", group: "Pink", price: 140, rent: 25, color: "bg-pink-500" },
  { name: "Mana Crystal Mine", type: "utility", price: 150, rent: 20, color: "bg-slate-300" },
  { name: "Weaponsmith Row", type: "property", group: "Pink", price: 140, rent: 25, color: "bg-pink-500" },
  { name: "Alchemist Lab", type: "property", group: "Pink", price: 160, rent: 30, color: "bg-pink-500" },
  { name: "East Griffin Roost", type: "railroad", price: 200, rent: 25, color: "bg-gray-800" },
  { name: "Temple Square", type: "property", group: "Orange", price: 180, rent: 35, color: "bg-orange-500" },
  { name: "Thieves' Cache", type: "chest", color: "bg-blue-200" },
  { name: "Monk's Retreat", type: "property", group: "Orange", price: 180, rent: 35, color: "bg-orange-500" },
  { name: "High Cleric Villa", type: "property", group: "Orange", price: 200, rent: 40, color: "bg-orange-500" },
  { name: "Tavern Rest", type: "parking", color: "bg-green-200" },
  { name: "Arena Entrance", type: "property", group: "Red", price: 220, rent: 45, color: "bg-red-600" },
  { name: "Fate's Whisper", type: "chance", color: "bg-purple-200" },
  { name: "Gladiator Pits", type: "property", group: "Red", price: 220, rent: 45, color: "bg-red-600" },
  { name: "Champion's Hall", type: "property", group: "Red", price: 240, rent: 50, color: "bg-red-600" },
  { name: "South Griffin Roost", type: "railroad", price: 200, rent: 25, color: "bg-gray-800" },
  { name: "Noble's Gate", type: "property", group: "Yellow", price: 260, rent: 55, color: "bg-yellow-400" },
  { name: "Baron's Estate", type: "property", group: "Yellow", price: 260, rent: 55, color: "bg-yellow-400" },
  { name: "Water Keep", type: "utility", price: 150, rent: 20, color: "bg-slate-300" },
  { name: "Duke's Manor", type: "property", group: "Yellow", price: 280, rent: 60, color: "bg-yellow-400" },
  { name: "Arrested! (Go to Jail)", type: "go_to_jail", color: "bg-gray-600" },
  { name: "Royal Gardens", type: "property", group: "Green", price: 300, rent: 65, color: "bg-green-600" },
  { name: "King's Road", type: "property", group: "Green", price: 300, rent: 65, color: "bg-green-600" },
  { name: "Thieves' Cache", type: "chest", color: "bg-blue-200" },
  { name: "Council Spire", type: "property", group: "Green", price: 320, rent: 75, color: "bg-green-600" },
  { name: "West Griffin Roost", type: "railroad", price: 200, rent: 25, color: "bg-gray-800" },
  { name: "Fate's Whisper", type: "chance", color: "bg-purple-200" },
  { name: "Castle Keep", type: "property", group: "Blue", price: 350, rent: 85, color: "bg-blue-700" },
  { name: "Crown Tax", type: "tax", amount: 100, color: "bg-red-200" },
  { name: "Dragon's Lair", type: "property", group: "Blue", price: 400, rent: 100, color: "bg-blue-700" }
];

const STARTING_GOLD = 1500;

export default function App() {
  // --- STATE ---
  const [players, setPlayers] = useState([
    { id: 0, name: "Warrior", icon: Sword, color: "text-red-500", bg: "bg-red-500", gold: STARTING_GOLD, position: 0 },
    { id: 1, name: "Mage", icon: Wand2, color: "text-blue-500", bg: "bg-blue-500", gold: STARTING_GOLD, position: 0 },
    { id: 2, name: "Rogue", icon: Map, color: "text-green-500", bg: "bg-green-500", gold: STARTING_GOLD, position: 0 },
    { id: 3, name: "Cleric", icon: Cross, color: "text-yellow-500", bg: "bg-yellow-500", gold: STARTING_GOLD, position: 0 }
  ]);
  const [ownership, setOwnership] = useState({}); // { spaceIndex: playerId }
  const [turnIndex, setTurnIndex] = useState(0);
  
  const [phase, setPhase] = useState("ROLL"); // ROLL, MOVING, ACTION_BUY, END
  const [movesLeft, setMovesLeft] = useState(0); // Tracks step-by-step animation
  
  const [logs, setLogs] = useState(["Welcome to Guild Tycoon! Warrior rolls first."]);
  const [lastRoll, setLastRoll] = useState([1, 1]);
  
  const logsEndRef = useRef(null);
  
  const activePlayer = players[turnIndex];
  const activeSpace = SPACES[activePlayer.position];

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (msg) => setLogs(prev => [...prev, msg]);

  // --- ACTIONS ---
  const handleRoll = () => {
    if (phase !== "ROLL") return;
    
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const total = die1 + die2;
    setLastRoll([die1, die2]);
    
    addLog(`${activePlayer.name} rolled ${total} (${die1}+${die2}).`);

    // Switch to moving phase to trigger step-by-step animation effect
    setPhase("MOVING");
    setMovesLeft(total);
  };

  // --- STEP-BY-STEP ANIMATION EFFECT ---
  useEffect(() => {
    if (phase === "MOVING") {
      if (movesLeft > 0) {
        // Schedule next step
        const timer = setTimeout(() => {
          
          // Check if about to pass Go (from 39 to 0)
          if (activePlayer.position === BOARD_SIZE - 1) {
            addLog(`${activePlayer.name} passed the Town Gate and collected 200 G!`);
          }

          setPlayers(prev => {
            const newPlayers = [...prev];
            const p = { ...newPlayers[turnIndex] };
            
            p.position += 1;
            if (p.position >= BOARD_SIZE) {
              p.position = 0;
              p.gold += 200; // Passed GO!
            }
            
            newPlayers[turnIndex] = p;
            return newPlayers;
          });

          setMovesLeft(m => m - 1);
        }, 250); // 250ms per step creates a nice brisk slide

        return () => clearTimeout(timer);
      } else {
        // Finished moving! Add a slight delay before popup for visual polish.
        const timer = setTimeout(() => {
          evaluateSpace(activePlayer.position, activePlayer);
        }, 400);
        return () => clearTimeout(timer);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, movesLeft]);

  const evaluateSpace = (posIndex, player) => {
    const space = SPACES[posIndex];
    addLog(`${player.name} landed on ${space.name}.`);

    if (space.type === "property" || space.type === "railroad" || space.type === "utility") {
      const ownerId = ownership[posIndex];
      if (ownerId === undefined) {
        setPhase("ACTION_BUY");
      } else if (ownerId !== player.id) {
        // Pay Rent
        const rent = space.rent;
        const ownerName = players[ownerId].name;
        payPlayer(player.id, ownerId, rent);
        addLog(`${player.name} paid ${rent} G rent to ${ownerName}.`);
        setPhase("END");
      } else {
        addLog(`${player.name} owns this territory.`);
        setPhase("END");
      }
    } else if (space.type === "tax") {
      deductGold(player.id, space.amount);
      addLog(`${player.name} paid ${space.amount} G in taxes.`);
      setPhase("END");
    } else if (space.type === "go_to_jail") {
      const newPlayers = [...players];
      newPlayers[player.id].position = 10; // Jail index (Teleport effect is intended here)
      setPlayers(newPlayers);
      addLog(`${player.name} was arrested and sent to the Dungeon!`);
      setPhase("END");
    } else if (space.type === "chance" || space.type === "chest") {
      const bonus = Math.floor(Math.random() * 100) + 10;
      addGold(player.id, bonus);
      addLog(`Fate smiles! ${player.name} found ${bonus} G.`);
      setPhase("END");
    } else {
      setPhase("END"); // GO, Jail visiting, Parking
    }
  };

  const payPlayer = (fromId, toId, amount) => {
    setPlayers(prev => {
      const newP = [...prev];
      newP[fromId].gold -= amount;
      newP[toId].gold += amount;
      return newP;
    });
  };

  const deductGold = (playerId, amount) => {
    setPlayers(prev => {
      const newP = [...prev];
      newP[playerId].gold -= amount;
      return newP;
    });
  };

  const addGold = (playerId, amount) => {
    setPlayers(prev => {
      const newP = [...prev];
      newP[playerId].gold += amount;
      return newP;
    });
  };

  const handleBuy = () => {
    if (activePlayer.gold >= activeSpace.price) {
      deductGold(activePlayer.id, activeSpace.price);
      setOwnership(prev => ({ ...prev, [activePlayer.position]: activePlayer.id }));
      addLog(`${activePlayer.name} purchased ${activeSpace.name} for ${activeSpace.price} G!`);
      setPhase("END");
    } else {
      addLog(`${activePlayer.name} does not have enough Gold.`);
    }
  };

  const handleEndTurn = () => {
    setTurnIndex((prev) => (prev + 1) % players.length);
    setPhase("ROLL");
  };

  // --- CAROUSEL RENDER LOGIC ---
  const carouselWindow = [-3, -2, -1, 0, 1, 2, 3];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans flex flex-col p-4 md:p-8">
      
      {/* HEADER */}
      <header className="flex justify-between items-center border-b border-neutral-800 pb-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-wider text-amber-500 uppercase flex items-center gap-2">
            <Shield className="w-8 h-8" /> Guild Tycoon
          </h1>
          <p className="text-neutral-400 text-sm mt-1">Multiplayer Carousel Prototype</p>
        </div>
        <div className={`px-6 py-2 rounded-full border-2 font-bold uppercase tracking-widest ${activePlayer.color.replace('text-', 'border-')} ${activePlayer.color.replace('text-', 'bg-').replace('500', '900/30')} flex items-center gap-2`}>
          <activePlayer.icon className="w-5 h-5" />
          {activePlayer.name}'s Turn
        </div>
      </header>

      {/* CAROUSEL BOARD */}
      <section className="relative w-full h-48 overflow-hidden bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-center mb-8 shadow-2xl">
        <div className="absolute top-2 left-4 text-xs font-bold text-neutral-500 tracking-widest uppercase z-20">The Map</div>
        
        {/* We keep flex layout. By changing the subset of items rendered but keeping unique keys, React animates the layout reflow */}
        <div className="flex items-center gap-4">
          {carouselWindow.map((offset) => {
            const rawIndex = activePlayer.position + offset;
            const safeIndex = (rawIndex + BOARD_SIZE) % BOARD_SIZE;
            const space = SPACES[safeIndex];
            const isCenter = offset === 0;
            const ownerId = ownership[safeIndex];

            const playersOnSpace = players.filter(p => p.position === safeIndex);

            return (
              <div 
                // CRUCIAL CHANGE: The key is purely the absolute space index.
                // This ensures React persists the element and applies CSS transitions naturally 
                // when the window subset shifts.
                key={safeIndex} 
                className={`
                  relative flex-shrink-0 w-32 h-36 rounded-lg flex flex-col transition-all duration-300
                  ${isCenter ? 'scale-110 shadow-[0_0_20px_rgba(255,255,255,0.1)] z-10 border-2 border-white' : 'opacity-50 scale-90 border border-neutral-700'}
                  bg-neutral-800 overflow-hidden
                `}
              >
                <div className={`h-8 w-full ${space.color} flex items-center justify-center`}>
                  {ownerId !== undefined && (
                    <div className={`w-4 h-4 rounded-full ${players[ownerId].bg} border-2 border-white`} />
                  )}
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center p-2 text-center">
                  <span className="text-xs font-bold leading-tight mb-1">{space.name}</span>
                  {space.price && <span className="text-amber-400 text-xs font-mono">{space.price} G</span>}
                </div>

                {playersOnSpace.length > 0 && (
                  <div className="absolute bottom-2 left-0 w-full flex justify-center gap-1">
                    {playersOnSpace.map(p => (
                      <div key={`token-${p.id}`} className={`p-1 rounded-full ${p.bg} text-white shadow-md animate-bounce`}>
                        <p.icon className="w-3 h-3" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* TWO COLUMN LAYOUT: RPG Party & Actions */}
      <div className="flex flex-col lg:flex-row gap-8 flex-1">
        
        {/* LEFT COL: RPG Party UI */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          {players.map(player => (
            <div 
              key={player.id} 
              className={`
                bg-neutral-900 border rounded-xl p-4 flex flex-col gap-3 transition-colors duration-300
                ${turnIndex === player.id ? `border-${player.bg.split('-')[1]}-500 shadow-[0_0_15px_rgba(0,0,0,0.5)]` : 'border-neutral-800 opacity-80'}
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${player.bg} text-white`}>
                  <player.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className={`font-bold uppercase tracking-wider ${player.color}`}>{player.name}</h3>
                  <div className="flex items-center text-amber-400 font-mono text-sm">
                    <Coins className="w-4 h-4 mr-1" /> {player.gold} G
                  </div>
                </div>
              </div>

              {/* Gold Bar */}
              <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 transition-all duration-500" 
                  style={{ width: `${Math.min(100, (player.gold / STARTING_GOLD) * 100)}%` }}
                />
              </div>

              {/* Owned Properties Badges */}
              <div className="flex flex-wrap gap-1 mt-1">
                {Object.entries(ownership).filter(([_, ownerId]) => ownerId === player.id).length === 0 && (
                  <span className="text-xs text-neutral-600 italic">No territories</span>
                )}
                {Object.entries(ownership).map(([spaceIndex, ownerId]) => {
                  if (ownerId !== player.id) return null;
                  const sp = SPACES[spaceIndex];
                  return (
                    <div 
                      key={spaceIndex} 
                      className={`w-3 h-3 rounded-sm ${sp.color}`} 
                      title={sp.name}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT COL: Control Panel & Logs */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4">
          
          {/* Action Panel */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-4 min-h-[200px]">
            {phase === "ROLL" && (
              <>
                <h3 className="text-xl font-bold text-white">Your Move</h3>
                <button 
                  onClick={handleRoll}
                  className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-lg text-white transition-transform active:scale-95 ${activePlayer.bg} hover:brightness-110 shadow-lg`}
                >
                  <Dice5 className="w-6 h-6" /> Roll Dice
                </button>
              </>
            )}

            {phase === "MOVING" && (
              <>
                <h3 className="text-xl font-bold text-white animate-pulse">Travelling...</h3>
                <button 
                  disabled
                  className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-lg text-white opacity-80 ${activePlayer.bg} shadow-lg`}
                >
                  <Dice5 className="w-6 h-6 animate-spin" /> {movesLeft} Steps Left
                </button>
              </>
            )}

            {phase === "ACTION_BUY" && (
              <>
                <h3 className="text-xl font-bold text-white">{activeSpace.name}</h3>
                <p className="text-neutral-400 text-sm">Unowned Territory</p>
                <div className="flex gap-2 w-full">
                  <button 
                    onClick={handleBuy}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition"
                  >
                    Buy ({activeSpace.price} G)
                  </button>
                  <button 
                    onClick={() => setPhase("END")}
                    className="flex-1 py-3 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg font-bold transition"
                  >
                    Pass
                  </button>
                </div>
              </>
            )}

            {phase === "END" && (
              <>
                <h3 className="text-xl font-bold text-white">Action Completed</h3>
                <button 
                  onClick={handleEndTurn}
                  className="w-full py-4 bg-neutral-100 text-neutral-900 hover:bg-white rounded-xl font-bold text-lg transition-transform active:scale-95 shadow-lg"
                >
                  End Turn
                </button>
              </>
            )}
          </div>

          {/* Event Log */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl flex-1 flex flex-col overflow-hidden max-h-[250px]">
            <div className="bg-neutral-800 px-4 py-2 text-xs font-bold text-neutral-400 tracking-widest uppercase flex items-center gap-2 border-b border-neutral-700">
              <ScrollText className="w-4 h-4" /> Quest Log
            </div>
            <div className="p-4 overflow-y-auto flex-1 font-mono text-sm space-y-2">
              {logs.map((log, i) => (
                <div key={i} className="text-neutral-300 pb-2 border-b border-neutral-800/50 last:border-0 last:text-white transition-colors duration-300">
                  <span className="text-neutral-600 mr-2">{'>'}</span> {log}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}