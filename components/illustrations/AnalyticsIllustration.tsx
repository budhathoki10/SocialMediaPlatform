"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { TrendingUp } from "lucide-react";

import { CARD_SURFACE, ICON_STROKE, LiveDot, useStepCycle } from "./shared";

const BAR_COUNT = 6;
const CHART_WIDTH = 380;
const CHART_HEIGHT = 130;

// Ambient/continuous rather than narrative steps — useStepCycle here just
// supplies a paused-when-offscreen, frozen-when-reduced-motion tick counter
// that drives the counters/bars/line, not a discrete reveal sequence.
export default function AnalyticsIllustration() {
  const { step, ref } = useStepCycle(240, 120);

  const engagement = 12480 + Math.round(step * 0.6 + 10 * Math.sin(step * 0.25));
  const reach = 3260 + Math.round(step * 0.22 + 6 * Math.sin(step * 0.2 + 1));

  const barHeights = useMemo(
    () => Array.from({ length: BAR_COUNT }, (_, i) => 26 + 44 * (0.5 + 0.5 * Math.sin(step * 0.14 + i * 0.9))),
    [step],
  );

  const linePath = useMemo(() => {
    const points = barHeights.map((h, i) => {
      const x = (i / (BAR_COUNT - 1)) * CHART_WIDTH;
      const y = CHART_HEIGHT - h - 10;
      return `${x},${y}`;
    });
    return `M${points.join(" L")}`;
  }, [barHeights]);

  return (
    <div ref={ref} className="flex h-full w-full items-center justify-center bg-white p-6 sm:p-10">
      <div className={`${CARD_SURFACE} w-full max-w-lg p-7`}>
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-slate-500">Performance</span>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
            <LiveDot />
            Live
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-400">Engagement</p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-2xl font-bold tabular-nums text-slate-900">{engagement.toLocaleString()}</span>
              <TrendingUp size={16} strokeWidth={ICON_STROKE} className="text-emerald-500" />
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-400">Reach</p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-2xl font-bold tabular-nums text-slate-900">{reach.toLocaleString()}</span>
              <TrendingUp size={16} strokeWidth={ICON_STROKE} className="text-emerald-500" />
            </div>
          </div>
        </div>

        <div className="relative mt-5 h-[130px] w-full">
          <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
            <motion.path
              d={linePath}
              fill="none"
              stroke="#818CF8"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              animate={{ pathLength: [0, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-end justify-between gap-2.5 px-0.5">
            {barHeights.map((h, i) => (
              <div key={i} className="flex-1 rounded-t-sm bg-gradient-to-t from-primary to-indigo-300" style={{ height: `${h}px` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
