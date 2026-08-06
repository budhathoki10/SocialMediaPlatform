"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Flame, X, Zap, type LucideIcon } from "lucide-react";

import { gsap, ScrollTrigger } from "@/lib/motion/gsap";
import { DURATION, EASE, MOTION_OK_QUERY, SPRING, STAGGER } from "@/lib/motion/tokens";
import CountUp from "@/components/motion/CountUp";
import MagneticWrap from "@/components/motion/MagneticWrap";
import PressableLink, { PressableAnchor } from "@/components/motion/PressableLink";
import { PLANS, type BillingPeriod, type Plan } from "./data";

const BADGE_ICON: Record<NonNullable<Plan["badge"]>["icon"], LucideIcon> = {
  flame: Flame,
  zap: Zap,
};

const CTA_STYLES: Record<Plan["ctaStyle"], string> = {
  outline: "border border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50",
  primary: "bg-primary text-white shadow-lg shadow-indigo-200 hover:bg-primary-hover",
  gradient: "pricing-cta-gradient text-white",
};

export default function PricingCards({
  titleAs = "h2",
  animated = true,
}: {
  titleAs?: "h1" | "h2";
  /**
   * Scroll-triggered entrance (kicker fade-in, card stagger). GSAP
   * ScrollTrigger watches window/document scroll by default — inside the
   * dashboard shell the window never scrolls (only an inner overflow-y-auto
   * panel does), so the trigger would never fire and cards would stay stuck
   * at their pre-reveal opacity. Dashboard usage passes animated={false}
   * for a plain, immediately-visible render instead.
   */
  animated?: boolean;
} = {}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const Title = titleAs;

  useGSAP(
    () => {
      if (!animated) return;

      const mm = gsap.matchMedia();

      mm.add(MOTION_OK_QUERY, () => {
        gsap.from("[data-pricing='kicker'] > *", {
          y: 22,
          autoAlpha: 0,
          duration: DURATION.reveal,
          ease: EASE.outExpo,
          stagger: STAGGER.base,
          scrollTrigger: { trigger: wrapRef.current, start: "top 80%" },
        });

        const cards = gsap.utils.toArray<HTMLElement>("[data-pricing='card']");
        gsap.set(cards, { y: 40, autoAlpha: 0 });

        ScrollTrigger.batch(cards, {
          start: "top 90%",
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
    { scope: wrapRef },
  );

  return (
    <div ref={wrapRef}>
      <div data-pricing="kicker" className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold text-primary">Pricing</p>
        <Title className="mt-3 text-3xl font-semibold sm:text-4xl">Simple, Transparent Pricing</Title>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
          Choose the plan that fits your business. Start free and upgrade as your social media and customer
          engagement grow.
        </p>
        <BillingToggle period={period} onChange={setPeriod} />
      </div>

      <div className="mx-auto mt-16 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:items-start">
        {PLANS.map((plan) => (
          <div key={plan.id} data-pricing="card" className={plan.popular ? "lg:-mt-5" : undefined}>
            <PricingCard plan={plan} period={period} />
          </div>
        ))}
      </div>
    </div>
  );
}

function BillingToggle({
  period,
  onChange,
}: {
  period: BillingPeriod;
  onChange: (period: BillingPeriod) => void;
}) {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
      <div
        role="tablist"
        aria-label="Billing period"
        className="relative inline-flex items-center rounded-control bg-slate-100 p-1"
      >
        {(["monthly", "yearly"] as const).map((value) => {
          const isActive = period === value;

          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(value)}
              className={`relative rounded-[7px] px-5 py-2 text-sm font-semibold capitalize transition ${
                isActive ? "text-primary" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="billing-toggle-indicator"
                  transition={SPRING.gentle}
                  className="absolute inset-0 rounded-[7px] bg-white shadow-sm ring-1 ring-slate-200/70"
                />
              )}
              <span className="relative">{value}</span>
            </button>
          );
        })}
      </div>
      <AnimatePresence>
        {period === "yearly" && (
          <motion.span
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={SPRING.press}
            className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"
          >
            Save 20%
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

function PricingCard({ plan, period }: { plan: Plan; period: BillingPeriod }) {
  const isYearly = period === "yearly" && plan.yearlyPrice != null;
  const price = isYearly ? plan.yearlyPrice! : plan.monthlyPrice;
  const suffix = plan.monthlyPrice === 0 ? "/month" : isYearly ? "/year" : "/month";
  const BadgeIcon = plan.badge ? BADGE_ICON[plan.badge.icon] : null;

  const isCheckoutLink = plan.ctaHref.startsWith("/api/billing/checkout");
  const ctaHref = isCheckoutLink ? `${plan.ctaHref}&period=${period}` : plan.ctaHref;
  const ctaClassName = `inline-flex h-11 w-full items-center justify-center rounded-lg px-5 text-sm font-bold transition ${CTA_STYLES[plan.ctaStyle]}`;

  // Checkout links redirect server-side to Freemius (an external domain), so
  // they need a real browser navigation — Next's <Link> client transition
  // expects an in-app route and won't follow that redirect correctly.
  const cta = isCheckoutLink ? (
    <PressableAnchor
      href={ctaHref}
      whileHover={plan.popular ? undefined : { y: -1 }}
      className={ctaClassName}
    >
      {plan.ctaLabel}
    </PressableAnchor>
  ) : (
    <PressableLink href={ctaHref} whileHover={plan.popular ? undefined : { y: -1 }} className={ctaClassName}>
      {plan.ctaLabel}
    </PressableLink>
  );

  return (
    <article
      className={`relative flex h-full flex-col rounded-panel border p-7 sm:p-8 ${
        plan.popular ? "pricing-card-popular border-primary/30 lg:pb-10 lg:pt-10" : "pricing-card border-slate-200 shadow-card"
      }`}
    >
      {plan.badge && BadgeIcon && (
        <span className="pricing-badge-pulse absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-indigo-200">
          <BadgeIcon size={13} />
          {plan.badge.label}
        </span>
      )}

      <p className="text-sm font-bold text-slate-500">{plan.name}</p>
      <p className="mt-2 min-h-[2.5rem] text-sm leading-6 text-slate-600">{plan.tagline}</p>

      <div className="mt-6 flex items-end gap-1.5">
        <span className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
          $<CountUp key={`${plan.id}-${price}`} value={price} />
        </span>
        <span className="pb-1.5 text-sm font-semibold text-slate-500">{suffix}</span>
      </div>
      <p className="mt-1.5 h-4 text-xs font-semibold text-emerald-600">
        {isYearly ? "Save 20% with annual billing" : " "}
      </p>

      <div className="mt-4">{plan.popular ? <MagneticWrap className="block w-full">{cta}</MagneticWrap> : cta}</div>

      <ul className="mt-8 flex-1 space-y-3.5 border-t border-slate-100 pt-7">
        {plan.features.map((feature) => (
          <li key={feature.label}>
            <div className="flex items-start gap-2.5">
              {feature.included ? (
                <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" />
              ) : (
                <X size={16} className="mt-0.5 shrink-0 text-slate-300" />
              )}
              <span className={`text-sm leading-6 ${feature.included ? "text-slate-700" : "text-slate-400"}`}>
                {feature.label}
              </span>
            </div>
            {feature.detail && (
              <ul className="ml-[26px] mt-1.5 space-y-1">
                {feature.detail.map((line) => (
                  <li key={line} className="text-xs font-medium text-slate-500">
                    &bull; {line}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>

      {plan.footnote && <p className="mt-6 text-xs leading-5 text-slate-400">{plan.footnote}</p>}
    </article>
  );
}
