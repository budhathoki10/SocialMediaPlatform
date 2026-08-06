export type BillingPeriod = "monthly" | "yearly";

export type PlanFeature = {
  label: string;
  included: boolean;
  /** Nested detail lines, e.g. Pro's "Response Style Controls" (Tone, Length, Emoji). */
  detail?: string[];
};

export type Plan = {
  id: "free" | "pro" | "unlimited";
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number | null;
  ctaLabel: string;
  ctaHref: string;
  ctaStyle: "outline" | "primary" | "gradient";
  badge?: { icon: "flame" | "zap"; label: string };
  footnote?: string;
  popular?: boolean;
  features: PlanFeature[];
};

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Perfect for individuals exploring AutoPilot.",
    monthlyPrice: 0,
    yearlyPrice: null,
    ctaLabel: "Start Free",
    ctaHref: "/login?callbackUrl=/onboarding",
    ctaStyle: "outline",
    features: [
      { label: "Instagram Integration", included: true },
      { label: "LinkedIn Integration", included: true },
      { label: "GitHub Integration", included: true },
      { label: "WhatsApp Integration", included: false },
      { label: "5 Scheduled Posts / Month", included: true },
      { label: "Basic Analytics", included: true },
      { label: "Community Support", included: true },
      { label: "1 Account per Platform", included: true },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For businesses actively managing social media and customer engagement.",
    monthlyPrice: 15,
    yearlyPrice: 144,
    ctaLabel: "Upgrade to Pro",
    ctaHref: "/login?callbackUrl=/onboarding",
    ctaStyle: "primary",
    badge: { icon: "flame", label: "Most Popular" },
    popular: true,
    footnote: "Auto reply overage: $0.03 per additional reply.",
    features: [
      { label: "Everything in Free", included: true },
      { label: "WhatsApp Integration", included: true },
      { label: "Unlimited Scheduled Posts", included: true },
      { label: "Full Analytics Dashboard", included: true },
      { label: "2000 AI Auto Replies / Month", included: true },
      { label: "Contact Filtering", included: true },
      { label: "Keyword Exclusions", included: true },
      { label: "Human Fallback Threshold", included: true },
      { label: "Response Style Controls", included: true, detail: ["Tone", "Length", "Emoji Usage"] },
      { label: "Priority Email Support", included: true },
      { label: "1 Account Per Platform", included: true },
    ],
  },
  {
    id: "unlimited",
    name: "Unlimited",
    tagline: "Built for agencies, multi-brand businesses, and power users.",
    monthlyPrice: 39,
    yearlyPrice: 374,
    ctaLabel: "Go Unlimited",
    ctaHref: "/login?callbackUrl=/onboarding",
    ctaStyle: "gradient",
    badge: { icon: "zap", label: "Best for Agencies" },
    footnote: "*Unlimited Auto Replies are subject to fair-use policies.",
    features: [
      { label: "Everything in Pro", included: true },
      { label: "Unlimited Scheduled Posts", included: true },
      { label: "Unlimited AI Auto Replies*", included: true },
      { label: "Multiple Connected Accounts", included: true },
    ],
  },
];

export type ComparisonValue = boolean | string;

export type ComparisonRow = {
  feature: string;
  free: ComparisonValue;
  pro: ComparisonValue;
  unlimited: ComparisonValue;
};

export type ComparisonCategory = {
  name: string;
  rows: ComparisonRow[];
};

export const COMPARISON_TABLE: ComparisonCategory[] = [
  {
    name: "Platforms",
    rows: [
      { feature: "Instagram", free: true, pro: true, unlimited: true },
      { feature: "LinkedIn", free: true, pro: true, unlimited: true },
      { feature: "GitHub", free: true, pro: true, unlimited: true },
      { feature: "WhatsApp", free: false, pro: true, unlimited: true },
    ],
  },
  {
    name: "Posting",
    rows: [
      { feature: "Scheduled Posts", free: "5 / month", pro: "Unlimited", unlimited: "Unlimited" },
      { feature: "Analytics", free: "Basic", pro: "Full", unlimited: "Full + Export" },
    ],
  },
  {
    name: "Auto Reply",
    rows: [
      { feature: "AI Auto Replies", free: false, pro: "2000 / month", unlimited: "Unlimited*" },
      { feature: "Contact Filtering", free: false, pro: true, unlimited: true },
      { feature: "Keyword Exclusions", free: false, pro: true, unlimited: true },
      { feature: "Human Fallback", free: false, pro: true, unlimited: true },
      { feature: "Tone Controls", free: false, pro: true, unlimited: true },
      { feature: "Emoji Controls", free: false, pro: true, unlimited: true },
      { feature: "Length Controls", free: false, pro: true, unlimited: true },
    ],
  },
  {
    name: "Team & Accounts",
    rows: [
      { feature: "Connected Accounts", free: "1 / platform", pro: "1 / platform", unlimited: "Multiple" },
    ],
  },
  {
    name: "Support",
    rows: [
      { feature: "Community Support", free: true, pro: true, unlimited: true },
      { feature: "Priority Email", free: false, pro: true, unlimited: true },
    ],
  },
];

export const FAIR_USE_NOTICE =
  "*Unlimited Auto Replies are subject to reasonable fair-use policies designed to prevent abuse and ensure platform reliability for all customers.";

export type FaqItem = { question: string; answer: string };

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Can I change plans anytime?",
    answer: "Yes. Upgrade, downgrade, or cancel at any time.",
  },
  {
    question: "What happens if I exceed my Pro Auto Reply limit?",
    answer: "Additional replies are billed at $0.03 per reply.",
  },
  {
    question: "Is WhatsApp available on the Free plan?",
    answer: "No. WhatsApp integration is available on Pro and Unlimited plans.",
  },
  {
    question: "What does Unlimited mean?",
    answer: "Unlimited plans do not have visible usage caps but remain subject to fair-use policies.",
  },
  {
    question: "Do yearly plans include discounts?",
    answer: "Yes. Annual billing provides approximately 20% savings compared to monthly pricing.",
  },
];
