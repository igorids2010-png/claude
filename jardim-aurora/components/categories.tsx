"use client"

import { categories, type Category } from "@/lib/data"
import { cn } from "@/lib/utils"
import { Branch } from "@/components/botanical-ornaments"
import { RevealGroup, RevealItem } from "@/components/reveal"
import { SectionHeading } from "@/components/section-heading"
import { CategoryCard } from "@/components/category-card"
import { useShop } from "@/components/shop-provider"

export function Categories() {
  const { setFilter } = useShop()
  const handleSelect = (category: Category) => setFilter(category.filter ?? "todos")

  return (
    <section id="arranjos" aria-labelledby="arranjos-title" className="relative overflow-hidden bg-cream-200/60 py-24 sm:py-32">
      <Branch className="absolute -top-6 -left-10 hidden h-80 text-gold-500/70 md:block" />
      <Branch className="absolute -right-8 -bottom-10 hidden h-72 rotate-180 text-gold-500/60 md:block" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          id="arranjos-title"
          eyebrow="Arranjos & categorias"
          title={
            <>
              Uma flor para cada <em className="font-normal text-gold-700">momento</em>
            </>
          }
          description="Do buquê clássico ao arranjo de mesa: navegue pelo estilo que combina com a sua ocasião."
        />

        <RevealGroup
          stagger={0.1}
          className="mt-14 grid auto-rows-[18rem] gap-4 sm:grid-cols-2 sm:gap-5 lg:auto-rows-[17rem] lg:grid-cols-4"
        >
          {categories.map((category, i) => (
            <RevealItem
              key={category.id}
              className={cn(i === 0 && "sm:col-span-2 lg:row-span-2")}
            >
              <CategoryCard category={category} featured={i === 0} onSelect={handleSelect} />
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
