import { marqueeFlowers } from "@/lib/data"
import { LeafGlyph } from "@/components/botanical-ornaments"

function MarqueeRow() {
  return (
    <ul className="flex shrink-0 items-center">
      {marqueeFlowers.map((flower, i) => (
        <li key={flower} className="flex items-center">
          <span
            className={
              i % 2 === 0
                ? "px-7 font-serif text-2xl whitespace-nowrap text-cream-100 sm:text-3xl"
                : "px-7 font-serif text-2xl whitespace-nowrap text-gold-400 italic sm:text-3xl"
            }
          >
            {flower}
          </span>
          <LeafGlyph className="h-6 w-4 rotate-45 text-gold-500" />
        </li>
      ))}
    </ul>
  )
}

/** Faixa infinita com nomes de flores. Pausa ao passar o mouse. */
export function Marquee() {
  return (
    <div className="group relative overflow-hidden border-y border-gold-500/30 bg-forest-800 py-6">
      <p className="sr-only">Trabalhamos com {marqueeFlowers.join(", ")}.</p>
      <div className="mask-fade-x" aria-hidden="true">
        <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
          <MarqueeRow />
          <MarqueeRow />
        </div>
      </div>
    </div>
  )
}
