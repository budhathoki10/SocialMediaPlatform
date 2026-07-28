"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect } from "react";

import { DURATION, MOTION_EASE, prefersReducedMotion } from "@/lib/motion/tokens";

type CharacterCounterProps = {
  length: number;
  max: number;
  /**
   * Fraction (0-1) of max where color starts easing toward the warning
   * tone. Below this the counter stays neutral; between this and 1 it
   * ramps smoothly — warns before the hard cutoff, not at it.
   */
  warnAt?: number;
  className?: string;
};

const NEUTRAL = "#94a3b8"; // slate-400
const WARN = "#d97706"; // amber-600

/**
 * Character counter whose color eases toward the warning tone as the field
 * fills, instead of snapping between two Tailwind classes at a threshold.
 * Motion owns this — a continuous value transform driven by an imperative
 * tween on every keystroke, not a discrete class swap.
 */
export default function CharacterCounter({ length, max, warnAt = 0.85, className = "" }: CharacterCounterProps) {
  const progress = useMotionValue(length / max);
  const color = useTransform(progress, [warnAt, 1], [NEUTRAL, WARN]);

  useEffect(() => {
    if (prefersReducedMotion()) {
      progress.set(length / max);
      return;
    }

    const controls = animate(progress, length / max, {
      duration: DURATION.base,
      ease: MOTION_EASE.outExpo,
    });

    return () => controls.stop();
  }, [length, max, progress]);

  return (
    <motion.span style={{ color }} className={`text-xs font-bold ${className}`}>
      {length} / {max}
    </motion.span>
  );
}
