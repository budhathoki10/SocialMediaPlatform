import CtaSection from "./CtaSection";
import DemoSection from "./DemoSection";
import FeaturesSection from "./FeaturesSection";
import GrowthSection from "./GrowthSection";
import HeroSection from "./HeroSection";
import PainSection from "./PainSection";
import SiteFooter from "./SiteFooter";
import TestimonialSection from "./TestimonialSection";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <HeroSection />
      <FeaturesSection />
      <PainSection />
      <TestimonialSection />
      <GrowthSection />
      <DemoSection />
      <CtaSection />
      <SiteFooter />
    </main>
  );
}
