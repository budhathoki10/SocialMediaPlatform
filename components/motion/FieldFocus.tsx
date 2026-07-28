"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

import { SPRING } from "@/lib/motion/tokens";

type FieldFocusProps = {
  /** Pass the field's focused state (or focused || hasValue). */
  active: boolean;
  /**
   * Optional label that springs in above the field while focused. Solves
   * the placeholder-only-label anti-pattern (skill priority #8) without
   * redesigning the field's layout — it floats in a reserved header slot,
   * not over the text itself.
   */
  label?: ReactNode;
};

/**
 * Drop into a `relative` field wrapper alongside the actual <input>/
 * <textarea>. Replaces a plain `focus-within:ring-*` utility with a
 * spring-eased ring pop; add an optional floating label alongside it.
 */
export default function FieldFocus({ active, label }: FieldFocusProps) {
  return (
    <>
      <motion.span
        aria-hidden="true"
        className="field-ring"
        initial={false}
        animate={{ opacity: active ? 1 : 0, scale: active ? 1 : 0.96 }}
        transition={SPRING.gentle}
      />
      {label ? (
        <AnimatePresence>
          {active && (
            <motion.span
              initial={{ opacity: 0, y: -6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.9 }}
              transition={SPRING.gentle}
              className="field-focus-label"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      ) : null}
    </>
  );
}
