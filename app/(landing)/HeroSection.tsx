"use client";

import Image from "next/image";
import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { ArrowRight, MousePointer2, Workflow } from "lucide-react";

import { gsap, SplitText } from "@/lib/motion/gsap";
import { DURATION, EASE, MOTION_OK_QUERY, STAGGER } from "@/lib/motion/tokens";
import MagneticWrap from "@/components/motion/MagneticWrap";
import PressableLink, { PressableAnchor } from "@/components/motion/PressableLink";

type SocialPlatform = {
  name: string;
  Logo: () => ReactNode;
};

// GitHub gets an inline SVG (matches onboarding's own choice and stays crisp
// at small badge sizes); the other supported platforms use their real assets.
const GitHubLogo = () => (
  <svg aria-hidden="true" className="h-full w-full" viewBox="0 0 44 44">
    <rect width="44" height="44" rx="12" fill="#24292F" />
    <path
      fill="#FFFFFF"
      d="M22 8.8c-7.4 0-13.4 6-13.4 13.4 0 5.9 3.8 10.9 9.2 12.7.7.1.9-.3.9-.6v-2.4c-3.7.8-4.5-1.6-4.5-1.6-.6-1.5-1.5-1.9-1.5-1.9-1.2-.8.1-.8.1-.8 1.3.1 2 1.4 2 1.4 1.2 2 3 1.4 3.8 1.1.1-.9.5-1.4.8-1.8-3-.3-6.1-1.5-6.1-6.6 0-1.5.5-2.6 1.4-3.6-.1-.3-.6-1.7.1-3.5 0 0 1.1-.4 3.7 1.4 1.1-.3 2.2-.4 3.4-.4s2.3.1 3.4.4c2.6-1.8 3.7-1.4 3.7-1.4.7 1.8.2 3.2.1 3.5.9 1 1.4 2.1 1.4 3.6 0 5.1-3.1 6.3-6.1 6.6.5.4.9 1.2.9 2.5v3.6c0 .4.2.8.9.6a13.4 13.4 0 0 0 9.2-12.7c0-7.5-6-13.5-13.4-13.5Z"
    />
  </svg>
);

const LinkedInLogo = () => (
  <Image src="/landing/linkedin.png" alt="" width={44} height={44} className="h-full w-full object-contain" />
);

const InstagramLogo = () => (
  <Image src="/landing/insta.png" alt="" width={44} height={44} className="h-full w-full object-contain" />
);

const WhatsAppLogo = () => (
  <Image src="/landing/whatsapps.png" alt="" width={44} height={44} className="h-full w-full object-contain" />
);

const socialPlatforms: SocialPlatform[] = [
  { name: "GitHub", Logo: GitHubLogo },
  { name: "LinkedIn", Logo: LinkedInLogo },
  { name: "Instagram", Logo: InstagramLogo },
  { name: "WhatsApp", Logo: WhatsAppLogo },
];

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(MOTION_OK_QUERY, () => {
        const headline = sectionRef.current?.querySelector<HTMLElement>("[data-hero='headline']");
        const split = headline ? new SplitText(headline, { type: "words" }) : null;

        const intro = gsap.timeline({
          defaults: { ease: EASE.outExpo },
          onComplete: () => split?.revert(),
        });

        intro
          .from("[data-hero='nav']", { yPercent: -100, autoAlpha: 0, duration: DURATION.slow })
          .from("[data-hero='badge']", { y: 18, autoAlpha: 0, duration: DURATION.reveal }, "-=0.15")
          .from(
            split ? split.words : "[data-hero='headline']",
            { yPercent: 60, autoAlpha: 0, duration: DURATION.hero, stagger: STAGGER.tight },
            "-=0.5",
          )
          .from("[data-hero='copy']", { y: 24, autoAlpha: 0, duration: DURATION.reveal }, "-=0.55")
          .from(
            "[data-hero='cta'] > *",
            { y: 20, autoAlpha: 0, duration: DURATION.slow, stagger: STAGGER.base },
            "-=0.5",
          )
          .from("[data-hero='proof']", { y: 16, autoAlpha: 0, duration: DURATION.slow }, "-=0.3")
          .from(
            "[data-hero='visual']",
            { x: 48, autoAlpha: 0, scale: 0.96, duration: 1, ease: EASE.out },
            0.55,
          );

        gsap.from("[data-hero='pill']", {
          y: 14,
          autoAlpha: 0,
          scale: 0.9,
          duration: DURATION.slow,
          ease: EASE.back,
          stagger: STAGGER.tight,
          scrollTrigger: {
            trigger: "[data-hero='trustbar']",
            start: "top 88%",
          },
        });

        // Scrubbed parallax: copy leaves slightly faster than the visual, the
        // shader backdrop drifts behind both. Elements only ever get one
        // engine: the wheel's continuous spin stays in CSS on the inner image,
        // scroll rotation lands on the outer stage wrapper.
        gsap
          .timeline({
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
            defaults: { ease: EASE.none },
          })
          .to("[data-hero='copy-col']", { yPercent: -10 }, 0)
          .to("[data-hero='visual']", { yPercent: 8, rotate: 9 }, 0)
          .to("[data-hero='shader']", { yPercent: 16, opacity: 0.55 }, 0);
      });
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} className="hero-section relative min-h-screen overflow-hidden border-b border-slate-200/80">
      <div className="shader-field" data-hero="shader" aria-hidden="true">
        <div className="shader-marquee">
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
      <div data-hero="nav">
        <SiteNav />
      </div>
      <div className="relative mx-auto flex min-h-[calc(100vh-76px)] w-full max-w-7xl flex-col justify-center px-5 py-16 sm:px-8 lg:px-10">
        <div className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="max-w-2xl" data-hero="copy-col">
            <div
              data-hero="badge"
              className="inline-flex items-center gap-2 rounded-control bg-primary-tint px-3 py-1.5 text-xs font-semibold tracking-tight text-primary-active"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75 motion-reduce:animate-none" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              <Workflow size={14} />
              AI growth engine for social automation
            </div>
            <h1 data-hero="headline" className="mt-6 text-5xl font-black leading-[0.95] sm:text-6xl lg:text-7xl">
              Automate your entire <span className="text-primary">social presence.</span>
            </h1>
            <p data-hero="copy" className="mt-6 max-w-lg text-lg font-medium leading-8 text-slate-600">
              Automate LinkedIn presence, powered by GitHub activity, AI captions, smart scheduling, and meaningful analytics.
            </p>
            <div data-hero="cta" className="mt-8 flex flex-col gap-3 sm:flex-row">
              <MagneticWrap>
                <PressableLink
                  href="/login?callbackUrl=/onboarding"
                  whileHover={undefined}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-primary-hover"
                >
                  Get Started Free
                  <ArrowRight size={16} />
                </PressableLink>
              </MagneticWrap>
              <PressableAnchor
                href="#demo"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white/80 px-6 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-white"
              >
                <MousePointer2 size={16} />
                Watch Demo
              </PressableAnchor>
            </div>
            <div data-hero="proof" className="mt-8 flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600">
              <AvatarStack />
              <span>Join 50,000+ creators growing on autopilot</span>
            </div>
          </div>
          <div data-hero="visual">
            <HeroVisual />
          </div>
        </div>
        <TrustBar />
      </div>
    </section>
  );
}

