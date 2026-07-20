"use client";

import { motion, type HTMLMotionProps, type Variants } from "motion/react";

import { DURATION, MOTION_EASE, STAGGER } from "@/lib/motion/tokens";

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: STAGGER.base, delayChildren: 0.04 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.slow, ease: MOTION_EASE.outExpo },
  },
};

/**
 * Orchestrated mount reveal for a group of panels — pair one StaggerGroup
 * with sibling StaggerItems. Variants propagate from parent to children
 * automatically (Motion's context API), so items need no initial/animate
 * of their own.
 */
export function StaggerGroup(props: HTMLMotionProps<"div">) {
  return <motion.div variants={containerVariants} initial="hidden" animate="show" {...props} />;
}

type ItemTag = "div" | "section";

const ITEM_TAG_COMPONENTS = {
  div: motion.div,
  section: motion.section,
} as const;

export function StaggerItem({ as = "div", ...props }: HTMLMotionProps<"div"> & { as?: ItemTag }) {
  const Component = ITEM_TAG_COMPONENTS[as] as typeof motion.div;

  return <Component variants={itemVariants} {...props} />;
}
