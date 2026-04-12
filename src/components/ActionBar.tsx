import React, { useState } from "react";
import { Room } from "colyseus.js";
import { GameState, Player, Space } from "../game/schema";
import { cn } from "../lib/utils";
import {
  Dices,
  ShoppingCart,
  Check,
  Banknote,
  CreditCard,
  Gavel,
  Home,
  Building2,
  Landmark,
  PiggyBank,
  Trophy,
} from "lucide-react";

interface ActionBarProps {
  room: Room<GameState>;
  state: GameState;
  currentPlayer: Player | undefined;
  isMyTurn: boolean;
}

export default function ActionBar({ room, state, currentPlayer, isMyTurn }: ActionBarProps) {
  const [bidAmount, setBidAmount] = useState(10);
  const [manageOpen, setManageOpen] = useState(false);

  if (!state.gameStarted) return null;

  if (state.gameOver) {
    const winner = state.winnerId ? state.players.get(state.winnerId) : null;
    return (
      <div className="text-center py-4 space-y-2">
        <Trophy className="w-10 h-10 mx-auto text-amber-400" />
        <p className="font-bold text-lg text-amber-100">
          {winner ? `${winner.name} wins!` : "Game over"}
        </p>
      </div>
    );
  }

  const pos = currentPlayer?.position ?? 0;
  const currentSpace = state.board[pos] as Space;

  const canRoll =
    isMyTurn && state.turnPhase === "waiting_to_roll" && !currentPlayer?.inJail;
  const jailChoice = isMyTurn && state.turnPhase === "jail_choice" && currentPlayer?.inJail;

  const canBuy =
    isMyTurn &&
    state.turnPhase === "post_move_action" &&
    currentSpace.ownerId === "" &&
    ["property", "railroad", "utility"].includes(currentSpace.type) &&
    (currentPlayer?.balance ?? 0) >= currentSpace.price;

  const canDecline =
    isMyTurn &&
    state.turnPhase === "post_move_action" &&
    currentSpace.ownerId === "" &&
    ["property", "railroad", "utility"].includes(currentSpace.type);

  const canEndTurn =
    isMyTurn &&
    !state.pendingExtraRoll &&
    (state.turnPhase === "property_management" || state.turnPhase === "post_move_action");

  const inAuction = state.turnPhase === "auction";
  const myOwned = Array.from(state.board).filter(
    (s) => (s as Space).ownerId === room.sessionId
  ) as Space[];

  const canManage =
    isMyTurn &&
    state.turnPhase === "property_management" &&
    myOwned.length > 0;

  const canCollectParking =
    isMyTurn &&
    (state.turnPhase === "property_management" || state.turnPhase === "post_move_action") &&
    currentSpace.type === "parking" &&
    state.freeParkingJackpot &&
    state.freeParkingPot > 0;

  return (
    <div className="grid grid-cols-1 gap-2">
      {canRoll && (
        <button
          type="button"
          onClick={() => room.send("roll")}
          className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <Dices className="w-5 h-5" />
          ROLL DICE
        </button>
      )}

      {jailChoice && (
        <div className="space-y-2">
          <p className="text-xs text-center text-zinc-400 font-medium">You are in Jail</p>
          <button
            type="button"
            onClick={() => room.send("jail_pay")}
            disabled={(currentPlayer?.balance ?? 0) < 50}
            className="w-full bg-amber-700 hover:bg-amber-600 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2"
          >
            <Banknote className="w-4 h-4" />
            Pay $50 to roll
          </button>
          {(currentPlayer?.getOutOfJailCards ?? 0) > 0 && (
            <button
              type="button"
              onClick={() => room.send("jail_use_card")}
              className="w-full bg-violet-700 hover:bg-violet-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Use Get Out of Jail card
            </button>
          )}
          <button
            type="button"
            onClick={() => room.send("jail_roll")}
            className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2"
          >
            <Dices className="w-4 h-4" />
            Roll for doubles
          </button>
        </div>
      )}

      {canBuy && (
        <button
          type="button"
          onClick={() => room.send("buy")}
          className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <ShoppingCart className="w-5 h-5" />
          BUY {currentSpace.name.toUpperCase()} (${currentSpace.price})
        </button>
      )}

      {canDecline && (
        <button
          type="button"
          onClick={() => room.send("decline_purchase")}
          className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2"
        >
          <Gavel className="w-4 h-4" />
          Decline (auction)
        </button>
      )}

      {inAuction && !currentPlayer?.isBankrupt && (
        <div className="rounded-xl border border-zinc-700 p-3 space-y-2 bg-zinc-950/80">
          <p className="text-xs text-zinc-400 text-center font-medium">Auction in progress</p>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min={1}
              value={bidAmount}
              onChange={(e) => setBidAmount(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono"
            />
            <button
              type="button"
              onClick={() => room.send("auction_bid", { amount: bidAmount })}
              className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded-lg font-bold text-sm"
            >
              Bid
            </button>
          </div>
          <button
            type="button"
            onClick={() => room.send("auction_pass")}
            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium"
          >
            Pass
          </button>
        </div>
      )}

      {canCollectParking && (
        <button
          type="button"
          onClick={() => room.send("collect_free_parking")}
          className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
        >
          <PiggyBank className="w-5 h-5" />
          Collect Free Parking (${state.freeParkingPot})
        </button>
      )}

      {canManage && (
        <div className="border border-zinc-800 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setManageOpen(!manageOpen)}
            className="w-full py-2 text-sm font-semibold text-zinc-300 bg-zinc-900/80 hover:bg-zinc-800"
          >
            {manageOpen ? "Hide" : "Manage"} properties
          </button>
          {manageOpen && (
            <div className="max-h-48 overflow-y-auto p-2 space-y-1 text-left">
              {myOwned.map((sp) => (
                <div
                  key={sp.index}
                  className="flex flex-wrap gap-1 items-center justify-between text-[10px] bg-zinc-950 p-2 rounded-lg"
                >
                  <span className="text-zinc-300 truncate flex-1 min-w-0">{sp.name}</span>
                  {sp.type === "property" && !sp.isMortgaged && (
                    <button
                      type="button"
                      onClick={() => room.send("build_house", { spaceIndex: sp.index })}
                      className="px-2 py-1 bg-green-900/80 rounded flex items-center gap-0.5"
                    >
                      <Home className="w-3 h-3" />+H
                    </button>
                  )}
                  {sp.type === "property" && sp.houseCount > 0 && (
                    <button
                      type="button"
                      onClick={() => room.send("sell_house", { spaceIndex: sp.index })}
                      className="px-2 py-1 bg-orange-900/80 rounded flex items-center gap-0.5"
                    >
                      <Building2 className="w-3 h-3" />-H
                    </button>
                  )}
                  {!sp.isMortgaged && sp.houseCount === 0 && (
                    <button
                      type="button"
                      onClick={() => room.send("mortgage", { spaceIndex: sp.index })}
                      className="px-2 py-1 bg-amber-900/80 rounded flex items-center gap-0.5"
                    >
                      <Landmark className="w-3 h-3" />M
                    </button>
                  )}
                  {sp.isMortgaged && (
                    <button
                      type="button"
                      onClick={() => room.send("unmortgage", { spaceIndex: sp.index })}
                      className="px-2 py-1 bg-blue-900/80 rounded flex items-center gap-0.5"
                    >
                      UnM
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {canEndTurn && (
        <button
          type="button"
          onClick={() => room.send("end_turn")}
          className={cn(
            "w-full font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
            state.pendingExtraRoll
              ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              : "bg-zinc-800 hover:bg-zinc-700 text-white"
          )}
          disabled={state.pendingExtraRoll}
        >
          <Check className="w-5 h-5" />
          END TURN
        </button>
      )}

      {state.pendingExtraRoll && isMyTurn && (
        <p className="text-center text-xs text-amber-400 font-medium">Roll again — you threw doubles</p>
      )}

      {!isMyTurn && !inAuction && (
        <div className="text-center py-3 text-zinc-500 text-sm font-medium animate-pulse">
          Waiting for other players...
        </div>
      )}
    </div>
  );
}
