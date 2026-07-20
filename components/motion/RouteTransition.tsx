"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { DURATION, MOTION_EASE } from "@/lib/motion/tokens";

/**
 * App-wide route transition. Lives in the persistent root Providers tree,
 * not a segment template.tsx — a template.tsx instance is thrown away and
 * recreated fresh on every navigation (that's its whole purpose), so
 * nothing inside one ever survives long enough to see its own outgoing
 * child and animate an exit. AnimatePresence has to live somewhere that
 * *doesn't* remount on navigation for the exit half of the transition to
 * exist at all; keying by pathname here is what tells it a navigation
 * happened.
 *
 * Exit is faster than enter (skill guidance): the outgoing view gets out
 * of the way in DURATION.fast (150ms) before the incoming one settles in
 * DURATION.base (250ms) — an incoming view should feel instant, not like
 * it's waiting on the old one.
 */
export default function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0, transition: { duration: DURATION.base, ease: MOTION_EASE.outExpo } }}
        exit={{ opacity: 0, y: -10, transition: { duration: DURATION.fast, ease: MOTION_EASE.outExpo } }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
