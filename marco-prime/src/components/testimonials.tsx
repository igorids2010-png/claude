"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Quote } from "lucide-react";

import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { cn } from "@/lib/utils";
import { testimonials } from "@/lib/data/testimonials";

/**
 * Grade em telas grandes; carrossel com scroll-snap (e controles) no mobile.
 * A navegação usa scroll nativo, então continua funcional por gesto e teclado.
 */
export function Testimonials() {
  const trackRef = React.useRef<HTMLUListElement>(null);
  const [active, setActive] = React.useState(0);

  function scrollTo(index: number) {
    const track = trackRef.current;
    const card = track?.children[index] as HTMLElement | undefined;
    if (!track || !card) return;
    track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: "smooth" });
  }

  function handleScroll() {
    const track = trackRef.current;
    if (!track) return;
    const index = Math.round(track.scrollLeft / (track.clientWidth * 0.86));
    setActive(Math.min(Math.max(index, 0), testimonials.length - 1));
  }

  return (
    <section
      aria-labelledby="depoimentos-title"
      className="border-y border-border bg-[#0c0c0c]"
    >
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            titleId="depoimentos-title"
            eyebrow="Depoimentos"
            title="O que dizem nossos clientes corporativos"
          />

          <Reveal delay={120} className="flex gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => scrollTo(Math.max(active - 1, 0))}
              disabled={active === 0}
              aria-label="Depoimento anterior"
              className="flex size-11 items-center justify-center border border-border text-gold transition-colors hover:border-gold disabled:opacity-40"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                scrollTo(Math.min(active + 1, testimonials.length - 1))
              }
              disabled={active === testimonials.length - 1}
              aria-label="Próximo depoimento"
              className="flex size-11 items-center justify-center border border-border text-gold transition-colors hover:border-gold disabled:opacity-40"
            >
              <ArrowRight aria-hidden="true" className="size-4" />
            </button>
          </Reveal>
        </div>

        <div className="hairline mt-12" />

        <ul
          ref={trackRef}
          onScroll={handleScroll}
          className={cn(
            "mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            "lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0",
          )}
        >
          {testimonials.map((testimonial, index) => (
            <Reveal
              as="li"
              key={testimonial.id}
              delay={index * 110}
              className="w-[86%] shrink-0 snap-start sm:w-[58%] lg:w-auto"
            >
              <figure className="flex h-full flex-col border border-border/80 bg-card p-8">
                <Quote
                  aria-hidden="true"
                  className="size-7 text-gold/60"
                  strokeWidth={1}
                />
                <blockquote className="mt-6 flex-1 text-pretty font-serif text-lg leading-relaxed text-foreground/90">
                  “{testimonial.quote}”
                </blockquote>
                <figcaption className="mt-8 flex items-center gap-4 border-t border-border pt-6">
                  <span
                    aria-hidden="true"
                    className="flex size-11 shrink-0 items-center justify-center border border-gold/40 font-serif text-sm text-gold"
                  >
                    {testimonial.initials}
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm text-foreground">
                      {testimonial.name}
                    </span>
                    <span className="mt-1 text-xs text-muted-foreground">
                      {testimonial.role} — {testimonial.company}
                    </span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>

        <div className="mt-2 flex justify-center gap-2 lg:hidden">
          {testimonials.map((testimonial, index) => (
            <button
              key={testimonial.id}
              type="button"
              onClick={() => scrollTo(index)}
              aria-label={`Ir para o depoimento de ${testimonial.name}`}
              aria-current={index === active}
              className="flex h-11 w-10 items-center justify-center"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "h-px w-full transition-colors",
                  index === active ? "bg-gold" : "bg-border",
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
