"use client";

import { motion, type HTMLMotionProps } from "motion/react";

import { SPRING } from "@/lib/motion/tokens";

type CardTag = "div" | "section";

const TAG_COMPONENTS = {
  div: motion.div,
  section: motion.section,
} as const;

/**
 * Shared entrance for the app's two "gateway" screens (login, onboarding) —
 * same component, same spring, so they read as one deliberate moment
 * instead of two independently-tuned pages. Runs after RouteTransition's
 * page-level settle (a short delay) so it reads as a second beat: the page
 * arrives, then the card announces itself.
 */
export default function AuthCardEntrance({ as = "section", ...props }: HTMLMotionProps<"div"> & { as?: CardTag }) {
  const Component = TAG_COMPONENTS[as] as typeof motion.div;

  return (
    <Component
      initial={{ opacity: 0, y: 28, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...SPRING.panel, delay: 0.08 }}
      {...props}
    />
  );
}
