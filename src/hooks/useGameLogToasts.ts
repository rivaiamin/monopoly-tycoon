import { useEffect, useRef } from "react";
import Swal from "sweetalert2";

/**
 * Toast notification for each new game log line (SweetAlert2).
 * Does not toast the initial batch of lines when first connecting to a room.
 */
export function useGameLogToasts(log: readonly string[]) {
  const prevLen = useRef(0);

  useEffect(() => {
    if (log.length === 0) {
      prevLen.current = 0;
      return;
    }

    // First batch: a single line is usually the first live event — show it.
    // Multiple lines at once is almost always the snapshot when joining a room.
    if (prevLen.current === 0 && log.length > 0) {
      if (log.length === 1) {
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
      prevLen.current = log.length;
      return;
    }

    if (log.length < prevLen.current) {
      prevLen.current = log.length;
      return;
    }

    for (let i = prevLen.current; i < log.length; i++) {
      const text = log[i];
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
    prevLen.current = log.length;
  }, [log]);
}
