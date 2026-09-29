import { marqueeItems } from "@/lib/data"
import { cn } from "@/lib/utils"

/** Faixa branca com os serviços passando. É decorativa: os serviços estão listados na seção abaixo. */
export function Marquee() {
  const items = [...marqueeItems, ...marqueeItems]

  return (
    <div aria-hidden className="theme-light overflow-hidden border-y border-white bg-white py-4 text-black sm:py-5">
      <div className="flex w-max animate-marquee items-center hover:[animation-play-state:paused]">
        {items.map((item, i) => (
          <span key={i} className="flex items-center">
            <span
              className={cn(
                "px-6 font-display text-2xl font-bold uppercase tracking-wide whitespace-nowrap sm:px-8 sm:text-4xl",
                i % 2 === 1 && "text-transparent [-webkit-text-stroke:1.2px_#0a0a0a]",
              )}
            >
              {item}
            </span>
            <span className="size-2 rotate-45 bg-black" />
          </span>
        ))}
      </div>
    </div>
  )
}
