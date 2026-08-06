import { Check, Lock, type LucideIcon } from "lucide-react";

import PressableLink, { PressableAnchor } from "@/components/motion/PressableLink";

type PlanLockedStateProps = {
  icon?: LucideIcon;
  title: string;
  description: string;
  features?: string[];
  requiredPlan?: "pro" | "unlimited";
};

const PLAN_LABELS = { pro: "Pro", unlimited: "Unlimited" };

/** Full-page "you don't have this yet" state for a page that's entirely
 * gated behind a plan (e.g. Auto-Reply on Free). Shows what the feature
 * does and a direct upgrade path — never the real feature UI itself. For
 * gating a single control inside an otherwise-usable page, wrap it instead
 * of using this. */
export default function PlanLockedState({
  icon: Icon = Lock,
  title,
  description,
  features = [],
  requiredPlan = "pro",
}: PlanLockedStateProps) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center rounded-panel border border-primary/20 bg-primary-tint px-8 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-control bg-white text-primary shadow-sm">
        <Icon className="h-6 w-6" />
      </span>
      <p className="mt-4 text-xs font-bold uppercase tracking-[0.1em] text-primary">
        Available on the {PLAN_LABELS[requiredPlan]} plan
      </p>
      <h2 className="mt-2 text-xl font-bold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>

      {features.length > 0 && (
        <ul className="mt-5 w-full max-w-xs space-y-2 text-left text-sm text-slate-700">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-emerald-500" />
              {feature}
            </li>
          ))}
        </ul>
      )}

      <PressableAnchor
        href={`/api/billing/checkout?plan=${requiredPlan}&period=monthly`}
        className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-primary-hover"
      >
        Upgrade to {PLAN_LABELS[requiredPlan]}
      </PressableAnchor>
      <PressableLink
        href="/dashboard/settings/billing"
        className="mt-3 text-xs font-semibold text-primary hover:underline"
      >
        Compare all plans
      </PressableLink>
    </div>
  );
}
