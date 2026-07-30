"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { CheckCircle2, Send, Sparkles } from "lucide-react";

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

const DRAFT = "New AI feature just dropped \u{1F680}";
const CAPTION = "Just shipped our AI content engine. Try it free today!";
const PLATFORMS = [LinkedInMark, InstagramMark, WhatsAppMark];

// Steps: 0 rest Β· 1 AI scans the post Β· 2-3 a draft types out ON the photo
// itself Β· 4-6 the polished caption types out below, outside the card Β·
// 7 platform-specific versions appear Β· 8 ready-to-publish Β· 9 hold, then loop.
export default function AiCaptionsIllustration() {
  const { step, ref } = useStepCycle(10, 1300);

  const analyzing = step >= 1;
  const draftingInCard = step === 2 || step === 3;
  const draftStarted = step >= 2;
  const showCaption = step >= 4;
  const typingCaption = step >= 4 && step < 7;
  const showPlatforms = step >= 7;
  const showReady = step >= 8;

  return (
    <div ref={ref} className="flex h-full w-full items-center justify-center bg-white p-6 sm:p-10">
      <div className="w-full max-w-lg">
        <div className="relative">
          <motion.div
            className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/25 via-violet-300/20 to-cyan-200/25 blur-2xl"
            animate={{ opacity: analyzing ? 1 : 0 }}
            transition={STEP_TRANSITION}
          />

          <div className={`${CARD_SURFACE} p-5`}>
            <div className="flex items-center gap-2.5">
              <Image src="/landing/autopilot-logo.png" alt="AutoPilot" width={161} height={60} className="h-6 w-auto" />
              <span className="text-xs font-medium text-slate-400">Β· Just now</span>
            </div>

            <div className="relative mt-4 h-24 w-full overflow-hidden rounded-lg border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1877F2] text-white">
                  <Send size={11} strokeWidth={ICON_STROKE} />
                </div>
                <span className="text-xs font-semibold text-slate-500">Draft</span>
              </div>

              <motion.div
                className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent"
                animate={{ x: analyzing && !draftStarted ? ["-120%", "220%"] : "-120%" }}
                transition={{ duration: 1.4, repeat: analyzing && !draftStarted ? Infinity : 0, ease: "easeInOut", repeatDelay: 0.3 }}
              />

              <p className="relative mt-2.5 text-[13px] leading-snug text-slate-700">
                <TypingText text={DRAFT} active={draftingInCard} />
              </p>
            </div>
          </div>

          <motion.div
            className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-primary"
            animate={{ opacity: step === 1 ? [0.15, 0.5, 0.15] : 0 }}
            transition={step === 1 ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" } : STEP_TRANSITION}
          />

          <motion.div
            className={`absolute -right-3 -top-3 flex items-center gap-1 ${BADGE_SURFACE} px-2.5 py-1.5 text-primary`}
            animate={{ opacity: analyzing ? 1 : 0, scale: analyzing ? 1 : 0.75 }}
            transition={STEP_TRANSITION}
          >
            <motion.span
              animate={{ rotate: analyzing ? [0, -12, 12, 0] : 0 }}
              transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1.2, ease: "easeInOut" }}
            >
              <Sparkles size={13} strokeWidth={ICON_STROKE} />
            </motion.span>
            <span className="text-[11px] font-semibold">AI</span>
          </motion.div>
        </div>

        <motion.p
          className="relative mt-5 min-h-[2.6em] text-base leading-relaxed text-slate-700"
          animate={{ opacity: showCaption ? 1 : 0, y: showCaption ? 0 : 8 }}
          transition={STEP_TRANSITION}
        >
          <TypingText text={CAPTION} active={typingCaption} />
        </motion.p>

        <motion.div
          className="mt-5 flex items-center gap-2.5"
          animate={{ opacity: showPlatforms ? 1 : 0, y: showPlatforms ? 0 : 8 }}
          transition={STEP_TRANSITION}
        >
          {PLATFORMS.map((Mark, i) => {
            const highlighted = showPlatforms && step % PLATFORMS.length === i;
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
          animate={{ opacity: showReady ? 1 : 0, y: showReady ? 0 : 8 }}
          transition={STEP_TRANSITION}
        >
          <CheckCircle2 size={15} strokeWidth={ICON_STROKE} />
          Ready to publish
        </motion.div>
      </div>
    </div>
  );
}
