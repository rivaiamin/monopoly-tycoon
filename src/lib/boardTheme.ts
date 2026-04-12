import type { LucideIcon } from "lucide-react";
import { Anchor, Car, Plane, Ship } from "lucide-react";

export const TOKEN_ICONS: Record<string, LucideIcon> = {
  car: Car,
  plane: Plane,
  ship: Ship,
  anchor: Anchor,
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
};

export const TOKEN_PAWN_RING: Record<string, string> = {
  car: "bg-orange-500 border-white",
  plane: "bg-sky-100 border-sky-500 text-sky-950",
  ship: "bg-emerald-100 border-emerald-500 text-emerald-950",
  anchor: "bg-violet-100 border-violet-500 text-violet-950",
};
