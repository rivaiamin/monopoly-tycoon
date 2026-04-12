import type { LucideIcon } from "lucide-react";
import { Anchor, Car, Cat, Crown, Dog, Gem, Plane, Ship } from "lucide-react";

export const TOKEN_ICONS: Record<string, LucideIcon> = {
  car: Car,
  plane: Plane,
  ship: Ship,
  anchor: Anchor,
  dog: Dog,
  cat: Cat,
  crown: Crown,
  gem: Gem,
};

/** Header strip on carousel tiles for property groups */
export const GROUP_COLORS: Record<string, string> = {
  brown: "bg-amber-900",
  lightBlue: "bg-sky-400",
  pink: "bg-pink-500",
  orange: "bg-orange-500",
  red: "bg-red-600",
  yellow: "bg-yellow-400",
  green: "bg-green-600",
  darkBlue: "bg-blue-800",
};

/** Pawn / owner dot colors by token id (fixed Tailwind classes) */
export const TOKEN_ACCENT_BG: Record<string, string> = {
  car: "bg-orange-500",
  plane: "bg-sky-500",
  ship: "bg-emerald-500",
  anchor: "bg-violet-500",
  dog: "bg-rose-500",
  cat: "bg-fuchsia-500",
  crown: "bg-amber-400",
  gem: "bg-cyan-500",
};

export const TOKEN_PAWN_RING: Record<string, string> = {
  car: "bg-orange-500 border-white",
  plane: "bg-sky-100 border-sky-500 text-sky-950",
  ship: "bg-emerald-100 border-emerald-500 text-emerald-950",
  anchor: "bg-violet-100 border-violet-500 text-violet-950",
  dog: "bg-rose-100 border-rose-500 text-rose-950",
  cat: "bg-fuchsia-100 border-fuchsia-500 text-fuchsia-950",
  crown: "bg-amber-100 border-amber-500 text-amber-950",
  gem: "bg-cyan-100 border-cyan-500 text-cyan-950",
};

/** Borders / turn emphasis (Tailwind border-* classes) */
export const TOKEN_ACCENT_BORDER: Record<string, string> = {
  car: "border-orange-500",
  plane: "border-sky-500",
  ship: "border-emerald-500",
  anchor: "border-violet-500",
  dog: "border-rose-500",
  cat: "border-fuchsia-500",
  crown: "border-amber-400",
  gem: "border-cyan-500",
};

/** Secondary text tied to token (balances, labels) */
export const TOKEN_ACCENT_TEXT: Record<string, string> = {
  car: "text-orange-400",
  plane: "text-sky-400",
  ship: "text-emerald-400",
  anchor: "text-violet-400",
  dog: "text-rose-400",
  cat: "text-fuchsia-400",
  crown: "text-amber-300",
  gem: "text-cyan-400",
};
