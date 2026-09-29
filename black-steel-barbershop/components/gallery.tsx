import Image from "next/image"

import { gallery } from "@/lib/data"
import { cn } from "@/lib/utils"
import { Reveal } from "./reveal"
import { SectionHeading } from "./section-heading"

export function Gallery() {
  return (
    <section id="galeria" aria-labelledby="galeria-title" className="border-t border-line bg-surface py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          id="galeria-title"
          eyebrow="Galeria"
          title="Feito à mão, cadeira a cadeira"
          description="Cortes, barbas, o nosso espaço e um pouco dos bastidores."
        />

        <ul className="mt-14 grid grid-flow-row-dense auto-rows-[220px] grid-cols-2 gap-3 sm:auto-rows-[260px] sm:gap-4 lg:grid-cols-4">
          {gallery.map((item, i) => (
            <Reveal
              as="li"
              key={item.src + i}
              delay={(i % 4) * 0.08}
              className={cn(item.tall && "row-span-2", item.wide && "col-span-2")}
            >
              <figure className="group relative h-full overflow-hidden bg-surface-2">
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes={item.wide ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"}
                  className="object-cover grayscale transition-transform duration-[1200ms] ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/20 transition-colors duration-500 group-hover:bg-black/55" />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-3 border border-white/0 transition-colors duration-500 group-hover:border-white/40"
                />
                <figcaption className="absolute inset-x-0 bottom-0 flex translate-y-2 items-center gap-3 p-5 font-display text-lg uppercase tracking-[0.15em] opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:opacity-100 max-sm:translate-y-0 max-sm:text-sm max-sm:opacity-100">
                  <span aria-hidden className="h-px w-6 bg-white" />
                  {item.caption}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
