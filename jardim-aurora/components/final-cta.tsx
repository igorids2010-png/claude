import Image from "next/image"
import { Phone } from "lucide-react"

import { contact } from "@/lib/data"
import { images } from "@/lib/images"
import { whatsappLink } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Branch, SprigDivider } from "@/components/botanical-ornaments"
import { Reveal } from "@/components/reveal"
import { WhatsAppIcon } from "@/components/icons"

export function FinalCta() {
  return (
    <section id="contato" aria-labelledby="contato-title" className="bg-paper px-3 py-3 sm:px-5 sm:py-5">
      <div className="relative isolate overflow-hidden rounded-[2rem] bg-forest-800 px-6 py-24 text-center sm:rounded-[2.5rem] sm:px-10 sm:py-32">
        <Image
          src={images.cta.src}
          alt=""
          fill
          sizes="100vw"
          placeholder="blur"
          blurDataURL={images.cta.blurDataURL}
          className="-z-20 object-cover opacity-30 mix-blend-luminosity"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgb(31_58_46/0.75)_0%,rgb(23_45_35/0.95)_70%)]"
        />
        {/* Moldura e ramos dourados */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-4 rounded-[1.6rem] border border-gold-500/30 sm:inset-6 sm:rounded-[2rem]" />
        <Branch className="absolute -top-4 left-0 h-40 text-gold-500/40 sm:left-8 sm:h-80 sm:text-gold-500/70" />
        <Branch className="absolute right-0 -bottom-4 h-40 rotate-180 text-gold-500/40 sm:right-8 sm:h-80 sm:text-gold-500/70" />

        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6">
          <Reveal>
            <span className="text-xs font-semibold tracking-[0.28em] text-gold-400 uppercase">Encomende hoje</span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 id="contato-title" className="text-[2.5rem] leading-[1.08] font-medium text-cream-50 sm:text-5xl lg:text-6xl">
              Surpreenda alguém <em className="font-normal text-gold-400">ainda hoje</em>
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <SprigDivider className="text-gold-500" />
          </Reveal>
          <Reveal delay={0.2}>
            <p className="max-w-xl text-lg leading-relaxed text-cream-100/80">
              Fale com a nossa florista pelo WhatsApp: ajudamos a escolher o buquê, escrevemos o cartão e entregamos no
              mesmo dia para pedidos até as 16h.
            </p>
          </Reveal>
          <Reveal delay={0.3} className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
            <div className="relative">
              <span aria-hidden="true" className="absolute inset-0 animate-pulse-ring rounded-full bg-gold-500/50" />
              <Button asChild variant="gold" size="lg" className="relative h-15 px-9 text-base">
                <a href={whatsappLink(contact.whatsapp, contact.whatsappMessage)} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="size-6" />
                  Encomendar pelo WhatsApp
                </a>
              </Button>
            </div>
            <Button asChild variant="outline-cream" size="lg" className="h-15 px-7">
              <a href={contact.phoneHref}>
                <Phone />
                {contact.phone}
              </a>
            </Button>
          </Reveal>
          <Reveal delay={0.4}>
            <p className="text-sm text-cream-100/60">
              {contact.hours.map((h) => `${h.days}: ${h.time}`).join(" · ")}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
