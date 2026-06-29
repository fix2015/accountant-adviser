import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/landing/Hero";
import { Stats } from "@/components/landing/Stats";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { Calculator } from "@/components/landing/Calculator";
import { Pricing } from "@/components/landing/Pricing";
import { Demo } from "@/components/landing/Demo";
import { Testimonials } from "@/components/landing/Testimonials";
import { CTA } from "@/components/landing/CTA";
import { NewsFeed } from "@/components/dashboard/NewsFeed";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-ds-bg-primary">
      <Header />
      <Hero />
      <Stats />
      <HowItWorks />
      <Features />
      <Calculator />
      <Pricing />
      <Demo />
      <Testimonials />
      {/* HMRC News section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-ds-text-primary mb-2">
            Latest UK Tax Updates
          </h2>
          <p className="text-sm text-ds-text-secondary">
            Stay informed with the latest HMRC news and how it affects your business
          </p>
        </div>
        <NewsFeed compact maxItems={4} />
      </section>
      <CTA />
      <Footer />
    </div>
  );
}
