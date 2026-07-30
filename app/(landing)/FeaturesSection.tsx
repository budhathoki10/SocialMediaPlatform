"use client";

import { useRef, useState, type ComponentType, type KeyboardEvent } from "react";
import { useGSAP } from "@gsap/react";
import { AnimatePresence, motion } from "motion/react";
import { BarChart3, CalendarClock, GitBranch, MessageSquareText, type LucideIcon } from "lucide-react";

import { gsap } from "@/lib/motion/gsap";
import { DURATION, EASE, MOTION_EASE, MOTION_OK_QUERY, SPRING, STAGGER } from "@/lib/motion/tokens";
import AiCaptionsIllustration from "@/components/illustrations/AiCaptionsIllustration";
import SmartSchedulingIllustration from "@/components/illustrations/SmartSchedulingIllustration";
import AnalyticsIllustration from "@/components/illustrations/AnalyticsIllustration";
import GithubAutomationIllustration from "@/components/illustrations/GithubAutomationIllustration";

type FeatureId = "ai-captions" | "smart-scheduling" | "analytics" | "github";

type Feature = {
  id: FeatureId;
  icon: LucideIcon;
  title: string;
  copy: string;
  Illustration: ComponentType;
};

const FEATURES: Feature[] = [
  {
    id: "ai-captions",
    icon: MessageSquareText,
    title: "AI Captions",
    copy: "Generate platform-aware captions for any image or link. AutoPilot adapts your brand voice and formats for each channel.",
    Illustration: AiCaptionsIllustration,
  },
  {
    id: "smart-scheduling",
    icon: CalendarClock,
    title: "Smart Scheduling",
    copy: "Post when your audience is most active.",
    Illustration: SmartSchedulingIllustration,
  },
  {
    id: "github",
    icon: GitBranch,
    title: "GitHub Automation",
    copy: "Automatically turn releases, issues, and commits into posts, bridging code and community.",
    Illustration: GithubAutomationIllustration,
  },
  {
    id: "analytics",
    icon: BarChart3,
    title: "Real-time Analytics",
    copy: "Track growth across every platform with a single source of truth.",
    Illustration: AnalyticsIllustration,
  },
];

export default function FeaturesSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const active = FEATURES[activeIndex];

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(MOTION_OK_QUERY, () => {
        gsap.from("[data-features='kicker'] > *", {
          y: 22,
          autoAlpha: 0,
          duration: DURATION.reveal,
          ease: EASE.outExpo,
          stagger: STAGGER.base,
          scrollTrigger: { trigger: sectionRef.current, start: "top 78%" },
        });

        gsap.from("[data-features='showcase']", {
          y: 32,
          autoAlpha: 0,
          duration: DURATION.slow,
          ease: EASE.outExpo,
          scrollTrigger: { trigger: sectionRef.current, start: "top 70%" },
        });
      });
    },
    { scope: sectionRef },
  );

  return (
    <section id="features" ref={sectionRef} className="bg-white px-5 py-24 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div data-features="kicker" className="max-w-2xl">
          <p className="text-sm font-semibold text-indigo-600">Low-friction immersion.</p>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Everything you need to stay present.</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            A unified automation stack designed to help you maintain a constant, high-quality presence powered by GitHub activity without the manual labor.
          </p>
        </div>

        <div data-features="showcase" className="mt-12">
          <FeatureTabs features={FEATURES} activeIndex={activeIndex} onChange={setActiveIndex} />

          <div className="mt-8 grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
            <div id={`feature-panel-${active.id}`} role="tabpanel" aria-labelledby={`feature-tab-${active.id}`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.16, ease: MOTION_EASE.outExpo }}
                >
                  <h3 className="text-2xl font-bold text-slate-950">{active.title}</h3>
                  <p className="mt-3 max-w-md text-base leading-7 text-slate-600">{active.copy}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="relative w-full min-h-[420px] sm:min-h-[460px] lg:aspect-[3/2] lg:min-h-0">
              <active.Illustration />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureTabs({
  features,
  activeIndex,
  onChange,
}: {
  features: Feature[];
  activeIndex: number;
  onChange: (index: number) => void;
}) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const lastIndex = features.length - 1;
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") nextIndex = activeIndex === lastIndex ? 0 : activeIndex + 1;
    else if (event.key === "ArrowLeft") nextIndex = activeIndex === 0 ? lastIndex : activeIndex - 1;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = lastIndex;

    if (nextIndex !== null) {
      event.preventDefault();
      onChange(nextIndex);
      tabRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div
      role="tablist"
      aria-label="Features"
      onKeyDown={handleKeyDown}
      className="grid grid-cols-2 gap-1 rounded-control bg-slate-100 p-1 lg:grid-cols-4"
    >
      {features.map((feature, index) => {
        const isActive = index === activeIndex;
        const Icon = feature.icon;

        return (
          <button
            key={feature.id}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            id={`feature-tab-${feature.id}`}
            aria-selected={isActive}
            aria-controls={`feature-panel-${feature.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(index)}
            className={`relative flex min-w-0 items-center gap-1.5 rounded-[7px] px-2.5 py-2.5 text-left text-xs font-semibold transition sm:gap-2.5 sm:px-4 sm:py-3 sm:text-sm ${
              isActive ? "text-primary" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="feature-tab-indicator"
                transition={SPRING.gentle}
                className="absolute inset-0 rounded-[7px] bg-white shadow-sm ring-1 ring-slate-200/70"
              />
            )}
            <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-tint text-primary sm:h-8 sm:w-8">
              <Icon size={15} />
            </span>
            <span className="relative min-w-0 leading-tight">{feature.title}</span>
          </button>
        );
      })}
    </div>
  );
}
