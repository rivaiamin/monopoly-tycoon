import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

function randDie() {
  return Math.floor(Math.random() * 6) + 1;
}

function Die({ value, spinning }: { value: number; spinning: boolean }) {
  return (
    <motion.div
      className={cn(
        "w-14 h-14 md:w-16 md:h-16 rounded-xl shadow-lg flex items-center justify-center",
        "bg-gradient-to-br from-white to-zinc-200 border-2 border-zinc-300",
        "font-black text-2xl md:text-3xl text-zinc-900 tabular-nums"
      )}
      animate={
        spinning
          ? { rotateZ: [0, 12, -12, 0], y: [0, -2, 0] }
          : { rotateZ: 0, y: 0 }
      }
      transition={
        spinning
          ? { duration: 0.18, ease: "easeInOut", repeat: 10 }
          : { type: "spring", stiffness: 420, damping: 28 }
      }
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={`${value}-${spinning}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="select-none"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
}

interface DiceRollerProps {
  die1: number;
  die2: number;
  /** Increments on every server roll — drives spin → reveal. */
  rollSeq: number;
  className?: string;
}

export default function DiceRoller({ die1, die2, rollSeq, className }: DiceRollerProps) {
  const [spinning, setSpinning] = useState(false);
  const [show, setShow] = useState<[number, number]>([1, 1]);

  useEffect(() => {
    if (rollSeq <= 0) return;

    setSpinning(true);
    const spin = window.setInterval(() => {
      setShow([randDie(), randDie()]);
    }, 45);

    const done = window.setTimeout(() => {
      clearInterval(spin);
      setShow([die1, die2]);
      setSpinning(false);
    }, 620);

    return () => {
      clearInterval(spin);
      clearTimeout(done);
    };
  }, [rollSeq, die1, die2]);

  if (rollSeq <= 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-3 md:gap-4 pointer-events-none",
        className
      )}
    >
      <Die value={show[0]} spinning={spinning} />
      <Die value={show[1]} spinning={spinning} />
    </div>
  );
}
