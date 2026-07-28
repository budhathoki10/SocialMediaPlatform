"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { forwardRef } from "react";

import { SPRING } from "@/lib/motion/tokens";

type CardTag = "div" | "article" | "li";

type HoverCardProps = HTMLMotionProps<"div"> & {
  liftPx?: number;
  /** Preserve semantic HTML (list items, article cards) instead of always rendering a div. */
  as?: CardTag;
};

const TAG_COMPONENTS = {
  div: motion.div,
  article: motion.article,
  li: motion.li,
} as const;

/**
 * Card lift on hover. Motion owns the transform (y, spring); the shadow
 * grow is a plain CSS transition via the "hover-card-shadow" class (box-shadow
 * isn't a transform/opacity property and Motion's string-interpolation of
 * multi-layer Tailwind shadows is unreliable, so CSS owns it instead —
 * two engines, two different properties, never the same one).
 */
const HoverCard = forwardRef<HTMLElement, HoverCardProps>(function HoverCard(
  { children, liftPx = 5, className = "", as = "div", ...props },
  ref,
) {
  // All three tag variants accept the same DOM attribute surface this
  // component actually uses; narrowing to motion.div's prop type here just
  // satisfies TS's per-element event-handler generics, which don't reflect
  // a real runtime incompatibility.
  const Component = TAG_COMPONENTS[as] as typeof motion.div;

  return (
    <Component
      ref={ref as never}
      className={`hover-card-shadow ${className}`}
      whileHover={{ y: -liftPx }}
      transition={SPRING.gentle}
      {...props}
    >
      {children}
    </Component>
  );
});

export default HoverCard;
