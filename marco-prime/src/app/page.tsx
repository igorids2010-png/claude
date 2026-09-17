import { About } from "@/components/about";
import { Differentials } from "@/components/differentials";
import { FeaturedProperties } from "@/components/featured-properties";
import { FinalCta } from "@/components/final-cta";
import { Hero } from "@/components/hero";
import { PropertyFilterProvider } from "@/components/property-filters";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Stats } from "@/components/stats";
import { Testimonials } from "@/components/testimonials";

export default function HomePage() {
  return (
    <PropertyFilterProvider>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-6 focus:top-6 focus:z-[60] focus:bg-gold focus:px-5 focus:py-3 focus:text-sm focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>

      <SiteHeader />

      <main id="conteudo">
        <Hero />
        <Stats />
        <FeaturedProperties />
        <Differentials />
        <About />
        <Testimonials />
        <FinalCta />
      </main>

      <SiteFooter />
    </PropertyFilterProvider>
  );
}
