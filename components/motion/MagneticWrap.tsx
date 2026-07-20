"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";

import { gsap } from "@/lib/motion/gsap";
import { MOTION_OK_QUERY } from "@/lib/motion/tokens";

const STRENGTH = 0.35;
const MAX_OFFSET_PX = 14;

/**
 * Magnetic hover: the wrapped element leans toward the cursor within its
 * bounds and springs back on leave. GSAP quickTo owns this — it's a
 * continuous, physically-driven pointer-follow effect, not a discrete
 * state transition, which is exactly quickTo's purpose (a reusable,
 * interruptible tween setter, cheaper than spinning up a new tween per
 * pointermove event).
 *
 * Reserved for the app's highest-intent CTAs — this is a "the button
 * really wants you to click it" flourish, not a default for every button.
 */
export default function MagneticWrap({ children, className = "" }: { children: ReactNode; className?: string }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(MOTION_OK_QUERY, () => {
        const el = wrapRef.current;
        if (!el) return undefined;

        const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
        const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });

        function handleMove(event: PointerEvent) {
          const rect = el!.getBoundingClientRect();
          const relX = event.clientX - (rect.left + rect.width / 2);
          const relY = event.clientY - (rect.top + rect.height / 2);
          xTo(gsap.utils.clamp(-MAX_OFFSET_PX, MAX_OFFSET_PX, relX * STRENGTH));
          yTo(gsap.utils.clamp(-MAX_OFFSET_PX, MAX_OFFSET_PX, relY * STRENGTH));
        }

        function handleLeave() {
          xTo(0);
          yTo(0);
        }

        el.addEventListener("pointermove", handleMove);
        el.addEventListener("pointerleave", handleLeave);

        return () => {
          el.removeEventListener("pointermove", handleMove);
          el.removeEventListener("pointerleave", handleLeave);
        };
      });
    },
    { scope: wrapRef },
  );

  return (
    <div ref={wrapRef} className={`inline-block ${className}`}>
      {children}
    </div>
  );
}
