import Image from "next/image"

import { images } from "@/lib/data"
import { Reveal } from "./reveal"
import { SectionHeading } from "./section-heading"

const values = [
  { title: "Tradition", text: "Classic barbering techniques passed down by hand." },
  { title: "Precision", text: "Every line, every fade, done with absolute attention." },
  { title: "Respect", text: "For your time, your style and your trust." },
]

export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="border-t border-line bg-surface py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20">
        <Reveal direction="right" className="relative isolate">
          <div className="grain relative aspect-[4/5] overflow-hidden bg-surface-2">
            <Image
              src={images.about}
              alt="Black Steel shop floor with a brick wall and a row of black leather chairs"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover grayscale contrast-110"
            />
          </div>
          <div
            aria-hidden
            className="absolute -right-3 -bottom-3 -z-10 hidden h-full w-full border border-line-strong sm:block lg:-right-6 lg:-bottom-6"
          />
          <div className="absolute -bottom-6 left-6 bg-white px-6 py-5 text-black sm:left-auto sm:-right-6 lg:-right-10">
            <p className="font-display text-4xl font-bold leading-none">2017</p>
            <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em]">Since</p>
          </div>
        </Reveal>

        <div>
          <SectionHeading id="about-title" eyebrow="Our story" title="Steel, leather and tradition" />
          <Reveal delay={0.1} className="mt-8 space-y-5 text-base leading-relaxed text-muted sm:text-lg">
            <p>
              Black Steel was born in 2017 to bring back the ritual of the classic barbershop: the unhurried conversation,
              the hot towel, the sound of the razor. All of it in an industrial-style space, with the comfort and
              precision the modern man expects.
            </p>
            <p>
              Today we are a team of barbers who love the craft and treat every client as one of a kind. Here, the
              haircut is only the beginning of the experience.
            </p>
          </Reveal>

          <ul className="mt-10 grid gap-6 border-t border-line pt-10 sm:grid-cols-3">
            {values.map((value, i) => (
              <Reveal as="li" key={value.title} delay={0.15 + i * 0.1}>
                <h3 className="font-display text-lg font-bold uppercase tracking-wide">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{value.text}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
