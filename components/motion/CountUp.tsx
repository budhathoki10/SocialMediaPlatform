"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";

import { ANIME_EASE, prefersReducedMotion } from "@/lib/motion/tokens";

type CountUpProps = {
  value: number;
  duration?: number;
  className?: string;
};

/**
 * Ticks 0 -> value once on mount. anime.js owns this numeric tween (same
 * split as the testimonial metrics: anime.js drives plain-object tweens
 * with a manual onUpdate DOM write, GSAP/Motion never touch this element).
 */
export default function CountUp({ value, duration = 900, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (prefersReducedMotion()) {
      node.textContent = String(value);
      return;
    }

    const counter = { value: 0 };

    animate(counter, {
      value,
      duration,
      ease: ANIME_EASE.outExpo,
      modifier: Math.round,
      onUpdate: () => {
        if (ref.current) ref.current.textContent = String(counter.value);
      },
    });
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      0
    </span>
  );
}
