"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useMotionValue } from "motion/react";

import { prefersReducedMotion } from "@/lib/motion/tokens";

type Point = { x: number; y: number };

const VIEW_W = 420;
const VIEW_H = 280;
// The viewBox's y-origin is shifted up by TOP_HEADROOM (via a negative min-y
// below) rather than baked into every coordinate — it exists purely so the
// arrow has room to rise above the tallest bar without touching the frame.
const TOP_HEADROOM = 34;
const BASELINE = 246;
const BAR_WIDTH = 26;
// Extrusion vector for the pseudo-3D faces — up and to the right, so each
// bar reads as a lit rectangular prism rather than a flat rectangle.
const DEPTH = { x: 15, y: -9 };
// Fixed vertical clearance between every bar's top and the trend line above
// it — constant, never proportional, so the line reads as a separate,
// floating indicator rather than something resting on the bars.
const LINE_GAP = 24;

// Static, already-accumulated performance data — shortest to tallest, left
// to right, evenly spaced. These never animate; only the trend line does.
const BARS: { x: number; top: number }[] = [
  { x: 39.5, top: 214.1 },
  { x: 96.5, top: 186.2 },
  { x: 153.5, top: 154.9 },
  { x: 210.5, top: 120.1 },
  { x: 267.5, top: 85.3 },
  { x: 324.5, top: 54 },
];

function barFaces(x: number, top: number) {
  const bw = BAR_WIDTH;
  const { x: dx, y: dy } = DEPTH;
  return {
    front: `${x},${top} ${x + bw},${top} ${x + bw},${BASELINE} ${x},${BASELINE}`,
    top: `${x},${top} ${x + bw},${top} ${x + bw + dx},${top + dy} ${x + dx},${top + dy}`,
    side: `${x + bw},${top} ${x + bw + dx},${top + dy} ${x + bw + dx},${BASELINE + dy} ${x + bw},${BASELINE}`,
  };
}

// Milestones: one point floating LINE_GAP above each bar's peak. The curve
// through them mirrors the bars' growth silhouette while staying visibly
// separate from it — never touching, never overlapping.
const MILESTONES: Point[] = BARS.map((b) => ({ x: b.x + BAR_WIDTH / 2, y: b.top - LINE_GAP }));

// Nodes are only rendered at a few of the milestones — restrained "strategic"
// markers rather than one per bar, which would read as clutter.
const NODE_INDICES = [1, 3, 5];

/**
 * Smooth quadratic curve through the midpoint of each consecutive pair, using
 * the real points as control points. A quadratic Bezier always stays within
 * the convex hull of its three control points — since all three here sit
 * between pointA.y and pointB.y, each segment is mathematically guaranteed to
 * stay within that range. Given monotonically increasing input, the curve can
 * never dip below where it's already been: this is what makes "smooth,
 * intentional upward curve" and "never touches the bars" both hold at once.
 */
function buildMonotoneSmoothPath(points: Point[]) {
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    d += ` Q${p0.x},${p0.y} ${(p0.x + p1.x) / 2},${(p0.y + p1.y) / 2}`;
  }
  const last = points[points.length - 1];
  d += ` T${last.x},${last.y}`;
  return d;
}

// The path continues past the final bar with two more control points — a
// gentle lead-in (EXTEND) followed by the arrow's resting tip (TIP) — so the
// curve's final approach isn't a sharp bend straight into the arrowhead.
const lastMilestone = MILESTONES[MILESTONES.length - 1];
const EXTEND: Point = { x: lastMilestone.x + 26, y: lastMilestone.y - 14 };
const TIP: Point = { x: lastMilestone.x + 50, y: lastMilestone.y - 30 };

const LINE_PATH = buildMonotoneSmoothPath([...MILESTONES, EXTEND, TIP]);

// Arrowhead drawn in local space with its tip at the origin, pointing along
// +x, with a slight concave back edge (a chevron rather than a plain
// triangle) for a sharper, more deliberate silhouette. Positioned each frame
// via a translate+rotate transform so it always sits at the growing line's
// leading edge, oriented along its current direction of travel.
const ARROW_LEN = 25;
const ARROW_HALF_W = 10.5;
const ARROW_NOTCH = ARROW_LEN * 0.58;
const ARROW_LOCAL_POINTS = `0,0 ${-ARROW_LEN},${-ARROW_HALF_W} ${-ARROW_NOTCH},0 ${-ARROW_LEN},${ARROW_HALF_W}`;

