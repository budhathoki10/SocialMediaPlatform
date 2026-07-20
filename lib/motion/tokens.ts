/**
 * Motion design system — single source of truth for every animation in the app.
 *
 * GSAP owns scroll orchestration (landing), Motion owns component transitions
 * (dashboard, route changes), anime.js owns vector/SVG work. All three pull
 * timing from here; never hardcode durations/easings in components.
 *
 * CSS mirrors of these values live in globals.css under "Motion tokens".
 */

/** Durations in seconds (GSAP/Motion convention). */
export const DURATION = {
  /** State flips: toggles, color changes. */
  instant: 0.1,
  /** Micro-interactions: hover, press, focus. */
  fast: 0.15,
  /** Standard component transitions. */
  base: 0.25,
  /** Panel/card entrances, exits. */
  slow: 0.4,
  /** Section reveals on scroll. */
  reveal: 0.8,
  /** Hero/headline choreography. */
  hero: 0.9,
} as const;

/** GSAP easing strings. */
export const EASE = {
  /** House easing — matches the cubic-bezier(0.16,1,0.3,1) used across globals.css. */
  outExpo: "expo.out",
  out: "power3.out",
  inOut: "power2.inOut",
  /** Playful overshoot for pills/badges/small items (skill preset). */
  back: "back.out(1.4)",
  /** Scrubbed tweens must be linear — scroll position provides the easing. */
  none: "none",
} as const;

/** anime.js v4 easing strings — different naming convention than GSAP's. */
export const ANIME_EASE = {
  outExpo: "outExpo",
  outQuad: "outQuad",
} as const;

/** Motion (motion.dev) easing curves — array form of the same house curve GSAP/CSS use. */
export const MOTION_EASE = {
  outExpo: [0.16, 1, 0.3, 1],
} as const;

/** Motion (motion.dev) spring presets. */
export const SPRING = {
  /** Buttons, toggles, small controls. */
  press: { type: "spring", stiffness: 500, damping: 30, mass: 0.7 },
  /** Cards, panels, list items. */
  gentle: { type: "spring", stiffness: 260, damping: 26, mass: 1 },
  /** Expanding panels, accordions. */
  panel: { type: "spring", stiffness: 210, damping: 28, mass: 1 },
} as const;

/** Stagger intervals in seconds. */
export const STAGGER = {
  /** Dense grids: pills, icons, table rows. */
  tight: 0.05,
  /** Cards and list items. */
  base: 0.08,
  /** Large sections / footer columns. */
  loose: 0.12,
} as const;

/** Shared media query — every engine checks this before animating. */
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
export const MOTION_OK_QUERY = "(prefers-reduced-motion: no-preference)";

/**
 * The one reduced-motion check every imperative animation call site shares
 * — anime.js tweens and Motion's standalone animate() on a bare
 * MotionValue both sit outside GSAP's own matchMedia gate and outside
 * <MotionConfig reducedMotion="user">'s automatic prop-based handling, so
 * they check this directly instead of duplicating the matchMedia call.
 *
 * Deliberately a plain synchronous function, not a stateful hook: call it
 * inside the same effect that would start the animation. A hook that
 * mirrors matchMedia into useState only resolves the real value one render
 * after mount, which leaves a window where the animation can start before
 * the preference is known — exactly the flash this exists to prevent.
 */
export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}
