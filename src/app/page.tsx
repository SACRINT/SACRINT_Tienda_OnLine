import { HeroSection } from "@/app/components/home/HeroSection";
import { FeaturesSection } from "@/app/components/home/FeaturesSection";
import { PricingSection } from "@/app/components/home/PricingSection";
import { TestimonialsSection } from "@/app/components/home/TestimonialsSection";
import { FAQSection } from "@/app/components/home/FAQSection";
import { CTASection } from "@/app/components/home/CTASection";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
    </main>
  );
}
