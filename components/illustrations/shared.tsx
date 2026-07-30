"use client";

import { useEffect, useId, useRef, useState } from "react";
import { motion } from "motion/react";
import { MOTION_EASE, prefersReducedMotion } from "@/lib/motion/tokens";

/**
 * Drives every illustration's step sequence. One-shot reduced-motion check —
 * if the user prefers reduced motion, freezes on the LAST step (the settled/
 * complete state reads better than a mid-sequence frame) and never starts a
 * timer. Otherwise loops 0..stepCount-1 on an interval, pausing while
 * scrolled off-screen — cheap courtesy now that there's no heavy WebGL
 * context to gate, just a timer to pause.
 */
export function useStepCycle(stepCount: number, stepMs: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [reduced] = useState(prefersReducedMotion);
  const [step, setStep] = useState(() => (prefersReducedMotion() ? stepCount - 1 : 0));

  useEffect(() => {
    if (reduced) return;
    const node = containerRef.current;
    if (!node) return;

    let interval: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      if (interval) return;
      interval = setInterval(() => setStep((s) => (s + 1) % stepCount), stepMs);
    };
    const stop = () => {
      clearInterval(interval);
      interval = undefined;
    };

    const observer = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()), { threshold: 0.2 });
    observer.observe(node);

    return () => {
      stop();
      observer.disconnect();
    };
  }, [reduced, stepCount, stepMs]);

  return { step, ref: containerRef };
}

// Shared visual language across all four illustrations — same surface, same
// icon stroke weight, same motion timing — so they read as one system.
export const CARD_SURFACE = "rounded-2xl bg-white shadow-card";
export const BADGE_SURFACE = "rounded-full border border-slate-200 bg-white shadow-sm";
export const ICON_STROKE = 1.75;
export const STEP_TRANSITION = { duration: 0.45, ease: MOTION_EASE.outExpo };

export function TypingText({ text, active, className }: { text: string; active: boolean; className?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0);
    if (!active) return;
    const id = setInterval(() => {
      setCount((c) => (c < text.length ? c + 1 : c));
    }, 32);
    return () => clearInterval(id);
  }, [active, text]);

  return (
    <span className={className}>
      {text.slice(0, count)}
      {active && count < text.length ? (
        <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-current" />
      ) : null}
    </span>
  );
}

export function ConnectorLine({ d, draw, className }: { d: string; draw: boolean; className?: string }) {
  return (
    <motion.path
      d={d}
      fill="none"
      stroke="currentColor"
      strokeWidth={ICON_STROKE}
      strokeLinecap="round"
      className={className}
      initial={false}
      animate={{ pathLength: draw ? 1 : 0, opacity: draw ? 1 : 0 }}
      transition={STEP_TRANSITION}
    />
  );
}

export function LiveDot({ className }: { className?: string }) {
  return (
    <span className={`relative flex h-2 w-2 ${className ?? ""}`}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:animate-none" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
    </span>
  );
}

export function LinkedInMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#0A66C2" d="M19 0H5a5 5 0 0 0-5 5v14a5 5 0 0 0 5 5h14a5 5 0 0 0 5-5V5a5 5 0 0 0-5-5Z" />
      <path
        fill="#fff"
        d="M7.2 19H3.8V8.1h3.4V19ZM5.5 6.6a2 2 0 1 1 0-4 2 2 0 0 1 0 4ZM20.2 19h-3.4v-5.3c0-1.3 0-2.9-1.8-2.9s-2.1 1.4-2.1 2.8V19H9.5V8.1h3.3v1.5h.1a3.6 3.6 0 0 1 3.2-1.8c3.5 0 4.1 2.3 4.1 5.2v6Z"
      />
    </svg>
  );
}

