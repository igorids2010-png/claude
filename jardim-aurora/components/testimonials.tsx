import { Star } from "lucide-react"

import { testimonials } from "@/lib/data"
import { RevealGroup, RevealItem } from "@/components/reveal"
import { SectionHeading } from "@/components/section-heading"

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
}

export function Testimonials() {
  return (
    <section id="depoimentos" aria-labelledby="depoimentos-title" className="bg-paper relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          id="depoimentos-title"
          eyebrow="Depoimentos"
          title={
            <>
              Quem recebe, <em className="font-normal text-gold-700">lembra</em>
            </>
          }
          description="Algumas palavras de quem já presenteou (e foi presenteado) com o Jardim Aurora."
        />

        <RevealGroup stagger={0.15} className="mt-16 grid gap-6 md:grid-cols-3 lg:gap-8">
          {testimonials.map((t, i) => (
            <RevealItem key={t.name} className={i === 1 ? "md:translate-y-8" : undefined}>
              <figure className="group relative flex h-full flex-col gap-6 rounded-[1.75rem] border border-gold-500/25 bg-cream-50 p-8 transition-all duration-500 hover:-translate-y-1 hover:border-gold-500/60 hover:shadow-[0_30px_60px_-35px_rgb(31_58_46/0.5)] sm:p-9">
                <span
                  aria-hidden="true"
                  className="absolute -top-2 right-7 font-serif text-[7rem] leading-none text-gold-500/35 transition-colors duration-500 group-hover:text-gold-500/60"
                >
                  &ldquo;
                </span>
                <div className="flex gap-1 text-gold-500" role="img" aria-label={`Avaliação: ${t.rating} de 5 estrelas`}>
                  {Array.from({ length: 5 }).map((_, star) => (
                    <Star key={star} className={star < t.rating ? "size-4 fill-current" : "size-4"} aria-hidden="true" />
                  ))}
                </div>
                <blockquote className="font-serif text-[1.15rem] leading-relaxed text-forest-800 italic">
                  <p>&ldquo;{t.text}&rdquo;</p>
                </blockquote>
                <figcaption className="mt-auto flex items-center gap-4 border-t border-dashed border-gold-500/35 pt-6">
                  <span
                    aria-hidden="true"
                    className="grid size-12 place-items-center rounded-full bg-forest-800 font-serif text-lg text-gold-400"
                  >
                    {initials(t.name)}
                  </span>
                  <span>
                    <span className="block font-medium text-forest-800">{t.name}</span>
                    <span className="block text-sm text-muted-foreground">{t.occasion}</span>
                  </span>
                </figcaption>
              </figure>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
