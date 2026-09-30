import { About } from "@/components/about"
import { CartSheet } from "@/components/cart-sheet"
import { Categories } from "@/components/categories"
import { FeaturedBouquets } from "@/components/featured-bouquets"
import { Features } from "@/components/features"
import { FinalCta } from "@/components/final-cta"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { Marquee } from "@/components/marquee"
import { Stats } from "@/components/stats"
import { Steps } from "@/components/steps"
import { Testimonials } from "@/components/testimonials"
import { WhatsAppButton } from "@/components/whatsapp-button"

export default function Home() {
  return (
    <>
      <Header />
      <main id="conteudo" tabIndex={-1} className="outline-none">
        <Hero />
        <Stats />
        <Marquee />
        <FeaturedBouquets />
        <Categories />
        <Steps />
        <Features />
        <About />
        <Testimonials />
        <FinalCta />
      </main>
      <Footer />
      <CartSheet />
      <WhatsAppButton />
    </>
  )
}
