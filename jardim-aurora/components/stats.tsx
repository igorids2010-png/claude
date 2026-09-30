import { stats } from "@/lib/data"
import { RevealGroup, RevealItem } from "@/components/reveal"
import { AnimatedCounter } from "@/components/animated-counter"

export function Stats() {
  return (
    <section id="numeros" aria-label="Jardim Aurora em números" className="bg-paper relative py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <RevealGroup className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {stats.map((stat) => {
            const full = `${stat.prefix ?? ""}${stat.value.toLocaleString("pt-BR", {
              minimumFractionDigits: stat.decimals ?? 0,
            })}${stat.suffix ?? ""} ${stat.label}`
            return (
              <RevealItem
                key={stat.label}
                className="group relative flex flex-col items-center gap-2 overflow-hidden rounded-3xl border border-gold-500/25 bg-cream-50/70 px-4 py-9 text-center transition-all duration-500 hover:-translate-y-1 hover:border-gold-500/60 hover:shadow-[0_24px_50px_-30px_rgb(31_58_46/0.5)] sm:py-11"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-gold-500 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />
                <p className="sr-only">{full}</p>
                <p aria-hidden="true" className="font-serif text-4xl leading-none font-medium text-forest-800 sm:text-5xl">
                  {stat.prefix ? <span className="text-gold-600">{stat.prefix}</span> : null}
                  <AnimatedCounter value={stat.value} decimals={stat.decimals} />
                  {stat.suffix ? (
                    <span className={stat.suffix === "★" ? "ml-1 text-[0.6em] text-gold-500" : "text-gold-600"}>
                      {stat.suffix}
                    </span>
                  ) : null}
                </p>
                <p aria-hidden="true" className="max-w-[12rem] text-sm leading-snug text-muted-foreground sm:text-[15px]">
                  {stat.label}
                </p>
              </RevealItem>
            )
          })}
        </RevealGroup>
      </div>
    </section>
  )
}
