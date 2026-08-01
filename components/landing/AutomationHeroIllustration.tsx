"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { animate } from "animejs";

import { prefersReducedMotion } from "@/lib/motion/tokens";
import GitHubMark from "@/components/landing/GitHubMark";

type PlatformId = "instagram" | "whatsapp" | "linkedin" | "github";

type Platform = {
  id: PlatformId;
  /** Logo center, in the shared 0 0 1200 600 viewBox. */
  x: number;
  y: number;
  /**
   * Motion guide for the traveling arrow, doubling as the drawn line itself
   * — every path starts at the exact same point (600,300, the AutoPilot
   * logo) so the arrow never has to jump between platforms, only reverse
   * back to a shared origin.
   */
  path: string;
  Icon: () => ReactNode;
};

// Sequenced clockwise: top-left -> top-right -> bottom-right -> bottom-left.
const PLATFORMS: Platform[] = [
  {
    id: "instagram",
    x: 210,
    y: 110,
    path: "M600,300 Q480,140 210,110",
    Icon: () => <Image src="/landing/insta.png" alt="Instagram" width={48} height={48} className="h-full w-full object-contain" />,
  },
  {
    id: "whatsapp",
    x: 990,
    y: 110,
    path: "M600,300 Q720,140 990,110",
    Icon: () => <Image src="/landing/whatsapps.png" alt="WhatsApp" width={48} height={48} className="h-full w-full object-contain" />,
  },
  {
    id: "linkedin",
    x: 990,
    y: 490,
    path: "M600,300 Q720,460 990,490",
    Icon: () => <Image src="/landing/linkedin.png" alt="LinkedIn" width={48} height={48} className="h-full w-full object-contain" />,
  },
  {
    id: "github",
    x: 210,
    y: 490,
    path: "M600,300 Q480,460 210,490",
    Icon: () => <GitHubMark />,
  },
];

const TRAVEL_MS = 1500;
const PAUSE_MS = 500;
/** Viewbox units to stop short of a platform logo's center — roughly its
 * on-screen radius, so the arrow's tip lands at the logo's edge instead of
 * flying in on top of it. */
const LOGO_STOP_MARGIN = 50;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function AutomationHeroIllustration() {
  const arrowRef = useRef<SVGPathElement | null>(null);
  const pathRefs = useRef(new Map<PlatformId, SVGPathElement>());
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setReduced(true);
      return;
    }

    let cancelled = false;

    // Drives the arrow's transform and the line's stroke-dashoffset off one
    // shared progress value (t, 0 = AutoPilot .. `reach` = the logo's edge,
    // never quite 1/the logo's center) instead of two separately-tweened
    // animations. anime's own `direction: "reverse"` doesn't reliably
    // reverse a freshly-created motion-path tween, which silently sent the
    // arrow the wrong way on the return leg — driving both from a single
    // onUpdate makes them impossible to desync, and makes forward/back both
    // plain, explicit [from, to] ranges.
    function travel(id: PlatformId, reverse: boolean) {
      const pathEl = pathRefs.current.get(id);
      const arrow = arrowRef.current;
      if (!pathEl || !arrow) return Promise.resolve();

      const totalLength = pathEl.getTotalLength();
      const reach = Math.max(0, 1 - LOGO_STOP_MARGIN / totalLength);
      const state = { t: reverse ? reach : 0 };

      return new Promise<void>((resolve) => {
        animate(state, {
          t: reverse ? [reach, 0] : [0, reach],
          duration: TRAVEL_MS,
          ease: "inOutQuad",
          onUpdate: () => {
            const len = state.t * totalLength;
            // Sample the tangent in the direction of actual travel, not the
            // path's fixed parametric direction — on the return leg that's
            // backward (toward AutoPilot), so `ahead`/`behind` swap via the
            // sign of `delta`. Without this the arrowhead kept pointing
            // toward the platform the whole way back instead of flipping
            // to face the direction it's now moving.
            const delta = reverse ? -1 : 1;
            const ahead = pathEl.getPointAtLength(Math.min(totalLength, Math.max(0, len + delta)));
            const behind = pathEl.getPointAtLength(Math.min(totalLength, Math.max(0, len - delta)));
            const point = pathEl.getPointAtLength(len);
            const angle = (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI;

            arrow.style.transform = `translate(${point.x}px, ${point.y}px) rotate(${angle}deg)`;
            pathEl.style.strokeDashoffset = String(1 - state.t);
          },
          onComplete: () => resolve(),
        });
      });
    }

    async function loop() {
      let index = 0;

      while (!cancelled) {
        const platform = PLATFORMS[index];

        await travel(platform.id, false);
        if (cancelled) return;

        await wait(PAUSE_MS);
        if (cancelled) return;

        await travel(platform.id, true);
        if (cancelled) return;

        await wait(PAUSE_MS);
        index = (index + 1) % PLATFORMS.length;
      }
    }

    void loop();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div aria-hidden="true" className="relative mx-auto aspect-[2/1] w-full max-w-[580px]">
      {/* The connector paths double as the motion guide (travel() reads
          their real geometry via getPointAtLength) and the drawn line
          itself — hidden at rest via the pathLength=1 trick, only ever
          visible while its own travel() tween is actively running. */}
      <svg viewBox="0 0 1200 600" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet">
        {PLATFORMS.map((platform) => (
          <path
            key={platform.id}
            ref={(el) => {
              if (el) pathRefs.current.set(platform.id, el);
            }}
            d={platform.path}
            pathLength={1}
            fill="none"
            stroke="#3B82F6"
            strokeWidth={2}
            strokeLinecap="round"
            style={reduced ? undefined : { strokeDasharray: 1, strokeDashoffset: 1 }}
            opacity={reduced ? 0 : undefined}
          />
        ))}
      </svg>

      <div className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl sm:h-16 sm:w-16">
        <Image src="/landing/final-center-logo.png" alt="AutoPilot" width={64} height={64} className="h-full w-full object-contain" priority />
      </div>

      {PLATFORMS.map((platform) => (
        <div
          key={platform.id}
          className="absolute h-10 w-10 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl sm:h-12 sm:w-12"
          style={{ left: `${(platform.x / 1200) * 100}%`, top: `${(platform.y / 600) * 100}%` }}
        >
          <platform.Icon />
        </div>
      ))}

      {/* The arrow rides in its own SVG layered after the logos, so it's
          always visible on top of them — including while passing directly
          over a logo near either end of its trip, which the previous single
          shared SVG (painted before the logo divs) hid it behind. */}
      {!reduced && (
        <svg viewBox="0 0 1200 600" className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet">
          {/* The only animated element — a small arrowhead riding the active
              platform's path, auto-rotated to match direction of travel.
              Drawn pointing right (0deg) at rest so the computed tangent
              angle in travel() lines up directly with no offset correction
              needed. */}
          <path
            ref={arrowRef}
            d="M-13,-14 L18,0 L-13,14 L-8,0 Z"
            fill="#3B82F6"
            style={{ transform: "translate(600px, 300px)" }}
          />
        </svg>
      )}
    </div>
  );
}
