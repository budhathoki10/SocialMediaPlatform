"use client";

import { motion, type HTMLMotionProps } from "motion/react";

import { SPRING } from "@/lib/motion/tokens";

/**
 * Drop-in replacements for a modal's backdrop <div> and panel <section>.
 * Wrap the conditional render in <AnimatePresence> at the call site so the
 * exit animation gets a chance to play before unmount.
 */
export function ModalBackdrop(props: HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={SPRING.gentle}
      {...props}
    />
  );
}

export function ModalPanel(props: HTMLMotionProps<"section">) {
  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.95, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 12 }}
      transition={SPRING.panel}
      {...props}
    />
  );
}
