"use client";

import Image from "next/image";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { animate, createDrawable, stagger as animeStagger, type DrawableSVGGeometry } from "animejs";
import { Star } from "lucide-react";

import { gsap } from "@/lib/motion/gsap";
import { ANIME_EASE, DURATION, EASE, MOTION_OK_QUERY } from "@/lib/motion/tokens";

type MetricData = { value: number; suffix: string; label: string };

const metrics: MetricData[] = [
  { value: 20, suffix: "h+", label: "Saved weekly per team member" },
  { value: 45, suffix: "%", label: "Increase in developer replies" },
];

export default function TestimonialSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const starDrawablesRef = useRef<DrawableSVGGeometry[] | null>(null);
  const hasPlayedRef = useRef(false);

  function playVectorMoments() {
    if (hasPlayedRef.current || !sectionRef.current) return;
    hasPlayedRef.current = true;

    // Vector work — SVG stroke draw-in, then fill — is anime.js's job, not
    // GSAP's or Motion's. GSAP only decided *when* this fires (ScrollTrigger
    // onEnter below); it never touches these elements' properties itself.
    if (starDrawablesRef.current?.length) {
      const starPolygons = Array.from(
        sectionRef.current.querySelectorAll<SVGPolygonElement>("[data-testimonial='stars'] svg polygon"),
      );

      animate(starDrawablesRef.current, {
        draw: ["0 0", "0 1"],
        duration: 550,
        ease: ANIME_EASE.outQuad,
        delay: animeStagger(90),
      });

      animate(starPolygons, {
        fillOpacity: [0, 1],
        duration: 350,
        ease: ANIME_EASE.outQuad,
        delay: animeStagger(90, { start: 260 }),
      });
    }

    const countTargets = sectionRef.current.querySelectorAll<HTMLElement>("[data-testimonial='count']");

    countTargets.forEach((el) => {
      const target = Number(el.dataset.target ?? 0);
      const suffix = el.dataset.suffix ?? "";
      const counter = { value: 0 };

      animate(counter, {
        value: target,
        duration: 1100,
        ease: ANIME_EASE.outExpo,
        modifier: Math.round,
        onUpdate: () => {
          el.textContent = `${counter.value}${suffix}`;
        },
      });
    });
  }

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(MOTION_OK_QUERY, () => {
        gsap.from(cardRef.current, {
          scale: 0.94,
          y: 36,
          autoAlpha: 0,
          duration: DURATION.reveal,
          ease: EASE.outExpo,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
            once: true,
            onEnter: playVectorMoments,
          },
        });

        // Prep hidden state immediately on mount (plain DOM, no engine) so
        // there is no flash-of-solid-star when the ScrollTrigger fires later.
        const starPolygons = sectionRef.current?.querySelectorAll<SVGPolygonElement>(
          "[data-testimonial='stars'] svg polygon",
        );

        if (starPolygons?.length) {
          starPolygons.forEach((polygon) => polygon.setAttribute("fill-opacity", "0"));
          starDrawablesRef.current = createDrawable(Array.from(starPolygons));
        }

        sectionRef.current?.querySelectorAll<HTMLElement>("[data-testimonial='count']").forEach((el) => {
          el.textContent = `0${el.dataset.suffix ?? ""}`;
        });
      });
    },
    { scope: sectionRef },
  );

  return (
    <section id="customers" ref={sectionRef} className="bg-[#f4f6fa] px-5 pb-24 sm:px-8 lg:px-10">
      <div ref={cardRef} className="mx-auto max-w-7xl rounded-[28px] bg-white px-6 py-10 shadow-sm shadow-slate-200 sm:px-10 lg:px-14">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
          <div>
            <div data-testimonial="stars" className="flex text-amber-400" aria-label="Five star rating">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} size={16} fill="currentColor" />
              ))}
            </div>
            <blockquote className="mt-6 max-w-3xl text-2xl font-semibold leading-tight sm:text-3xl">
              &quot;AutoPilot didn&apos;t just save us time; it redefined how we interact with our developers. We&apos;re seeing{" "}
              <span className="text-primary">
                <span data-testimonial="count" data-target="3" data-suffix="X">
                  3X
                </span>{" "}
                engagement
              </span>{" "}
              with 90% less manual effort.&quot;
            </blockquote>
            <div className="mt-8 flex items-center gap-3">
              <Image
                src="/landing/testimonial-avatar.png"
                alt="Sarah Chen"
                width={52}
                height={52}
                className="h-[52px] w-[52px] rounded-full"
              />
              <div>
                <p className="text-sm font-semibold">Sarah Chen</p>
                <p className="text-xs text-slate-500">VP Growth, Vercel</p>
              </div>
            </div>
          </div>
          <div className="grid gap-4">
            {metrics.map((metric) => (
              <Metric key={metric.label} {...metric} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ value, suffix, label }: MetricData) {
  return (
    <div className="rounded-lg bg-slate-50 p-6">
      <strong data-testimonial="count" data-target={value} data-suffix={suffix} className="text-3xl font-black text-primary">
        {value}
        {suffix}
      </strong>
      <p className="mt-2 text-sm text-slate-500">{label}</p>
    </div>
  );
}
