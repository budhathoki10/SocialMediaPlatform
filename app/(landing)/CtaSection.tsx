"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { ArrowRight } from "lucide-react";

import { gsap, ScrollTrigger } from "@/lib/motion/gsap";
import { EASE, MOTION_OK_QUERY } from "@/lib/motion/tokens";
import MagneticWrap from "@/components/motion/MagneticWrap";
import PressableLink, { PressableAnchor } from "@/components/motion/PressableLink";

export default function CtaSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const sweepRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(MOTION_OK_QUERY, () => {
        // Curtain-open reveal: the panel unwraps from a narrow centered
        // strip to full width as it enters, in place of a plain fade.
        gsap.from(panelRef.current, {
          clipPath: "inset(0% 42% 0% 42% round 999px)",
          opacity: 0,
          duration: 1,
          ease: EASE.outExpo,
          scrollTrigger: { trigger: sectionRef.current, start: "top 78%" },
        });

        // The ambient sweep only costs GPU/battery while the panel is
        // actually on screen — paused by default in CSS, GSAP just toggles
        // play state as the section enters/leaves the viewport.
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => {
            if (sweepRef.current) {
              sweepRef.current.style.animationPlayState = self.isActive ? "running" : "paused";
            }
          },
        });
      });
    },
    { scope: sectionRef },
  );

  return (
    <section id="pricing" ref={sectionRef} className="bg-[#eef1f8] px-5 py-14 sm:px-8 sm:py-16 lg:px-10">
      <div ref={panelRef} className="cta-panel mx-auto max-w-4xl px-6 py-10 text-center text-white sm:px-10">
        <div ref={sweepRef} className="cta-sweep" aria-hidden="true" />
        <div className="relative">
          <h2 className="text-3xl font-black leading-none sm:text-4xl">Ready to put your growth on AutoPilot?</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-indigo-50">
            Automate your LinkedIn presence, powered by your GitHub activity. AutoPilot handles the noise so you can focus on building.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <MagneticWrap>
              <PressableLink
                href="/login?callbackUrl=/onboarding"
                whileHover={undefined}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-semibold text-indigo-700 transition hover:bg-primary-tint"
              >
                Get Started Free
                <ArrowRight size={16} />
              </PressableLink>
            </MagneticWrap>
            <PressableAnchor
              href="#demo"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/30 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Talk to Sales
              <ArrowRight size={16} />
            </PressableAnchor>
          </div>
        </div>
      </div>
    </section>
  );
}
