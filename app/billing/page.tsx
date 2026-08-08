import type { Metadata } from "next";

import SiteNav from "@/components/landing/SiteNav";
import ComparisonTable from "@/components/pricing/ComparisonTable";
import FAQAccordion from "@/components/pricing/FAQAccordion";
import PricingCards from "@/components/pricing/PricingCards";
import TrustBar from "@/components/pricing/TrustBar";
import { FAQ_ITEMS, PLANS } from "@/components/pricing/data";
import CtaSection from "@/app/(landing)/CtaSection";
import SiteFooter from "@/app/(landing)/SiteFooter";
import JsonLd from "@/components/seo/JsonLd";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for AutoPilot. Start free and upgrade to Pro or Unlimited as your social media automation and customer engagement grow.",
  alternates: {
    canonical: "/billing",
  },
};

const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: `${SITE_URL}/billing`,
  offers: PLANS.map((plan) => ({
    "@type": "Offer",
    name: plan.name,
    price: plan.monthlyPrice,
    priceCurrency: "USD",
    description: plan.tagline,
  })),
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export default function BillingPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <JsonLd data={softwareApplicationJsonLd} />
      <JsonLd data={faqJsonLd} />
      <SiteNav />
      <section className="px-5 py-20 sm:px-8 sm:py-24 lg:px-10">
        <PricingCards titleAs="h1" />
        <div className="mt-24">
          <ComparisonTable />
        </div>
        <div className="mt-20">
          <TrustBar />
        </div>
        <div className="mt-20">
          <FAQAccordion />
        </div>
      </section>
      <CtaSection />
      <SiteFooter />
    </main>
  );
}
