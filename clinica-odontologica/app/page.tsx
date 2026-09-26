import { Header } from "@/components/sections/header";
import { Hero } from "@/components/sections/hero";
import { Stats } from "@/components/sections/stats";
import { Treatments } from "@/components/sections/treatments";
import { Marquee } from "@/components/sections/marquee";
import { About } from "@/components/sections/about";
import { Differentials } from "@/components/sections/differentials";
import { Gallery } from "@/components/sections/gallery";
import { Testimonials } from "@/components/sections/testimonials";
import { FinalCta } from "@/components/sections/final-cta";
import { Footer } from "@/components/sections/footer";
import { WhatsappButton } from "@/components/whatsapp-button";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Stats />
        <Treatments />
        <Marquee />
        <About />
        <Differentials />
        <Gallery />
        <Testimonials />
        <FinalCta />
      </main>
      <Footer />
      <WhatsappButton />
    </>
  );
}
