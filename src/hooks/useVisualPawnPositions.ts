import { useEffect, useRef, useState } from "react";

const STEP_MS = 82;

/**
 * Advances each pawn one space at a time along the board ring until it matches the server position.
 */
export function useVisualPawnPositions(
  players: { sessionId: string; position: number }[]
): Record<string, number> {
  const [visual, setVisual] = useState<Record<string, number>>({});
  const playersRef = useRef(players);
  playersRef.current = players;

  const posKey = players.map((p) => `${p.sessionId}:${p.position}`).join("|");

  useEffect(() => {
    setVisual((v) => {
      const ids = new Set(players.map((p) => p.sessionId));
      const n: Record<string, number> = {};
      for (const k of Object.keys(v)) {
        if (ids.has(k)) n[k] = v[k];
      }
      for (const p of players) {
        if (n[p.sessionId] === undefined) {
          n[p.sessionId] = p.position;
        }
      }
      return n;
    });
  }, [players]);

  useEffect(() => {
    const id = setInterval(() => {
      const pl = playersRef.current;
      setVisual((v) => {
        const n = { ...v };
        let changed = false;
        for (const p of pl) {
          const cur = n[p.sessionId] ?? p.position;
          if (cur !== p.position) {
            n[p.sessionId] = (cur + 1) % 40;
            changed = true;
          }
        }
        return changed ? n : v;
      });
    }, STEP_MS);
    return () => clearInterval(id);
  }, [posKey]);

  return visual;
}