function SiteNav() {
  return (
    <header className="relative z-10 border-b border-slate-200 bg-white">
      <nav className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <div className="flex min-w-0 items-center gap-9">
          <a href="#" className="flex shrink-0 items-center gap-2 text-sm font-bold text-slate-950">
            <Image
              src="/landing/autopilot-logo.png"
              alt="AutoPilot"
              width={161}
              height={60}
              className="mt-3 h-[60px] w-auto"
              style={{ width: "auto" }}
              priority
            />
          </a>
          <div className="hidden items-center gap-9 text-sm font-semibold text-slate-500 md:flex">
            <a href="#features" className="transition hover:text-slate-950">
              Features
            </a>
            <a href="#customers" className="transition hover:text-slate-950">
              Customers
            </a>
            <a href="#about" className="transition hover:text-slate-950">
              About
            </a>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-6">
          <PressableLink
            href="/login?callbackUrl=/onboarding"
            className="hidden text-sm font-semibold text-slate-500 transition hover:text-slate-950 sm:inline"
          >
            Log In
          </PressableLink>
          <PressableLink
            href="/login?callbackUrl=/onboarding"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-bold text-white shadow-sm shadow-indigo-200 transition hover:bg-primary-hover"
          >
            Get Started Free
          </PressableLink>
        </div>
      </nav>
    </header>
  );
}

function HeroVisual() {
  return (
    <div className="hero-automation-visual relative mx-auto w-full max-w-2xl">
      <div className="hero-automation-stage">
        <Image
          src="/landing/final-wheel-no-logo.png"
          alt="Social automation settings wheel"
          width={500}
          height={500}
          className="hero-dashboard-image hero-automation-spin"
          priority
        />

        <Image
          src="/landing/final-center-logo-clean.png"
          alt="Social automation settings wheel"
          width={500}
          height={500}
          className="hero-dashboard-image hero-automation-image"
          priority
        />
      </div>
    </div>
  );
}

function TrustBar() {
  return (
    <div data-hero="trustbar" className="relative mt-16 border-t border-slate-200/80 pt-8">
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.36em] text-slate-400">
        Trusted by teams at
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-x-8 gap-y-5">
        {socialPlatforms.map(({ name, Logo }) => (
          <span key={name} data-hero="pill" className="flex items-center gap-2.5">
            <span className="h-7 w-7 shrink-0 overflow-hidden rounded-control">
              <Logo />
            </span>
            <span className="text-[15px] font-bold text-slate-500">{name}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function AvatarStack() {
  return (
    <Image
      src="/landing/creator-stack.png"
      alt="Creators growing on AutoPilot"
      width={132}
      height={48}
      className="h-10 w-auto sm:h-12"
    />
  );
}
