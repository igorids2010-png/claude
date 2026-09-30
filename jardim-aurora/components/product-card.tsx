"use client"

import Image from "next/image"
import { ShoppingBag } from "lucide-react"

import type { Bouquet } from "@/lib/data"
import { formatPrice } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type ProductCardProps = {
  bouquet: Bouquet
  onOrder: (bouquet: Bouquet) => void
}

export function ProductCard({ bouquet, onOrder }: ProductCardProps) {
  const { name, flowers, price, badge, image } = bouquet

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-gold-500/0 bg-cream-50 shadow-[0_1px_0_rgb(31_58_46/0.06)] ring-1 ring-forest-800/8 transition-all duration-500 ease-soft hover:-translate-y-1.5 hover:border-gold-500/70 hover:shadow-[0_30px_60px_-35px_rgb(31_58_46/0.55)] hover:ring-gold-500/50">
      <div className="relative aspect-[4/5] overflow-hidden bg-cream-200">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
          placeholder={image.blurDataURL ? "blur" : "empty"}
          blurDataURL={image.blurDataURL}
          className="object-cover transition-transform duration-[1200ms] ease-soft group-hover:scale-[1.07]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-forest-950/35 via-transparent to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-90"
        />
        {badge ? (
          <Badge variant={badge === "Mais vendido" ? "gold" : "cream"} className="absolute top-4 left-4 shadow-sm">
            {badge}
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex flex-col gap-1.5">
          <h3 className="text-[1.4rem] leading-tight font-medium text-forest-800">{name}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{flowers}</p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-dashed border-gold-500/35 pt-4">
          <p className="flex flex-col">
            <span className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">a partir de</span>
            <span className="font-serif text-xl font-semibold text-forest-800">{formatPrice(price)}</span>
          </p>
          <Button
            type="button"
            size="sm"
            onClick={() => onOrder(bouquet)}
            className="group/btn hover:bg-gold-500 hover:text-forest-900"
            aria-label={`Encomendar ${name}`}
          >
            <ShoppingBag className="transition-transform duration-300 group-hover/btn:-rotate-12" />
            Encomendar
          </Button>
        </div>
      </div>
    </article>
  )
}
