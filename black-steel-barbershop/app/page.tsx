import { About } from "@/components/about"
import { Features } from "@/components/features"
import { FinalCta } from "@/components/final-cta"
import { Footer } from "@/components/footer"
import { Gallery } from "@/components/gallery"
import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { Marquee } from "@/components/marquee"
import { Services } from "@/components/services"
import { Stats } from "@/components/stats"
import { Testimonials } from "@/components/testimonials"
import { WhatsAppButton } from "@/components/whatsapp-button"

export default function Home() {
  return (
    <>
      <Header />
      <main id="content">
        <Hero />
        <Marquee />
        <Stats />
        <Services />
        <Gallery />
        <Features />
        <About />
        <Testimonials />
        <FinalCta />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  )
}
