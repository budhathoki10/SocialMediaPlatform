"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { Code2, LaptopMinimal, ShieldCheck, type LucideIcon } from "lucide-react";

import { gsap, ScrollTrigger } from "@/lib/motion/gsap";
import { DURATION, EASE, MOTION_OK_QUERY, STAGGER } from "@/lib/motion/tokens";

type GrowthCardData = {
  icon: LucideIcon;
  title: string;
  copy: string;
};

const growthCards: GrowthCardData[] = [
  {
    icon: Code2,
    title: "Developer First",
    copy: "Workflows built around releases, repositories, pull requests, and technical launch cycles.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy Focused",
    copy: "Token storage, account isolation, and clear controls help keep automation predictable.",
  },
  {
    icon: LaptopMinimal,
    title: "Enterprise Grade",
    copy: "Scale campaigns across channels, teammates, and brand voices from one system.",
  },
];

export default function GrowthSection() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(MOTION_OK_QUERY, () => {
        gsap.from("[data-growth='kicker'] > *", {
          y: 22,
          autoAlpha: 0,
          duration: DURATION.reveal,
          ease: EASE.outExpo,
          stagger: STAGGER.base,
          scrollTrigger: { trigger: sectionRef.current, start: "top 78%" },
        });

        const cards = gsap.utils.toArray<HTMLElement>("[data-growth='card']");
        gsap.set(cards, { y: 36, autoAlpha: 0 });

        ScrollTrigger.batch(cards, {
          start: "top 88%",
          onEnter: (batch) =>
            gsap.to(batch, {
              y: 0,
              autoAlpha: 1,
              duration: DURATION.slow,
              ease: EASE.back,
              stagger: STAGGER.base,
              overwrite: true,
            }),
        });
      });
    },
    { scope: sectionRef },
  );

  return (
    <section id="about" ref={sectionRef} className="bg-white px-5 py-24 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl text-center">
        <div data-growth="kicker">
          <h2 className="text-3xl font-semibold sm:text-4xl">Engineered for growth.</h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
            Built by developers, for builders who demand reliability and scale from their automation stack.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {growthCards.map((item) => (
            <div key={item.title} data-growth="card">
              <GrowthCard {...item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GrowthCard({ icon: Icon, title, copy }: GrowthCardData) {
  return (
    <article className="growth-card rounded-lg border border-slate-200 bg-slate-50 p-6 text-left">
      <div className="icon-box">
        <Icon size={17} />
      </div>
      <h3 className="mt-8 text-base font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{copy}</p>
    </article>
  );
}
