"use client"

import Image from "next/image"
import { motion, useReducedMotion } from "motion/react"

import { images } from "@/lib/images"
import { Branch } from "@/components/botanical-ornaments"
import { Reveal } from "@/components/reveal"

const values = [
  { title: "Produtores locais", text: "Flores de sítios parceiros da região." },
  { title: "Feito à mão", text: "Nenhum buquê sai igual ao outro." },
]

export function About() {
  const reduce = useReducedMotion()

  return (
    <section id="sobre" aria-labelledby="sobre-title" className="relative overflow-hidden bg-cream-200/60 py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20">
        {/* Foto com moldura dourada deslocada */}
        <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
          <motion.div
            aria-hidden="true"
            initial={reduce ? false : { opacity: 0, x: -20, y: 20 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -15% 0px" }}
            transition={{ duration: 1.2, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 translate-x-5 translate-y-5 rounded-t-[12rem] rounded-b-[2rem] border border-gold-500 sm:translate-x-7 sm:translate-y-7"
          />
          <motion.div
            initial={reduce ? false : { clipPath: "inset(100% 0% 0% 0% round 12rem 12rem 2rem 2rem)" }}
            whileInView={{ clipPath: "inset(0% 0% 0% 0% round 12rem 12rem 2rem 2rem)" }}
            viewport={{ once: true, margin: "0px 0px -15% 0px" }}
            transition={{ duration: 1.4, ease: [0.65, 0, 0.35, 1] }}
            className="relative aspect-[4/5] overflow-hidden rounded-t-[12rem] rounded-b-[2rem] bg-forest-800"
          >
            <motion.div
              initial={reduce ? false : { scale: 1.25 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true, margin: "0px 0px -15% 0px" }}
              transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <Image
                src={images.about.src}
                alt={images.about.alt}
                fill
                sizes="(min-width: 1024px) 45vw, 90vw"
                placeholder="blur"
                blurDataURL={images.about.blurDataURL}
                className="object-cover"
              />
            </motion.div>
          </motion.div>
          <Branch className="absolute -bottom-16 -left-14 h-64 text-gold-600 sm:-left-20" strokeWidth={1.2} />
          <Reveal
            delay={0.9}
            className="absolute -right-2 bottom-10 rounded-2xl border border-gold-500/40 bg-cream-50/95 px-5 py-4 shadow-xl backdrop-blur sm:-right-8"
          >
            <p className="font-serif text-3xl leading-none font-semibold text-forest-800">
              12<span className="text-gold-600">+</span>
            </p>
            <p className="mt-1 text-xs tracking-[0.18em] text-muted-foreground uppercase">anos de ateliê</p>
          </Reveal>
        </div>

        {/* Texto */}
        <div className="flex flex-col gap-6">
          <Reveal>
            <span className="text-xs font-semibold tracking-[0.28em] text-gold-700 uppercase">Nossa história</span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 id="sobre-title" className="text-[2.1rem] leading-[1.12] font-medium text-forest-800 sm:text-[2.6rem] lg:text-5xl">
              Cultivamos afeto em cada <em className="font-normal text-gold-700">pétala</em>
            </h2>
          </Reveal>
          <Reveal delay={0.2} className="flex flex-col gap-4 text-lg leading-relaxed text-muted-foreground">
            <p>
              O Jardim Aurora nasceu de uma bancada pequena, um balde de rosas e a vontade de transformar dias comuns em
              lembranças. Até hoje, cada buquê é montado à mão, no mesmo dia da entrega.
            </p>
            <p>
              Escolhemos as flores de madrugada, direto de produtores da região, e combinamos cores, texturas e perfumes
              com o cuidado de quem prepara um presente para alguém da família.
            </p>
          </Reveal>
          <Reveal delay={0.3} className="grid gap-4 border-y border-dashed border-gold-500/40 py-6 sm:grid-cols-2">
            {values.map((value) => (
              <div key={value.title}>
                <p className="font-serif text-xl text-forest-800">{value.title}</p>
                <p className="text-sm text-muted-foreground">{value.text}</p>
              </div>
            ))}
          </Reveal>
          <Reveal delay={0.4} className="flex items-center gap-5">
            <p className="font-script text-5xl leading-none text-forest-700" aria-hidden="true">
              Helena
            </p>
            <div className="border-l border-gold-500/50 pl-5">
              <p className="font-medium text-forest-800">Helena Duarte</p>
              <p className="text-sm text-muted-foreground">Fundadora & florista</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
