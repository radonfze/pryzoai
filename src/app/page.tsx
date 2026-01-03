import {
  Header,
  HeroSection,
  TrustedBy,
  FeaturesGrid,
  ProductShowcase,
  Testimonials,
  PricingSection,
  IntegrationsSection,
  CtaSection,
  Footer,
} from "@/components/landing";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <TrustedBy />
      <FeaturesGrid />
      <ProductShowcase />
      <Testimonials />
      <PricingSection />
      <IntegrationsSection />
      <CtaSection />
      <Footer />
    </main>
  );
}
