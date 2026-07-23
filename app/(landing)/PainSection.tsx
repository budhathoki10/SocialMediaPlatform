"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { Bot, CalendarClock, WandSparkles, type LucideIcon } from "lucide-react";

import { gsap, ScrollTrigger } from "@/lib/motion/gsap";
import { DURATION, EASE, MOTION_OK_QUERY, STAGGER } from "@/lib/motion/tokens";

type PainCardData = {
  icon: LucideIcon;
  title: string;
  copy: string;
};

const painCards: PainCardData[] = [
  {
    icon: WandSparkles,
    title: "Eliminate Writer's Block",
    copy: "AI helps you turn product updates and technical ideas into social narratives.",
  },
  {
    icon: CalendarClock,
    title: "Preserve Official Presence",
    copy: "Post while you sleep, study, or launch. Your brand stays active without constant checking.",
  },
  {
    icon: Bot,
    title: "Context-aware Automation",
    copy: "Rules, analytics, and GitHub workflows meet in one place, so you respond with the right context.",
  },
];

export default function PainSection() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(MOTION_OK_QUERY, () => {
        gsap.from("[data-pain='headline'] > *", {
          y: 24,
          autoAlpha: 0,
          duration: DURATION.reveal,
          ease: EASE.outExpo,
          stagger: STAGGER.base,
          scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
        });

        const rows = gsap.utils.toArray<HTMLElement>("[data-pain='row']");
        const railDots = gsap.utils.toArray<HTMLElement>("[data-pain='rail-dot']");

        // The one pinned "storytelling" moment on the page (GSAP guidance:
        // pin at most 1-2 sections — more fights native scroll feel and
        // hurts mobile UX), and only where the two-column layout exists.
        // Below lg, rows batch-reveal instead of pinning.
        mm.add({ isDesktop: "(min-width: 1024px)" }, (context) => {
          const { isDesktop } = context.conditions as { isDesktop: boolean };

          if (isDesktop) {
            gsap.set(rows, { autoAlpha: 0, x: 40 });

            const tl = gsap.timeline({
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top top",
                end: "+=110%",
                scrub: 0.6,
                pin: true,
                anticipatePin: 1,
              },
            });

            rows.forEach((row, index) => {
              if (index > 0) {
                tl.to(rows[index - 1], { autoAlpha: 0.5, duration: 0.4 }, index);
              }
              tl.to(row, { autoAlpha: 1, x: 0, duration: 0.5, ease: EASE.out }, index).to(
                railDots[index],
                { backgroundColor: "#4f46e5", duration: 0.3 },
                index,
              );
            });

            // Hold: without this, the last row's fade-in finishes at
            // exactly 100% scroll progress through the pin — the same
            // instant it unpins into Testimonial, giving zero time to
            // actually read "Context-aware Automation" before the section
            // releases. This empty tween pads the timeline so the final
            // row sits fully visible for a real dwell period before
            // handoff.
            tl.to({}, { duration: 1 });

            return;
          }

          gsap.set(rows, { autoAlpha: 0, y: 20 });

          ScrollTrigger.batch(rows, {
            start: "top 88%",
            onEnter: (batch) =>
              gsap.to(batch, {
                autoAlpha: 1,
                y: 0,
                duration: DURATION.slow,
                ease: EASE.out,
                stagger: STAGGER.base,
              }),
          });
        });
      });
    },
    { scope: sectionRef },
  );

  return (
    // lg:min-h-screen + flex-col/justify-center: while pinned (desktop
    // only — matches the isDesktop matchMedia gate above), the section's
    // own content is shorter than a full viewport, which left empty space
    // at the bottom of the screen for the next section (Testimonial) to
    // scroll up through and fully reveal — while Pain was still actively
    // pinned above it. Filling the viewport removes that gap so nothing
    // downstream can appear until the pin actually releases.
    <section
      ref={sectionRef}
      className="bg-[#f4f6fa] px-5 py-24 sm:px-8 lg:flex lg:min-h-screen lg:flex-col lg:justify-center lg:px-10"
    >
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div data-pain="headline">
          <p className="text-sm font-semibold text-primary">Stop fighting the system.</p>
          <h2 className="mt-3 max-w-md text-4xl font-black leading-[1.02]">
            Stop fighting the <span className="text-primary">algorithms.</span>
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
            Hours spent formatting, tracking posting windows, and replying to comments turn into one intentional flow. The tedious layer disappears so the work can travel further.
          </p>
          <div className="mt-8 hidden items-center gap-2 lg:flex" aria-hidden="true">
            {painCards.map((_, index) => (
              <span key={index} data-pain="rail-dot" className="h-1.5 w-8 rounded-full bg-slate-200" />
            ))}
          </div>
        </div>
        <div className="grid gap-4">
          {painCards.map((item) => (
            <div key={item.title} data-pain="row">
              <InfoRow {...item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function InfoRow({ icon: Icon, title, copy }: PainCardData) {
  return (
    <article className="flex gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="icon-box shrink-0">
        <Icon size={17} />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{copy}</p>
      </div>
    </article>
  );
}