export function InstagramMark({ className }: { className?: string }) {
  const gradientId = useId();
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={gradientId} cx="30%" cy="107%" r="120%">
          <stop offset="0" stopColor="#FFD600" />
          <stop offset=".48" stopColor="#FF0169" />
          <stop offset="1" stopColor="#D300C5" />
        </radialGradient>
      </defs>
      <path
        fill={`url(#${gradientId})`}
        d="M7.03.084C5.753.144 4.881.348 4.119.647c-.789.308-1.458.72-2.123 1.388C1.33 2.703.921 3.372.616 4.162.321 4.926.121 5.799.064 7.076.008 8.354-.005 8.764.002 12.023c.006 3.259.02 3.667.082 4.947.061 1.277.264 2.148.564 2.911.308.789.72 1.457 1.388 2.123.668.665 1.336 1.074 2.128 1.38.763.295 1.636.496 2.914.552 1.277.056 1.688.069 4.946.063 3.258-.006 3.668-.021 4.948-.081 1.28-.061 2.147-.266 2.91-.563.789-.309 1.458-.72 2.123-1.388.665-.668 1.074-1.338 1.379-2.128.296-.764.497-1.636.552-2.913.056-1.28.069-1.689.063-4.948-.006-3.258-.021-3.667-.082-4.946-.061-1.28-.264-2.149-.563-2.912-.308-.789-.72-1.457-1.388-2.123C21.298 1.33 20.628.921 19.838.617 19.074.321 18.202.12 16.924.065 15.647.009 15.236-.005 11.977.001 8.718.008 8.31.022 7.03.084Zm.14 21.693c-1.17-.051-1.805-.245-2.229-.408-.56-.216-.96-.477-1.382-.895-.422-.418-.681-.819-.9-1.378-.164-.424-.362-1.058-.417-2.228-.059-1.265-.072-1.644-.079-4.848-.007-3.204.005-3.583.061-4.848.05-1.169.246-1.805.408-2.228.216-.561.476-.96.895-1.382.419-.422.818-.681 1.378-.9.423-.165 1.058-.361 2.227-.417 1.266-.06 1.645-.072 4.848-.079 3.203-.007 3.584.005 4.85.061 1.169.051 1.805.244 2.228.408.561.216.96.475 1.382.895.422.419.682.818.901 1.379.165.422.362 1.056.417 2.226.06 1.266.074 1.645.08 4.848.006 3.203-.006 3.583-.061 4.848-.051 1.17-.245 1.806-.408 2.23-.216.56-.476.96-.895 1.381-.419.422-.818.681-1.378.9-.423.165-1.058.362-2.227.417-1.266.06-1.645.072-4.849.079-3.205.007-3.583-.006-4.848-.061ZM16.953 5.586a1.44 1.44 0 1 0 2.88 0 1.44 1.44 0 0 0-2.88 0ZM5.839 12.012a6.161 6.161 0 1 0 12.322-.024 6.161 6.161 0 0 0-12.322.024ZM8 12.008a4 4 0 1 1 8-.016 4 4 0 0 1-8 .016Z"
      />
    </svg>
  );
}

export function WhatsAppMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#25D366"
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"
      />
    </svg>
  );
}

export function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 44 44" className={className} aria-hidden="true">
      <rect width="44" height="44" rx="12" fill="#24292F" />
      <path
        fill="#FFFFFF"
        d="M22 8.8c-7.4 0-13.4 6-13.4 13.4 0 5.9 3.8 10.9 9.2 12.7.7.1.9-.3.9-.6v-2.4c-3.7.8-4.5-1.6-4.5-1.6-.6-1.5-1.5-1.9-1.5-1.9-1.2-.8.1-.8.1-.8 1.3.1 2 1.4 2 1.4 1.2 2 3 1.4 3.8 1.1.1-.9.5-1.4.8-1.8-3-.3-6.1-1.5-6.1-6.6 0-1.5.5-2.6 1.4-3.6-.1-.3-.6-1.7.1-3.5 0 0 1.1-.4 3.7 1.4 1.1-.3 2.2-.4 3.4-.4s2.3.1 3.4.4c2.6-1.8 3.7-1.4 3.7-1.4.7 1.8.2 3.2.1 3.5.9 1 1.4 2.1 1.4 3.6 0 5.1-3.1 6.3-6.1 6.6.5.4.9 1.2.9 2.5v3.6c0 .4.2.8.9.6a13.4 13.4 0 0 0 9.2-12.7c0-7.5-6-13.5-13.4-13.5Z"
      />
    </svg>
  );
}
