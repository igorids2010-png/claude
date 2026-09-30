"use client"

import { AnimatePresence, motion } from "motion/react"

import { bouquetFilters, bouquets, type BouquetFilter } from "@/lib/data"
import { cn } from "@/lib/utils"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Reveal } from "@/components/reveal"
import { SectionHeading } from "@/components/section-heading"
import { ProductCard } from "@/components/product-card"
import { useShop } from "@/components/shop-provider"

export function FeaturedBouquets() {
  const { filter, setFilter, add } = useShop()
  const visible = filter === "todos" ? bouquets : bouquets.filter((b) => b.category === filter)

  return (
    <section id="buques" aria-labelledby="buques-title" className="bg-paper relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          id="buques-title"
          eyebrow="Vitrine da semana"
          title={
            <>
              Buquês em <em className="font-normal text-gold-700">destaque</em>
            </>
          }
          description="Montados à mão na manhã da entrega, com flores escolhidas uma a uma."
        />

        <Reveal delay={0.1} className="mt-12 flex justify-center">
          <ToggleGroup
            type="single"
            value={filter}
            onValueChange={(value) => value && setFilter(value as BouquetFilter)}
            aria-label="Filtrar buquês por estilo"
            className="gap-1 rounded-full border border-gold-500/30 bg-cream-50/80 p-1.5 shadow-sm"
          >
            {bouquetFilters.map((option) => {
              const selected = filter === option.value
              return (
                <ToggleGroupItem
                  key={option.value}
                  value={option.value}
                  className={cn(
                    "relative rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300 sm:px-6",
                    selected ? "text-cream-100" : "text-forest-800/70 hover:text-forest-800"
                  )}
                >
                  {selected ? (
                    <motion.span
                      layoutId="filter-pill"
                      className="absolute inset-0 rounded-full bg-forest-800"
                      transition={{ type: "spring", stiffness: 400, damping: 34 }}
                    />
                  ) : null}
                  <span className="relative">{option.label}</span>
                </ToggleGroupItem>
              )
            })}
          </ToggleGroup>
        </Reveal>

        <p className="sr-only" aria-live="polite">
          {visible.length} {visible.length === 1 ? "buquê exibido" : "buquês exibidos"}
        </p>

        <motion.ul layout className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((bouquet, i) => (
              <motion.li
                key={bouquet.id}
                layout
                initial={{ opacity: 0, y: 40, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "0px 0px -8% 0px" }}
                exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.25 } }}
                transition={{ duration: 0.7, delay: (i % 3) * 0.12, ease: [0.22, 1, 0.36, 1] }}
              >
                <ProductCard bouquet={bouquet} onOrder={add} />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      </div>
    </section>
  )
}
