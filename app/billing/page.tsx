import type { Metadata } from "next";

import SiteNav from "@/components/landing/SiteNav";
import ComparisonTable from "@/components/pricing/ComparisonTable";
import FAQAccordion from "@/components/pricing/FAQAccordion";
import PricingCards from "@/components/pricing/PricingCards";
import TrustBar from "@/components/pricing/TrustBar";
import CtaSection from "@/app/(landing)/CtaSection";
import SiteFooter from "@/app/(landing)/SiteFooter";

export const metadata: Metadata = {
  title: "Pricing | AutoPilot",
  description:
    "Simple, transparent pricing for AutoPilot. Start free and upgrade as your social media and customer engagement grow.",
};

export default function BillingPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
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
