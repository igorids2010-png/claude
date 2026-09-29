import { ArrowRight } from "lucide-react"

import { services, whatsappUrl } from "@/lib/data"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Reveal } from "./reveal"
import { SectionHeading } from "./section-heading"
import { ServiceCard } from "./service-card"

export function Services() {
  return (
    <section id="services" aria-labelledby="services-title" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            id="services-title"
            eyebrow="Services"
            title="The full ritual"
            description="Every service is done with skill, patience and top-shelf products. No rush, no shortcuts."
          />
          <Reveal delay={0.2}>
            <Button asChild variant="outline">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                Book now
                <ArrowRight />
              </a>
            </Button>
          </Reveal>
        </div>

        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
          {services.map((service, i) => (
            <Reveal
              as="li"
              key={service.id}
              delay={(i % 3) * 0.1}
              // 3 cards em cima e 2 embaixo, preenchendo a largura inteira
              className={cn(
                "lg:col-span-2",
                i >= 3 && "lg:col-span-3",
                i === services.length - 1 && services.length % 2 === 1 && "sm:col-span-2 lg:col-span-3",
              )}
            >
              <ServiceCard service={service} index={i} />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