const INITIAL_ANGLE =
  (Math.atan2(MILESTONES[1].y - MILESTONES[0].y, MILESTONES[1].x - MILESTONES[0].x) * 180) / Math.PI;
const INITIAL_TRANSFORM = `translate(${MILESTONES[0].x} ${MILESTONES[0].y}) rotate(${INITIAL_ANGLE})`;

const DRAW_DURATION = 5;
const HOLD_MS = 1100;
const FADE_OUT_DURATION = 0.6;
const FADE_IN_DURATION = 0.7;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function angleAt(path: SVGPathElement, t: number) {
  const length = path.getTotalLength();
  const point = path.getPointAtLength(length * t);
  const behind = path.getPointAtLength(length * Math.max(0, t - 0.01));
  const angle = (Math.atan2(point.y - behind.y, point.x - behind.x) * 180) / Math.PI;
  return { point, angle };
}

export default function AnalyticsIllustration() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const arrowRef = useRef<SVGGElement>(null);
  const nodeRefs = useRef<(SVGCircleElement | null)[]>([]);
  const progress = useMotionValue(0);
  const opacity = useMotionValue(1);
  const controlsRef = useRef<{ pause: () => void; play: () => void; stop: () => void } | null>(null);

  const onProgress = (t: number) => {
    const path = pathRef.current;
    const arrow = arrowRef.current;
    if (!path || !arrow) return;
    const { point, angle } = angleAt(path, t);
    arrow.setAttribute("transform", `translate(${point.x} ${point.y}) rotate(${angle})`);

    NODE_INDICES.forEach((milestoneIndex, i) => {
      const node = nodeRefs.current[i];
      if (!node) return;
      const reached = point.x >= MILESTONES[milestoneIndex].x;
      node.style.opacity = reached ? "1" : "0";
      node.style.transform = reached ? "scale(1)" : "scale(0.35)";
    });
  };

  // Keep the arrowhead and milestone nodes glued to the line's leading edge.
  useEffect(() => onProgress(progress.get()), []);
  useEffect(() => progress.on("change", onProgress), []);

  // Slow, continuous "live growth" loop: draw the line from the first bar to
  // the last, hold briefly on the completed climb, then fade out, reset, and
  // fade back in — the reset is masked by the fade so it never reads as the
  // line snapping backward.
  useEffect(() => {
    if (prefersReducedMotion()) {
      progress.set(1);
      opacity.set(1);
      onProgress(1);
      return;
    }

    let stopped = false;
    let started = false;

    async function cycle() {
      while (!stopped) {
        progress.set(0);
        const draw = animate(progress, 1, { duration: DRAW_DURATION, ease: "easeInOut" });
        controlsRef.current = draw;
        await draw;
        if (stopped) break;

        await wait(HOLD_MS);
        if (stopped) break;

        const fadeOut = animate(opacity, 0, { duration: FADE_OUT_DURATION, ease: "easeInOut" });
        controlsRef.current = fadeOut;
        await fadeOut;
        if (stopped) break;

        progress.set(0);
        await wait(60);
        if (stopped) break;

        const fadeIn = animate(opacity, 1, { duration: FADE_IN_DURATION, ease: "easeInOut" });
        controlsRef.current = fadeIn;
        await fadeIn;
      }
    }

    const node = containerRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!started) {
            started = true;
            cycle();
          } else {
            controlsRef.current?.play();
          }
        } else {
          controlsRef.current?.pause();
        }
      },
      { threshold: 0.2 },
    );
    if (node) observer.observe(node);

    return () => {
      stopped = true;
      controlsRef.current?.stop();
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="flex h-full w-full items-center justify-center bg-white p-8 sm:p-12">
      <div className="w-full max-w-lg" style={{ aspectRatio: `${VIEW_W} / ${VIEW_H + TOP_HEADROOM}` }}>
        <svg
          viewBox={`0 ${-TOP_HEADROOM} ${VIEW_W} ${VIEW_H + TOP_HEADROOM}`}
          className="h-full w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="analytics-bar-front" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A5B4FC" />
              <stop offset="48%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#4338CA" />
            </linearGradient>
            <radialGradient id="analytics-bar-top" cx="28%" cy="22%" r="95%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="55%" stopColor="#E0E7FF" />
              <stop offset="100%" stopColor="#C7D2FE" />
            </radialGradient>
            <linearGradient id="analytics-bar-side" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4F46E5" />
              <stop offset="100%" stopColor="#312E81" />
            </linearGradient>
            <linearGradient id="analytics-gloss" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="analytics-shadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#312E81" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#312E81" stopOpacity="0" />
            </radialGradient>
            <filter id="analytics-shadow-blur" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="2.2" />
            </filter>
            <linearGradient
              id="analytics-line-gradient"
              gradientUnits="userSpaceOnUse"
              x1={MILESTONES[0].x}
              y1={MILESTONES[0].y}
              x2={TIP.x}
              y2={TIP.y}
            >
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#A5B4FC" />
            </linearGradient>
            <linearGradient id="analytics-arrow-gradient" gradientUnits="userSpaceOnUse" x1={-ARROW_LEN} y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="#4338CA" />
              <stop offset="100%" stopColor="#A5B4FC" />
            </linearGradient>
            <radialGradient id="analytics-arrow-halo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#818CF8" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
            </radialGradient>
            <filter id="analytics-halo-blur" x="-150%" y="-150%" width="400%" height="400%">
              <feGaussianBlur stdDeviation="4.5" />
            </filter>
            <filter id="analytics-line-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#4F46E5" floodOpacity="0.35" />
            </filter>
            <radialGradient id="analytics-node-fill" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#818CF8" />
            </radialGradient>
          </defs>

          {BARS.map((bar, i) => {
            const faces = barFaces(bar.x, bar.top);
            const cx = bar.x + BAR_WIDTH / 2;
            return (
              <g key={i}>
                <ellipse
                  cx={cx}
                  cy={BASELINE + 5}
                  rx={BAR_WIDTH * 0.9}
                  ry={5.5}
                  fill="url(#analytics-shadow)"
                  filter="url(#analytics-shadow-blur)"
                />
                <polygon points={faces.side} fill="url(#analytics-bar-side)" />
                <polygon
                  points={faces.front}
                  fill="url(#analytics-bar-front)"
                  stroke="#FFFFFF"
                  strokeOpacity={0.16}
                  strokeWidth={1}
                />
                <rect
                  x={bar.x + BAR_WIDTH * 0.14}
                  y={bar.top}
                  width={BAR_WIDTH * 0.22}
                  height={BASELINE - bar.top}
                  fill="url(#analytics-gloss)"
                />
                <polygon
                  points={faces.top}
                  fill="url(#analytics-bar-top)"
                  stroke="#FFFFFF"
                  strokeOpacity={0.5}
                  strokeWidth={1}
                />
              </g>
            );
          })}

          <motion.g style={{ opacity }}>
            <motion.path
              ref={pathRef}
              d={LINE_PATH}
              fill="none"
              stroke="url(#analytics-line-gradient)"
              strokeWidth={5}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#analytics-line-glow)"
              style={{ pathLength: progress }}
            />

            {NODE_INDICES.map((milestoneIndex, i) => {
              const m = MILESTONES[milestoneIndex];
              return (
                <circle
                  key={milestoneIndex}
                  ref={(el) => {
                    nodeRefs.current[i] = el;
                  }}
                  cx={m.x}
                  cy={m.y}
                  r={4.5}
                  fill="url(#analytics-node-fill)"
                  filter="url(#analytics-line-glow)"
                  style={{
                    opacity: 0,
                    transform: "scale(0.35)",
                    transformBox: "fill-box",
                    transformOrigin: "center",
                    transition: "opacity 0.45s ease, transform 0.45s ease",
                  }}
                />
              );
            })}

            <g ref={arrowRef} transform={INITIAL_TRANSFORM}>
              <circle r={15} fill="url(#analytics-arrow-halo)" filter="url(#analytics-halo-blur)" />
              <polygon
                points={ARROW_LOCAL_POINTS}
                fill="url(#analytics-arrow-gradient)"
                stroke="#FFFFFF"
                strokeOpacity={0.35}
                strokeWidth={1}
                filter="url(#analytics-line-glow)"
              />
            </g>
          </motion.g>
        </svg>
      </div>
    </div>
  );
}
