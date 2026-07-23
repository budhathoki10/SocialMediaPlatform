"use client";

import Image from "next/image";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { Check, GitBranch, Link2 } from "lucide-react";

import { gsap } from "@/lib/motion/gsap";
import { DURATION, EASE, MOTION_OK_QUERY, STAGGER } from "@/lib/motion/tokens";

const footerColumns = [
  ["Product", "Features", "Integrations", "Changelog"],
  ["Company", "About Us", "Careers", "Blog"],
  ["Resources", "Docs", "Community", "API"],
  ["Legal", "Privacy", "Terms"],
];

export default function SiteFooter() {
  const footerRef = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(MOTION_OK_QUERY, () => {
        gsap.from("[data-footer='brand']", {
          x: -24,
          autoAlpha: 0,
          duration: DURATION.reveal,
          ease: EASE.outExpo,
          scrollTrigger: { trigger: footerRef.current, start: "top 88%" },
        });

        gsap.from("[data-footer='column']", {
          y: 24,
          autoAlpha: 0,
          duration: DURATION.slow,
          ease: EASE.outExpo,
          stagger: STAGGER.loose,
          scrollTrigger: { trigger: footerRef.current, start: "top 88%" },
        });

        gsap.from("[data-footer='bottom']", {
          y: 16,
          autoAlpha: 0,
          duration: DURATION.slow,
          ease: EASE.outExpo,
          scrollTrigger: { trigger: "[data-footer='bottom']", start: "top 95%" },
        });
      });
    },
    { scope: footerRef },
  );

  return (
    <footer ref={footerRef} className="bg-[#f7f8fb] px-5 py-16 sm:px-8 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.4fr_2fr]">
        <div data-footer="brand">
          <a href="#" className="flex items-center gap-2 text-sm font-bold text-slate-950">
            <Image
              src="/landing/autopilot-logo.png"
              alt="AutoPilot"
              width={161}
              height={60}
              className="h-11 w-auto"
              style={{ width: "auto" }}
            />
          </a>
          <p className="mt-5 max-w-sm text-sm leading-6 text-slate-500">
            The all-in-one automation suite for modern developers and digital creators.
          </p>
          <div className="mt-6 flex gap-4 text-slate-500">
            <Link2 size={18} />
            <GitBranch size={18} />
          </div>
        </div>
        <div className="grid gap-8 sm:grid-cols-4">
          {footerColumns.map(([title, ...items]) => (
            <div key={title} data-footer="column">
              <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-500">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="footer-link transition hover:text-slate-950">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div
        data-footer="bottom"
        className="mx-auto mt-12 flex max-w-7xl flex-col gap-4 border-t border-slate-200 pt-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"
      >
        <p>© 2026 AutoPilot Automation Suite. Designed to be invisible.</p>
        <p className="flex items-center gap-2 text-emerald-600">
          <Check size={14} />
          All systems operational
        </p>
      </div>
    </footer>
  );
}
