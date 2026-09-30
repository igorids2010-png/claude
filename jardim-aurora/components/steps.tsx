"use client"

import { motion, useReducedMotion } from "motion/react"
import { Flower2, PenLine, Truck, type LucideIcon } from "lucide-react"

import { steps, type StepIcon } from "@/lib/data"
import { RevealGroup, RevealItem } from "@/components/reveal"
import { SectionHeading } from "@/components/section-heading"

const icons: Record<StepIcon, LucideIcon> = {
  flower: Flower2,
  card: PenLine,
  delivery: Truck,
}

const WAVE = "M0 20C160-6 340 46 500 20S840-6 1000 20"

/** Linha pontilhada dourada que "se desenha" ao rolar (máscara animada sobre um traço tracejado). */
function ConnectorLine() {
  const reduce = useReducedMotion()
  return (
    <svg
      viewBox="0 0 1000 40"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="pointer-events-none absolute top-[2.5rem] left-[calc(100%/6_-_0.667rem)] hidden h-10 w-[calc(200%/3_+_1.333rem)] -translate-y-1/2 md:block"
    >
      <defs>
        <mask id="steps-line-mask" maskUnits="userSpaceOnUse" x="0" y="-20" width="1000" height="80">
          <motion.path
            d={WAVE}
            fill="none"
            stroke="white"
            strokeWidth={12}
            initial={reduce ? false : { pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, margin: "0px 0px -20% 0px" }}
            transition={{ duration: 2.4, ease: [0.65, 0, 0.35, 1], delay: 0.3 }}
          />
        </mask>
      </defs>
      <path
        d={WAVE}
        fill="none"
        stroke="var(--color-gold-500)"
        strokeWidth={1.5}
        strokeDasharray="2 7"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        mask="url(#steps-line-mask)"
      />
    </svg>
  )
}

export function Steps() {
  return (
    <section id="como-funciona" aria-labelledby="como-funciona-title" className="bg-paper relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading
          id="como-funciona-title"
          eyebrow="Como funciona"
          title={
            <>
              Do nosso ateliê até <em className="font-normal text-gold-700">você</em>
            </>
          }
          description="Encomendar flores deve ser tão leve quanto recebê-las. São só três passos."
        />

        <div className="relative mt-16">
          <ConnectorLine />
          <RevealGroup stagger={0.2} className="relative grid gap-14 md:grid-cols-3 md:gap-8">
            {steps.map((step, i) => {
              const Icon = icons[step.icon]
              return (
                <RevealItem key={step.title} className="group flex flex-col items-center text-center">
                  <div className="relative">
                    <div className="grid size-20 place-items-center rounded-full border border-gold-500/70 bg-cream-50 text-gold-600 shadow-[0_0_0_8px_var(--color-cream-100)] transition-all duration-500 group-hover:border-gold-500 group-hover:bg-forest-800 group-hover:text-gold-400">
                      <Icon className="size-8" strokeWidth={1.2} />
                    </div>
                    <span className="absolute -top-1 -right-3 grid size-8 place-items-center rounded-full bg-forest-800 font-serif text-sm font-semibold text-gold-400 ring-4 ring-cream-100">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-7 text-2xl font-medium text-forest-800">{step.title}</h3>
                  <p className="mt-3 max-w-xs leading-relaxed text-muted-foreground">{step.description}</p>
                </RevealItem>
              )
            })}
          </RevealGroup>
        </div>
      </div>
    </section>
  )
}
