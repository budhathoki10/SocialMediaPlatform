"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { MousePointer2 } from "lucide-react";

import { gsap } from "@/lib/motion/gsap";
import { DURATION, EASE, MOTION_OK_QUERY } from "@/lib/motion/tokens";

export default function DemoSection() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(MOTION_OK_QUERY, () => {
        gsap.from("[data-demo='frame']", {
          scale: 0.94,
          autoAlpha: 0,
          duration: DURATION.reveal,
          ease: EASE.outExpo,
          scrollTrigger: { trigger: sectionRef.current, start: "top 82%" },
        });
      });
    },
    { scope: sectionRef },
  );

  return (
    <section id="demo" ref={sectionRef} className="bg-white px-5 pb-14 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div data-demo="frame" className="video-placeholder">
          <div className="video-play">
            <MousePointer2 size={26} />
          </div>
          <div>
            <p>Demo video placeholder</p>
            <span>Add your product walkthrough video here later.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
