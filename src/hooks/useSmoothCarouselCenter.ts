import { useCallback, useEffect, useRef, useState } from "react";

const BOARD_LEN = 40;

/**
 * Smoothly animates the carousel focus along the board ring. Uses an unwrapped
 * coordinate so a forward step from 39 → 0 animates 39 → 40 (not backward to 0).
 */
export function useSmoothCarouselCenter(ringStep: number, enabled: boolean): number {
  const [smooth, setSmooth] = useState(() => ringStep);
  const prevStepRef = useRef<number | null>(null);
  const unwrappedRef = useRef(ringStep);
  const rafRef = useRef<number | null>(null);
  const smoothRef = useRef(ringStep);
  smoothRef.current = smooth;

  const cancelAnim = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      cancelAnim();
      unwrappedRef.current = ringStep;
      prevStepRef.current = null;
      setSmooth(ringStep);
      smoothRef.current = ringStep;
      return;
    }

    const prev = prevStepRef.current;
    if (prev === null) {
      unwrappedRef.current = ringStep;
      setSmooth(ringStep);
      smoothRef.current = ringStep;
      prevStepRef.current = ringStep;
      return;
    }

    const forward = (ringStep - prev + BOARD_LEN) % BOARD_LEN;

    if (forward === 0) {
      return;
    }

    prevStepRef.current = ringStep;

    if (forward !== 1) {
      cancelAnim();
      unwrappedRef.current = ringStep;
      setSmooth(ringStep);
      smoothRef.current = ringStep;
      return;
    }

    unwrappedRef.current += 1;
    const target = unwrappedRef.current;
    const from = smoothRef.current;

    cancelAnim();

    /** Slightly under two pawn steps (2×250ms) so multi-step rolls stay coherent; tweak with STEP_MS in useVisualPawnPositions. */
    const durationMs = 400;
    const start = performance.now();
    const ease = (t: number) => (t >= 1 ? 1 : 1 - (1 - t) ** 3);

    const tick = (now: number) => {
      const u = Math.min(1, (now - start) / durationMs);
      const v = from + (target - from) * ease(u);
      setSmooth(v);
      smoothRef.current = v;
      if (u < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setSmooth(target);
        smoothRef.current = target;
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnim();
  }, [ringStep, enabled, cancelAnim]);

  return smooth;
}
