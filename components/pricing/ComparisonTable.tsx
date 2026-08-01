"use client";

import { Fragment, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { Check, X } from "lucide-react";

import { gsap } from "@/lib/motion/gsap";
import { DURATION, EASE, MOTION_OK_QUERY } from "@/lib/motion/tokens";
import { COMPARISON_TABLE, FAIR_USE_NOTICE, PLANS, type ComparisonValue } from "./data";

function ValueCell({ value }: { value: ComparisonValue }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check size={17} className="mx-auto text-emerald-500" />
    ) : (
      <X size={17} className="mx-auto text-slate-300" />
    );
  }

  return <span className="text-sm font-semibold text-slate-700">{value}</span>;
}

export default function ComparisonTable() {
  const sectionRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(MOTION_OK_QUERY, () => {
        gsap.from(sectionRef.current, {
          y: 28,
          autoAlpha: 0,
          duration: DURATION.reveal,
          ease: EASE.outExpo,
          scrollTrigger: { trigger: sectionRef.current, start: "top 85%" },
        });
      });
    },
    { scope: sectionRef },
  );

  return (
    <div ref={sectionRef} className="mx-auto max-w-5xl">
      <div className="text-center">
        <h3 className="text-2xl font-semibold sm:text-3xl">Compare every plan in detail</h3>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">
          A full breakdown of what&apos;s included, so you always know exactly what you&apos;re paying for.
        </p>
      </div>

      <div className="-mx-5 mt-10 overflow-x-auto px-5 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 overflow-hidden rounded-card border border-slate-200 bg-white shadow-card">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                Feature
              </th>
              {PLANS.map((plan) => (
                <th
                  key={plan.id}
                  className={`px-4 py-4 text-center text-sm font-bold ${plan.popular ? "bg-primary-tint text-primary-active" : "text-slate-900"}`}
                >
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_TABLE.map((category) => (
              <Fragment key={category.name}>
                <tr>
                  <td
                    colSpan={PLANS.length + 1}
                    className="border-t border-slate-200 bg-slate-50 px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-500"
                  >
                    {category.name}
                  </td>
                </tr>
                {category.rows.map((row) => (
                  <tr key={row.feature} className="border-t border-slate-100">
                    <td className="sticky left-0 bg-white px-5 py-3.5 text-sm font-medium text-slate-700">
                      {row.feature}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <ValueCell value={row.free} />
                    </td>
                    <td className="bg-primary-tint/40 px-4 py-3.5 text-center">
                      <ValueCell value={row.pro} />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <ValueCell value={row.unlimited} />
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-6 text-slate-400">{FAIR_USE_NOTICE}</p>
    </div>
  );
}
