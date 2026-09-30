import { HandHeart, Recycle, Sprout, Timer, type LucideIcon } from "lucide-react"

import { features, type FeatureIcon } from "@/lib/data"
import { Branch } from "@/components/botanical-ornaments"
import { RevealGroup, RevealItem } from "@/components/reveal"
import { SectionHeading } from "@/components/section-heading"

const icons: Record<FeatureIcon, LucideIcon> = {
  fresh: Sprout,
  handmade: HandHeart,
  fast: Timer,
  eco: Recycle,
}

export function Features() {
  return (
    <section
      id="diferenciais"
      aria-labelledby="diferenciais-title"
      className="relative isolate overflow-hidden bg-forest-800 py-24 text-cream-100 sm:py-32"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgb(201_169_97/0.14),transparent_60%)]"
      />
      <Branch className="absolute top-10 -left-6 -z-10 hidden h-96 text-gold-500/35 md:block" />
      <Branch className="absolute -right-4 bottom-0 -z-10 hidden h-80 -scale-x-100 text-gold-500/30 md:block" />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          id="diferenciais-title"
          tone="dark"
          eyebrow="Nossos diferenciais"
          title={
            <>
              Cuidado em cada <em className="font-normal text-gold-400">detalhe</em>
            </>
          }
          description="Mais do que entregar flores, entregamos o momento em que alguém se sente lembrado."
        />

        <RevealGroup stagger={0.12} className="mt-16 grid gap-px overflow-hidden rounded-[2rem] border border-gold-500/20 bg-gold-500/15 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = icons[feature.icon]
            return (
              <RevealItem
                key={feature.title}
                className="group flex flex-col gap-5 bg-forest-800 p-8 transition-colors duration-500 hover:bg-forest-700/60 sm:p-10"
              >
                <span className="grid size-16 place-items-center rounded-full border border-gold-500/50 text-gold-400 transition-all duration-500 group-hover:rotate-[-8deg] group-hover:border-gold-400 group-hover:bg-gold-500 group-hover:text-forest-900">
                  <Icon className="size-7" strokeWidth={1.2} />
                </span>
                <h3 className="text-[1.4rem] leading-tight font-medium text-cream-50">{feature.title}</h3>
                <p className="leading-relaxed text-cream-100/75">{feature.description}</p>
              </RevealItem>
            )
          })}
        </RevealGroup>
      </div>
    </section>
  )
}
