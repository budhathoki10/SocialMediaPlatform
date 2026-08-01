"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { ChevronDown } from "lucide-react";

import { gsap } from "@/lib/motion/gsap";
import { DURATION, EASE, MOTION_OK_QUERY, STAGGER } from "@/lib/motion/tokens";
import { FAQ_ITEMS } from "./data";

export default function FAQAccordion() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(MOTION_OK_QUERY, () => {
        gsap.from("[data-faq='item']", {
          y: 20,
          autoAlpha: 0,
          duration: DURATION.slow,
          ease: EASE.outExpo,
          stagger: STAGGER.tight,
          scrollTrigger: { trigger: sectionRef.current, start: "top 85%" },
        });
      });
    },
    { scope: sectionRef },
  );

  return (
    <div ref={sectionRef} className="mx-auto max-w-3xl">
      <div className="text-center">
        <h3 className="text-2xl font-semibold sm:text-3xl">Frequently asked questions</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">Everything you need to know about billing and plans.</p>
      </div>

      <div className="mt-10 divide-y divide-slate-200 rounded-card border border-slate-200 bg-white shadow-card">
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = openIndex === index;

          return (
            <div key={item.question} data-faq="item">
              <h4>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${index}`}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-slate-900 sm:px-6"
                >
                  {item.question}
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180 text-primary" : ""}`}
                  />
                </button>
              </h4>
              <div id={`faq-panel-${index}`} className={`faq-panel ${isOpen ? "is-open" : ""}`}>
                <div>
                  <p className="px-5 pb-4 text-sm leading-6 text-slate-600 sm:px-6">{item.answer}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
