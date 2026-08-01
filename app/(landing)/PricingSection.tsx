import FAQAccordion from "@/components/pricing/FAQAccordion";
import PricingCards from "@/components/pricing/PricingCards";
import TrustBar from "@/components/pricing/TrustBar";

export default function PricingSection() {
  return (
    <section id="pricing" className="bg-[#f7f8fb] px-5 py-24 sm:px-8 lg:px-10">
      <PricingCards />
      <div className="mt-20">
        <TrustBar />
      </div>
      <div className="mt-20">
        <FAQAccordion />
      </div>
    </section>
  );
}
