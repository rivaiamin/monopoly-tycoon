import { useEffect, useRef } from "react";
import Swal from "sweetalert2";

interface UseGameLogToastsOptions {
  /** When true, new lines are queued and shown once unpaused. */
  paused?: boolean;
}

/**
 * Toast notification for each new game log line (SweetAlert2).
 * Does not toast the initial batch of lines when first connecting to a room.
 */
export function useGameLogToasts(log: readonly string[], options: UseGameLogToastsOptions = {}) {
  const prevLen = useRef(0);
  const pausedRef = useRef(!!options.paused);
  pausedRef.current = !!options.paused;
  const pending = useRef<string[]>([]);

  useEffect(() => {
    if (log.length === 0) {
      prevLen.current = 0;
      pending.current = [];
      return;
    }

    // First batch: a single line is usually the first live event — show it.
    // Multiple lines at once is almost always the snapshot when joining a room.
    if (prevLen.current === 0 && log.length > 0) {
      if (log.length === 1) {
        if (pausedRef.current) {
          pending.current.push(log[0]);
        } else {
          void Swal.fire({
            toast: true,
            position: "bottom-end",
            title: log[0],
            showConfirmButton: false,
            timer: 2600,
            timerProgressBar: true,
            customClass: { popup: "swal2-toast-game-log" },
          });
        }
      }
      prevLen.current = log.length;
      return;
    }

    if (log.length < prevLen.current) {
      prevLen.current = log.length;
      pending.current = [];
      return;
    }

    for (let i = prevLen.current; i < log.length; i++) {
      pending.current.push(log[i]);
    }
    prevLen.current = log.length;
  }, [log]);

  useEffect(() => {
    if (pausedRef.current) return;
    if (pending.current.length === 0) return;

    for (const text of pending.current) {
      void Swal.fire({
        toast: true,
        position: "bottom-end",
        title: text,
        showConfirmButton: false,
        timer: 2600,
        timerProgressBar: true,
        customClass: {
          popup: "swal2-toast-game-log",
        },
      });
    }
    pending.current = [];
  }, [options.paused]);
}
