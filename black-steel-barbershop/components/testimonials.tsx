import { Quote, Star } from "lucide-react"

import { testimonials } from "@/lib/data"
import { Reveal } from "./reveal"
import { SectionHeading } from "./section-heading"

export function Testimonials() {
  return (
    <section aria-labelledby="testimonials-title" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          id="testimonials-title"
          eyebrow="Testimonials"
          title="Sit once, come back"
          align="center"
        />

        <ul className="mt-16 grid gap-5 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal as="li" key={t.name} delay={i * 0.12}>
              <figure className="group flex h-full flex-col border border-line bg-surface p-8 transition-colors duration-500 hover:border-white/60">
                <div className="flex items-center justify-between">
                  <p className="flex gap-1" aria-label={`${t.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star
                        key={s}
                        aria-hidden
                        className={s < t.rating ? "size-4 fill-white text-white" : "size-4 text-neutral-600"}
                      />
                    ))}
                  </p>
                  <Quote aria-hidden className="size-8 text-neutral-700 transition-colors duration-500 group-hover:text-white" />
                </div>
                <blockquote className="mt-6 flex-1 text-base leading-relaxed text-neutral-200">
                  <p>&ldquo;{t.text}&rdquo;</p>
                </blockquote>
                <figcaption className="mt-8 flex items-center gap-4 border-t border-line pt-6">
                  <span
                    aria-hidden
                    className="grid size-11 place-items-center border border-line-strong font-display text-sm font-bold"
                  >
                    {t.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                  <span>
                    <span className="block font-display text-base font-bold uppercase tracking-wide">{t.name}</span>
                    <span className="block text-xs uppercase tracking-[0.2em] text-subtle">{t.role}</span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
