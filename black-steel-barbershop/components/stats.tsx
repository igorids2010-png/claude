"use client"

import { useEffect, useRef, useState } from "react"
import { animate, useInView, useReducedMotion } from "framer-motion"
import { Star } from "lucide-react"

import { stats } from "@/lib/data"
import { Reveal } from "./reveal"

const formatter = new Intl.NumberFormat("pt-BR")

function Counter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  const reduce = useReducedMotion()
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduce) {
      setDisplay(value)
      return
    }
    const controls = animate(0, value, {
      duration: 2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
  }, [inView, reduce, value])

  return <span ref={ref}>{formatter.format(display)}</span>
}

export function Stats() {
  return (
    <section id="numeros" aria-label="Números da barbearia" className="border-y border-line bg-background">
      <div className="mx-auto grid max-w-7xl grid-cols-1 sm:grid-cols-3">
        {stats.map((stat, i) => (
          <Reveal
            key={stat.label}
            delay={i * 0.12}
            className="group relative border-line px-5 py-12 text-center not-last:border-b sm:px-8 sm:py-16 sm:not-last:border-r sm:not-last:border-b-0"
          >
            <p className="font-display text-6xl font-bold tracking-tight tabular-nums sm:text-6xl lg:text-7xl">
              {stat.prefix}
              <Counter value={stat.value} />
              {stat.suffix}
            </p>
            {stat.stars && (
              <p className="mt-3 flex justify-center gap-1" aria-label="5 de 5 estrelas">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} aria-hidden className="size-4 fill-white text-white" />
                ))}
              </p>
            )}
            <p className="mt-4 text-xs font-medium uppercase tracking-[0.35em] text-muted">{stat.label}</p>
            <span
              aria-hidden
              className="absolute inset-x-1/2 bottom-0 h-px bg-white transition-all duration-500 group-hover:inset-x-8"
            />
          </Reveal>
        ))}
      </div>
    </section>
  )
}
