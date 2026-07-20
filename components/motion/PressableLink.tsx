"use client";

import Link from "next/link";
import { motion, type HTMLMotionProps } from "motion/react";
import { forwardRef, type ComponentProps } from "react";

import { SPRING } from "@/lib/motion/tokens";

const MotionLink = motion.create(Link);

type PressableLinkProps = ComponentProps<typeof Link> & Omit<HTMLMotionProps<"a">, "href">;

/** Same spring press/hover as PressableButton, for Next <Link> navigation. */
const PressableLink = forwardRef<HTMLAnchorElement, PressableLinkProps>(function PressableLink(
  { children, ...props },
  ref,
) {
  return (
    <MotionLink ref={ref} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} transition={SPRING.press} {...props}>
      {children}
    </MotionLink>
  );
});

export default PressableLink;

/** Same treatment for plain <a> tags (hash links, external links). */
export const PressableAnchor = forwardRef<HTMLAnchorElement, HTMLMotionProps<"a">>(function PressableAnchor(
  { children, ...props },
  ref,
) {
  return (
    <motion.a ref={ref} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} transition={SPRING.press} {...props}>
      {children}
    </motion.a>
  );
});
