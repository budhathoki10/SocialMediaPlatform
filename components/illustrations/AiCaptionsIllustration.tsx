"use client";

import { motion } from "motion/react";
import { CheckCircle2, ImageIcon, Sparkles } from "lucide-react";

import {
  BADGE_SURFACE,
  CARD_SURFACE,
  ICON_STROKE,
  InstagramMark,
  LinkedInMark,
  STEP_TRANSITION,
  TypingText,
  WhatsAppMark,
  useStepCycle,
} from "./shared";

const CAPTION = "Just shipped our AI content engine. Try it free today!";
const PLATFORMS = [LinkedInMark, InstagramMark, WhatsAppMark];

// Steps: 0 rest (card only) Β· 1 AI reads the post Β· 2-3 caption types out Β·
// 4 platform-specific versions appear Β· 5 ready-to-publish Β· 6 hold, then loop.
export default function AiCaptionsIllustration() {
  const { step, ref } = useStepCycle(7, 1300);
  const typing = step >= 2 && step < 6;

  return (
    <div ref={ref} className="flex h-full w-full items-center justify-center bg-white p-6 sm:p-10">
      <div className="w-full max-w-md">
        <div className="relative">
          <div className={`${CARD_SURFACE} p-5`}>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                <ImageIcon size={18} strokeWidth={ICON_STROKE} />
              </div>
              <div className="flex-1 space-y-2">
                <div className="h-2.5 w-28 rounded-full bg-slate-200" />
                <div className="h-2.5 w-20 rounded-full bg-slate-100" />
              </div>
            </div>
            <div className="mt-4 h-24 w-full rounded-lg bg-slate-100" />
          </div>

          <motion.div
            className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-primary"
            animate={{ opacity: step === 1 ? [0.15, 0.5, 0.15] : 0 }}
            transition={step === 1 ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" } : STEP_TRANSITION}
          />

          <motion.div
            className={`absolute -right-3 -top-3 flex items-center gap-1 ${BADGE_SURFACE} px-2.5 py-1.5 text-primary`}
            animate={{ opacity: step >= 1 ? 1 : 0, scale: step >= 1 ? 1 : 0.75 }}
            transition={STEP_TRANSITION}
          >
            <Sparkles size={13} strokeWidth={ICON_STROKE} />
            <span className="text-[11px] font-semibold">AI</span>
          </motion.div>
        </div>

        <motion.p
          className="mt-5 min-h-[2.6em] text-base leading-relaxed text-slate-700"
          animate={{ opacity: step >= 2 ? 1 : 0, y: step >= 2 ? 0 : 8 }}
          transition={STEP_TRANSITION}
        >
          <TypingText text={CAPTION} active={typing} />
        </motion.p>

        <motion.div
          className="mt-5 flex items-center gap-2.5"
          animate={{ opacity: step >= 4 ? 1 : 0, y: step >= 4 ? 0 : 8 }}
          transition={STEP_TRANSITION}
        >
          {PLATFORMS.map((Mark, i) => {
            const highlighted = step >= 4 && step % PLATFORMS.length === i;
            return (
              <motion.span
                key={i}
                className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full"
                animate={{ scale: highlighted ? 1.15 : 1, boxShadow: highlighted ? "0 0 0 2px #4F46E5" : "0 0 0 0px #4F46E5" }}
                transition={STEP_TRANSITION}
              >
                <Mark className="h-full w-full" />
              </motion.span>
            );
          })}
        </motion.div>

        <motion.div
          className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-700"
          animate={{ opacity: step >= 5 ? 1 : 0, y: step >= 5 ? 0 : 8 }}
          transition={STEP_TRANSITION}
        >
          <CheckCircle2 size={15} strokeWidth={ICON_STROKE} />
          Ready to publish
        </motion.div>
      </div>
    </div>
  );
}
