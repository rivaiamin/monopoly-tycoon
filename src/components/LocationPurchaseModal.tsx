import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { Room } from "colyseus.js";
import { GameState, Space } from "../game/schema";
import { BOARD_DATA } from "../game/boardData";
import { Gavel, MapPin, ShoppingCart, X } from "lucide-react";

const GROUP_LABEL: Record<string, string> = {
  brown: "Brown",
  lightBlue: "Light blue",
  pink: "Pink",
  orange: "Orange",
  red: "Red",
  yellow: "Yellow",
  green: "Green",
  darkBlue: "Dark blue",
};

function typeLabel(type: string): string {
  switch (type) {
    case "property":
      return "Property";
    case "railroad":
      return "Railroad";
    case "utility":
      return "Utility";
    default:
      return type;
  }
}

interface LocationPurchaseModalProps {
  room: Room<GameState>;
  space: Space;
  canBuy: boolean;
  canDecline: boolean;
  balance: number;
  onClose?: () => void;
}

export default function LocationPurchaseModal({
  room,
  space,
  canBuy,
  canDecline,
  balance,
  onClose,
}: LocationPurchaseModalProps) {
  const data = BOARD_DATA[space.index];
  const mortgage = Math.ceil(space.price / 2);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (!onClose) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const detailRows: { label: string; value: string }[] = [];
  if (space.price > 0) {
    detailRows.push({ label: "Price", value: `$${space.price}` });
    detailRows.push({ label: "Mortgage value", value: `$${mortgage}` });
  }

  if (space.type === "property" && space.groupId) {
    detailRows.splice(Math.min(1, detailRows.length), 0, {
      label: "Color group",
      value: GROUP_LABEL[space.groupId] ?? space.groupId,
    });
    if (space.houseCost > 0) {
      detailRows.splice(Math.min(2, detailRows.length), 0, {
        label: "House / hotel cost",
        value: `$${space.houseCost} each`,
      });
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-200 flex items-end sm:items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-purchase-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        aria-label="Close"
        aria-hidden={!onClose}
        onClick={onClose}
        disabled={!onClose}
      />

      <div className="relative w-full max-w-md max-h-[min(90vh,640px)] flex flex-col rounded-2xl border border-neutral-700 bg-neutral-900 shadow-2xl shadow-black/50 overflow-hidden">
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-neutral-800 shrink-0">
          <div className="flex gap-3 min-w-0">
            <div className="shrink-0 w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">
                {typeLabel(space.type)}
              </p>
              <h2
                id="location-purchase-title"
                className="text-lg font-bold text-white leading-snug"
              >
                {space.name}
              </h2>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 w-9 h-9 rounded-full border border-white/10 bg-black/25 text-white/80 hover:bg-black/40 hover:text-white/95 transition flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1 min-h-0">
          {detailRows.length > 0 && (
            <dl className="space-y-2 text-sm">
              {detailRows.map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between gap-4 py-1.5 border-b border-neutral-800/80 last:border-0"
                >
                  <dt className="text-neutral-500">{row.label}</dt>
                  <dd className="text-neutral-100 font-medium text-right tabular-nums">{row.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {space.type === "property" && data?.rent && data.rent.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-neutral-400 mb-2">Rent</p>
              <ul className="text-xs text-neutral-300 space-y-1.5 font-mono tabular-nums">
                <li className="flex justify-between">
                  <span>Base</span>
                  <span>${data.rent[0]}</span>
                </li>
                {data.rent.slice(1, 5).map((r, i) => (
                  <li key={i} className="flex justify-between">
                    <span>
                      {i + 1} {(i + 1) === 1 ? "house" : "houses"}
                    </span>
                    <span>${r}</span>
                  </li>
                ))}
                {data.rent[5] != null && (
                  <li className="flex justify-between text-amber-200/90">
                    <span>Hotel</span>
                    <span>${data.rent[5]}</span>
                  </li>
                )}
              </ul>
              <p className="text-[11px] text-neutral-500 mt-2 leading-relaxed">
                With a complete color set, base rent is doubled before houses are built.
              </p>
            </div>
          )}

          {space.type === "railroad" && data?.rent && (
            <div>
              <p className="text-xs font-semibold text-neutral-400 mb-2">Rent (per railroad owned)</p>
              <ul className="text-xs text-neutral-300 space-y-1 font-mono tabular-nums">
                {data.rent.map((r, i) => (
                  <li key={i} className="flex justify-between">
                    <span>
                      {i + 1} railroad{i ? "s" : ""}
                    </span>
                    <span>${r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {space.type === "utility" && (
            <p className="text-xs text-neutral-400 leading-relaxed">
              Rent is{" "}
              <span className="text-neutral-200">4×</span> the dice total if you own one utility, or{" "}
              <span className="text-neutral-200">10×</span> if you own both.
            </p>
          )}

          {!canBuy && canDecline && balance < space.price && (
            <p className="text-xs text-rose-400/90 rounded-lg bg-rose-950/40 border border-rose-900/50 px-3 py-2">
              You cannot afford the list price (${space.price}). You can send this property to auction.
            </p>
          )}

          {(canBuy || canDecline) && (
            <p className="text-xs text-neutral-500 text-center">
              Unowned — buy at list price or decline to start an auction.
            </p>
          )}
        </div>

        {(canBuy || canDecline || onClose) && (
          <div className="p-4 border-t border-neutral-800 bg-neutral-950/80 shrink-0 flex flex-col sm:flex-row gap-2">
            {canBuy && (
              <button
                type="button"
                onClick={() => room.send("buy")}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md"
              >
                <ShoppingCart className="w-5 h-5" />
                Buy (${space.price})
              </button>
            )}
            {canDecline && (
              <button
                type="button"
                onClick={() => room.send("decline_purchase")}
                className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
              >
                <Gavel className="w-4 h-4" />
                Decline (auction)
              </button>
            )}
            {!canBuy && !canDecline && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-3 rounded-xl"
              >
                Close
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
