"use client";

import { motion } from "motion/react";
import { Clock, ImageIcon } from "lucide-react";

import { BADGE_SURFACE, CARD_SURFACE, ICON_STROKE, STEP_TRANSITION, useStepCycle } from "./shared";

const DAYS = Array.from({ length: 21 }, (_, i) => i + 1);
const TARGET_DAY = 16;

// Steps: 0 rest, content chip waiting Β· 1 AI finds the best slot Β·
// 2-3 chip moves into the optimal cell (shared layoutId FLIP) Β· 4 time label
// appears Β· 5 queue gains the scheduled post Β· 6 hold, then loop.
export default function SmartSchedulingIllustration() {
  const { step, ref } = useStepCycle(7, 1300);
  const placed = step >= 2;

  return (
    <div ref={ref} className="flex h-full w-full flex-col items-center justify-center gap-5 bg-white p-6 sm:p-10">
      <div className="flex w-full max-w-md items-center justify-between">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-dashed border-slate-300">
            {!placed && (
              <motion.div layoutId="scheduling-chip" className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-white shadow-sm">
                <ImageIcon size={16} strokeWidth={ICON_STROKE} />
              </motion.div>
            )}
          </div>
          <span className="text-xs font-medium text-slate-400">New post</span>
        </div>

        <motion.div
          className={`flex items-center gap-1.5 ${BADGE_SURFACE} px-3 py-2 text-primary`}
          animate={{ opacity: step === 1 ? 1 : 0, scale: step === 1 ? 1 : 0.85 }}
          transition={STEP_TRANSITION}
        >
          <Clock size={14} strokeWidth={ICON_STROKE} />
          <span className="text-xs font-semibold">Finding best time</span>
        </motion.div>
      </div>

      <div className={`${CARD_SURFACE} w-full max-w-md p-5`}>
        <div className="grid grid-cols-7 gap-2">
          {DAYS.map((day) => {
            const isTarget = day === TARGET_DAY;
            const filled = isTarget && placed;
            return (
              <div
                key={day}
                className={`flex h-10 items-center justify-center rounded-md text-xs font-medium transition-colors duration-300 ${
                  filled ? "bg-primary/10" : "bg-slate-50 text-slate-400"
                }`}
              >
                {filled ? (
                  <motion.div layoutId="scheduling-chip" className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-white shadow-sm">
                    <ImageIcon size={13} strokeWidth={ICON_STROKE} />
                  </motion.div>
                ) : (
                  <span>{day}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex w-full max-w-md items-center justify-between">
        <motion.span
          className="inline-flex items-center gap-1.5 rounded-full bg-primary-tint px-3 py-1.5 text-xs font-semibold text-primary"
          animate={{ opacity: step >= 4 ? 1 : 0, y: step >= 4 ? 0 : 6 }}
          transition={STEP_TRANSITION}
        >
          <Clock size={13} strokeWidth={ICON_STROKE} />
          2:30 PM Β· Peak reach
        </motion.span>

        <motion.div
          className="flex items-center gap-2"
          animate={{ opacity: step >= 5 ? 1 : 0 }}
          transition={STEP_TRANSITION}
        >
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Queue</span>
          <span className="h-2 w-2 rounded-full bg-slate-300" />
          <span className="h-2 w-2 rounded-full bg-slate-300" />
          <motion.span
            className="h-2 w-2 rounded-full bg-primary"
            animate={{ scale: step >= 5 ? [1, 1.5, 1] : 1 }}
            transition={{ duration: 0.6 }}
          />
        </motion.div>
      </div>
    </div>
  );
}
