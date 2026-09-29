import { ArrowRight } from "lucide-react"

import { site, whatsappUrl } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { WhatsAppIcon } from "./brand-icons"
import { Reveal } from "./reveal"

export function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="theme-light relative overflow-hidden bg-white text-black">
      {/* Letreiro gigante em marca d'água */}
      <p
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -bottom-[0.2em] text-center font-display text-[16vw] leading-none font-bold whitespace-nowrap uppercase text-black/[0.045] select-none"
      >
        Black Steel
      </p>

      <div className="relative mx-auto max-w-5xl px-5 py-24 text-center sm:px-8 sm:py-32">
        <Reveal>
          <p className="flex items-center justify-center gap-4 text-xs font-semibold uppercase tracking-[0.35em] text-neutral-600">
            <span aria-hidden className="h-px w-10 bg-black/30" />
            Your chair is ready
            <span aria-hidden className="h-px w-10 bg-black/30" />
          </p>
          <h2
            id="cta-title"
            className="mt-6 font-display text-5xl font-bold uppercase leading-[0.9] tracking-tight text-balance sm:text-7xl lg:text-8xl"
          >
            Book your appointment
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-neutral-600 sm:text-lg">
            Message us on WhatsApp and lock in your spot. Quick replies, no waiting for the chair.
          </p>
        </Reveal>

        <Reveal delay={0.15} className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild variant="dark" size="lg" className="w-full sm:w-auto">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon className="size-5!" />
              Book on WhatsApp
              <ArrowRight />
            </a>
          </Button>
          <a
            href={`tel:+${site.whatsapp}`}
            className="font-display text-sm uppercase tracking-[0.2em] underline decoration-black/30 underline-offset-8 transition-colors hover:decoration-black"
          >
            or call {site.phone}
          </a>
        </Reveal>
      </div>
    </section>
  )
}
