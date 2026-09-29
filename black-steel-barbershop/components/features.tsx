import { Armchair, CalendarCheck, Droplet, Scissors, type LucideIcon } from "lucide-react"

import { features } from "@/lib/data"
import { Reveal } from "./reveal"
import { SectionHeading } from "./section-heading"

const icons: Record<(typeof features)[number]["icon"], LucideIcon> = {
  scissors: Scissors,
  droplet: Droplet,
  armchair: Armchair,
  calendar: CalendarCheck,
}

export function Features() {
  return (
    <section aria-labelledby="features-title" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          id="features-title"
          eyebrow="Why us"
          title="Why Black Steel"
          align="center"
        />

        <ul className="mt-16 grid border-t border-l border-line sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => {
            const Icon = icons[feature.icon]
            return (
              <Reveal
                as="li"
                key={feature.title}
                delay={i * 0.1}
                className="group relative border-r border-b border-line p-8 transition-colors duration-500 hover:bg-surface sm:p-10"
              >
                <span className="grid size-14 place-items-center border border-line-strong transition-all duration-500 group-hover:border-white group-hover:bg-white group-hover:text-black">
                  <Icon aria-hidden strokeWidth={1.25} className="size-6" />
                </span>
                <h3 className="mt-8 font-display text-xl font-bold uppercase tracking-wide">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{feature.text}</p>
                <span aria-hidden className="absolute top-8 right-8 font-display text-xs text-subtle tabular-nums">
                  0{i + 1}
                </span>
              </Reveal>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
