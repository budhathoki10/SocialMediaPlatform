"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { forwardRef } from "react";

import { SPRING } from "@/lib/motion/tokens";

type PressableButtonProps = HTMLMotionProps<"button">;

/**
 * Drop-in replacement for <button> — same props, adds a spring press/hover.
 * Disabled buttons never animate (a control that looks tappable but isn't
 * is worse than one that looks static).
 */
const PressableButton = forwardRef<HTMLButtonElement, PressableButtonProps>(function PressableButton(
  { children, disabled, ...props },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      disabled={disabled}
      whileHover={disabled ? undefined : { y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={SPRING.press}
      {...props}
    >
      {children}
    </motion.button>
  );
});

export default PressableButton;
