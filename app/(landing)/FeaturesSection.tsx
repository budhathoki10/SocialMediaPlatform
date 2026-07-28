"use client";

import Image from "next/image";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { BarChart3, CalendarClock, GitBranch, MessageSquareText, type LucideIcon } from "lucide-react";

import { gsap, ScrollTrigger } from "@/lib/motion/gsap";
import { DURATION, EASE, MOTION_OK_QUERY, STAGGER } from "@/lib/motion/tokens";

type FeatureCardData = {
  icon: LucideIcon;
  title: string;
  copy: string;
  previewSrc: string;
  /**
   * Resting zoom applied before scroll parallax. Real-time Analytics and
   * GitHub Automation were pre-cropped in the source screenshots (2.08x /
   * 1.22x) to fill the wide preview frame; AI Captions and Smart Scheduling
   * get a lighter 1.16x so the parallax has somewhere to move without
   * exposing the image edge.
   */
  previewScale: number;
};

// AI Captions carries the richest copy of the four and leads with the
// clearest "wow" screenshot — it's the bento hero (full-width row, image
// beside the text instead of stacked below it). The other three stay
// standard, single-column cards in a supporting row underneath.
const heroCard: FeatureCardData = {
  icon: MessageSquareText,
  title: "AI Captions",
  copy: "Generate platform-aware captions for any image or link. AutoPilot adapts your brand voice and formats for each channel.",
  previewSrc: "/landing/AICaption.png",
  previewScale: 1.16,
};

const supportingCards: FeatureCardData[] = [
  {
    icon: CalendarClock,
    title: "Smart Scheduling",
    copy: "Post when your audience is most active.",
    previewSrc: "/landing/smartSchedule.png",
    previewScale: 1.16,
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    copy: "Track growth across every platform with a single source of truth.",
    previewSrc: "/landing/realtimeanalytics.png",
    previewScale: 2.08,
  },
  {
    icon: GitBranch,
    title: "GitHub Automation",
    copy: "Automatically turn releases, issues, and commits into posts, bridging code and community.",
    previewSrc: "/landing/github.png",
    previewScale: 1.22,
  },
];

export default function FeaturesSection() {
  const sectionRef = useRef<HTMLElement | null>(null);

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

        const cards = gsap.utils.toArray<HTMLElement>("[data-features='card']");
        gsap.set(cards, { y: 44, scale: 0.94, autoAlpha: 0 });

        // Sequential DOM-order stagger, not the old grid: [2, 2] wave. That
        // option assumes a rectangular N-row-by-M-col grid where every cell
        // is the same size — true for the old uniform 2x2, but the bento
        // hero card now spans the full row by itself, so there's no
        // rectangular grid to compute distances against. DOM order (hero,
        // then the three supporting cards left-to-right) already matches
        // the visual reading order, so a plain sequential stagger is both
        // simpler and correct here.
        ScrollTrigger.batch(cards, {
          start: "top 85%",
          onEnter: (batch) =>
            gsap.to(batch, {
              y: 0,
              scale: 1,
              autoAlpha: 1,
              duration: DURATION.slow,
              ease: EASE.back,
              stagger: STAGGER.base,
              overwrite: true,
            }),
        });

        // Screenshot parallax: each preview image gets a resting zoom (room
        // to move) and drifts vertically inside its clipped frame as the
        // card crosses the viewport, scrubbed to scroll position.
        sectionRef.current
          ?.querySelectorAll<HTMLElement>("[data-features='preview-image']")
          .forEach((image) => {
            const baseScale = Number(image.dataset.previewScale) || 1.1;
            gsap.set(image, { scale: baseScale, transformOrigin: "center center" });

            gsap.to(image, {
              yPercent: 6,
              ease: EASE.none,
              scrollTrigger: {
                trigger: image.closest("[data-features='preview-frame']"),
                start: "top bottom",
                end: "bottom top",
                scrub: true,
                // will-change just-in-time: the image only needs the
                // compositor hint while it's actually in the scrubbed
                // range, not for the entire time it happens to be mounted.
                onToggle: (self) => {
                  image.style.willChange = self.isActive ? "transform" : "auto";
                },
              },
            });
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
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard {...heroCard} variant="hero" />
          {supportingCards.map((feature) => (
            <FeatureCard key={feature.title} {...feature} variant="standard" />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  copy,
  previewSrc,
  previewScale,
  variant,
}: FeatureCardData & { variant: "hero" | "standard" }) {
  const isHero = variant === "hero";

  return (
    <article
      data-features="card"
      className={`feature-card feature-card--visual feature-card--media ${isHero ? "feature-card--hero lg:col-span-3" : ""}`}
    >
      <div className="feature-card-header">
        <div className="icon-box">
          <Icon size={17} />
        </div>
        <h3>{title}</h3>
        <p>{copy}</p>
      </div>
      <div data-features="preview-frame" className="feature-preview-frame">
        <Image
          src={previewSrc}
          alt=""
          fill
          sizes={isHero ? "(min-width: 1024px) 55vw, 100vw" : "(min-width: 768px) 50vw, 100vw"}
          className="feature-preview-image"
          data-features="preview-image"
          data-preview-scale={previewScale}
          aria-hidden="true"
        />
      </div>
    </article>
  );
}
