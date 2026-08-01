"use client";

import Image from "next/image";
import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { CircleDollarSign, ShieldCheck, Undo2, Users2, type LucideIcon } from "lucide-react";

import { gsap } from "@/lib/motion/gsap";
import { DURATION, EASE, MOTION_OK_QUERY, STAGGER } from "@/lib/motion/tokens";

type TrustItem = { icon: LucideIcon; label: string };

const TRUST_ITEMS: TrustItem[] = [
  { icon: CircleDollarSign, label: "No setup fees" },
  { icon: Undo2, label: "Cancel anytime" },
  { icon: ShieldCheck, label: "Secure payments" },
  { icon: Users2, label: "Trusted by growing businesses" },
];

const GitHubLogo = () => (
  <svg aria-hidden="true" className="h-full w-full" viewBox="0 0 44 44">
    <rect width="44" height="44" rx="12" fill="#24292F" />
    <path
      fill="#FFFFFF"
      d="M22 8.8c-7.4 0-13.4 6-13.4 13.4 0 5.9 3.8 10.9 9.2 12.7.7.1.9-.3.9-.6v-2.4c-3.7.8-4.5-1.6-4.5-1.6-.6-1.5-1.5-1.9-1.5-1.9-1.2-.8.1-.8.1-.8 1.3.1 2 1.4 2 1.4 1.2 2 3 1.4 3.8 1.1.1-.9.5-1.4.8-1.8-3-.3-6.1-1.5-6.1-6.6 0-1.5.5-2.6 1.4-3.6-.1-.3-.6-1.7.1-3.5 0 0 1.1-.4 3.7 1.4 1.1-.3 2.2-.4 3.4-.4s2.3.1 3.4.4c2.6-1.8 3.7-1.4 3.7-1.4.7 1.8.2 3.2.1 3.5.9 1 1.4 2.1 1.4 3.6 0 5.1-3.1 6.3-6.1 6.6.5.4.9 1.2.9 2.5v3.6c0 .4.2.8.9.6a13.4 13.4 0 0 0 9.2-12.7c0-7.5-6-13.5-13.4-13.5Z"
    />
  </svg>
);

const platformLogos: { name: string; Logo: () => ReactNode }[] = [
  { name: "GitHub", Logo: GitHubLogo },
  {
    name: "LinkedIn",
    Logo: () => <Image src="/landing/linkedin.png" alt="" width={44} height={44} className="h-full w-full object-contain" />,
  },
  {
    name: "Instagram",
    Logo: () => <Image src="/landing/insta.png" alt="" width={44} height={44} className="h-full w-full object-contain" />,
  },
  {
    name: "WhatsApp",
    Logo: () => <Image src="/landing/whatsapps.png" alt="" width={44} height={44} className="h-full w-full object-contain" />,
  },
];

export default function TrustBar() {
  const sectionRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(MOTION_OK_QUERY, () => {
        gsap.from("[data-trust='item']", {
          y: 16,
          autoAlpha: 0,
          duration: DURATION.slow,
          ease: EASE.outExpo,
          stagger: STAGGER.tight,
          scrollTrigger: { trigger: sectionRef.current, start: "top 88%" },
        });
      });
    },
    { scope: sectionRef },
  );

  return (
    <div ref={sectionRef} className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
        {TRUST_ITEMS.map(({ icon: Icon, label }) => (
          <span key={label} data-trust="item" className="flex items-center gap-2.5 text-sm font-semibold text-slate-600">
            <Icon size={17} className="text-primary" />
            {label}
          </span>
        ))}
      </div>

      <div className="mt-12 border-t border-slate-200 pt-10">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.36em] text-slate-400">
          Works with the platforms you already use
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-8 gap-y-5">
          {platformLogos.map(({ name, Logo }) => (
            <span key={name} data-trust="item" className="flex items-center gap-2.5">
              <span className="h-7 w-7 shrink-0 overflow-hidden rounded-control">
                <Logo />
              </span>
              <span className="text-[15px] font-bold text-slate-500">{name}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
