"use client"

import Image from "next/image"
import { ArrowUpRight } from "lucide-react"

import type { Category } from "@/lib/data"
import { cn } from "@/lib/utils"

type CategoryCardProps = {
  category: Category
  featured?: boolean
  onSelect?: (category: Category) => void
  className?: string
}

export function CategoryCard({ category, featured = false, onSelect, className }: CategoryCardProps) {
  const { name, description, image, href } = category

  return (
    <a
      href={href}
      onClick={() => onSelect?.(category)}
      className={cn(
        "group relative isolate flex h-full min-h-64 flex-col justify-end overflow-hidden rounded-[1.75rem] bg-forest-800 p-6 ring-1 ring-forest-800/10 transition-shadow duration-500 hover:shadow-[0_30px_60px_-30px_rgb(31_58_46/0.7)] sm:p-7",
        featured && "lg:p-10",
        className
      )}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes={featured ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"}
        placeholder={image.blurDataURL ? "blur" : "empty"}
        blurDataURL={image.blurDataURL}
        className="-z-20 object-cover transition-transform duration-[1400ms] ease-soft group-hover:scale-110"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-forest-950/90 via-forest-900/35 to-transparent transition-opacity duration-500 group-hover:from-forest-950/95 group-hover:via-forest-900/55"
      />
      {/* Moldura dourada que aparece no hover */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-3 rounded-[1.35rem] border border-gold-400/0 transition-all duration-500 group-hover:inset-4 group-hover:border-gold-400/60"
      />

      <div className="flex items-end justify-between gap-4">
        <div>
          <h3 className={cn("font-medium text-cream-50", featured ? "text-3xl sm:text-4xl" : "text-2xl")}>{name}</h3>
          <p
            className={cn(
              "mt-2 max-w-xs text-sm leading-relaxed text-cream-100/80 transition-all duration-500",
              !featured &&
                "sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-visible:translate-y-0 sm:group-focus-visible:opacity-100"
            )}
          >
            {description}
          </p>
        </div>
        <span
          aria-hidden="true"
          className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full border border-gold-400/60 text-gold-300 transition-colors duration-500 group-hover:bg-gold-500 group-hover:text-forest-900"
        >
          <span className="relative block size-5">
            <ArrowUpRight className="absolute inset-0 size-5 transition-transform duration-500 ease-soft group-hover:translate-x-5 group-hover:-translate-y-5" />
            <ArrowUpRight className="absolute inset-0 size-5 -translate-x-5 translate-y-5 transition-transform duration-500 ease-soft group-hover:translate-x-0 group-hover:translate-y-0" />
          </span>
        </span>
      </div>
    </a>
  )
}
