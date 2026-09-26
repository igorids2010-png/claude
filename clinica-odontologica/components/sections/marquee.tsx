import { Sparkles } from "lucide-react";

const words = ["Implantes", "Clareamento", "Lentes de contato", "Ortodontia invisível", "Harmonização", "Design do sorriso"];

/** Faixa em movimento infinito com os tratamentos. */
export function Marquee() {
  const row = [...words, ...words];
  return (
    <div aria-hidden className="relative overflow-hidden border-y border-black/5 bg-white py-8">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white to-transparent" />
      <div className="flex w-max animate-marquee items-center hover:[animation-play-state:paused]">
        {[...row, ...row].map((w, i) => (
          <span key={i} className="flex items-center">
            <span
              className={
                i % 2 === 0
                  ? "px-8 font-serif text-5xl italic text-ink sm:text-7xl"
                  : "text-outline px-8 font-serif text-5xl text-turquoise-600 sm:text-7xl"
              }
            >
              {w}
            </span>
            <Sparkles className="size-6 text-turquoise-500" />
          </span>
        ))}
      </div>
    </div>
  );
}
