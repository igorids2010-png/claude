"use client"

import * as React from "react"
import Image from "next/image"
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"
import { ArrowRight, Star, Truck } from "lucide-react"

import { contact } from "@/lib/data"
import { images } from "@/lib/images"
import { whatsappLink } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { FloatingLeaves, LogoMark } from "@/components/botanical-ornaments"

const EASE = [0.22, 1, 0.36, 1] as const

type Word = { text: string; accent?: boolean }

const headline: Word[] = [
  { text: "Flores" },
  { text: "frescas" },
  { text: "para" },
  { text: "tornar" },
  { text: "qualquer", accent: true },
  { text: "dia", accent: true },
  { text: "especial" },
]

function AnimatedHeadline() {
  return (
    <h1
      id="hero-title"
      className="text-[2.5rem] leading-[1.08] font-medium tracking-tight text-cream-50 sm:text-[3.4rem] lg:text-[4.1rem] xl:text-[4.6rem]"
    >
      <span className="sr-only">Flores frescas para tornar qualquer dia especial</span>
      <span aria-hidden="true">
        {headline.map((word, i) => (
          <span key={i} className="inline-block overflow-hidden pr-[0.22em] pb-[0.12em] align-bottom">
            <motion.span
              className={word.accent ? "inline-block font-normal italic text-gold-400" : "inline-block"}
              initial={{ y: "110%", rotate: 4 }}
              animate={{ y: "0%", rotate: 0 }}
              transition={{ duration: 1, delay: 0.35 + i * 0.09, ease: EASE }}
            >
              {word.text}
            </motion.span>
          </span>
        ))}
      </span>
    </h1>
  )
}

/** Selo circular com texto girando lentamente. */
function DeliverySeal({ className }: { className?: string }) {
  const text = "Entrega no mesmo dia • Flores frescas • "
  return (
    <div className={className}>
      <div className="relative grid size-full place-items-center rounded-full bg-forest-900/55 backdrop-blur-md ring-1 ring-gold-500/40">
        <svg viewBox="0 0 200 200" className="absolute inset-0 size-full animate-spin-slow" aria-hidden="true">
          <defs>
            <path id="seal-circle" d="M100 100m-74 0a74 74 0 1 1 148 0a74 74 0 1 1-148 0" />
          </defs>
          <text className="fill-cream-100 font-sans text-[15px] font-semibold uppercase">
            <textPath href="#seal-circle" textLength={462} lengthAdjust="spacing">
              {text}
            </textPath>
          </text>
        </svg>
        <div className="grid size-[46%] place-items-center rounded-full border border-dashed border-gold-500/70 text-gold-400">
          <Truck className="size-[45%]" strokeWidth={1.3} />
        </div>
        <span className="sr-only">Entrega no mesmo dia e flores frescas</span>
      </div>
    </div>
  )
}

export function Hero() {
  const ref = React.useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "22%"])
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "35%"])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, reduce ? 1 : 0])

  return (
    <section
      id="inicio"
      ref={ref}
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[100svh] items-center overflow-hidden bg-forest-900"
    >
      {/* Foto de fundo com Ken Burns + parallax */}
      <motion.div style={{ y: imageY }} className="absolute inset-0 -z-20">
        <div className="absolute inset-0 animate-ken-burns will-change-transform">
          <Image
            src={images.hero.src}
            alt={images.hero.alt}
            fill
            priority
            sizes="100vw"
            placeholder="blur"
            blurDataURL={images.hero.blurDataURL}
            className="object-cover"
          />
        </div>
      </motion.div>

      {/* Overlay verde-escuro */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgb(15_31_24/0.92)_0%,rgb(31_58_46/0.78)_42%,rgb(31_58_46/0.35)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 -z-10 h-2/5 bg-gradient-to-t from-forest-950/70 to-transparent"
      />
      <FloatingLeaves className="-z-10" />

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="mx-auto w-full max-w-7xl px-5 pt-28 pb-32 sm:px-8 lg:pt-32"
      >
        <div className="max-w-3xl">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
            className="mb-6 inline-flex items-center gap-3 rounded-full border border-gold-500/40 bg-forest-900/40 py-1.5 pr-4 pl-1.5 text-xs font-medium tracking-[0.18em] text-gold-300 uppercase backdrop-blur-sm"
          >
            <span className="grid size-7 place-items-center rounded-full bg-gold-500 text-forest-900">
              <LogoMark className="size-5" />
            </span>
            Floricultura artesanal
          </motion.p>

          <AnimatedHeadline />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.05, ease: EASE }}
            className="mt-7 max-w-xl text-lg leading-relaxed text-cream-100/85 sm:text-xl"
          >
            Buquês montados à mão todos os dias, entregues no mesmo dia.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.2, ease: EASE }}
            className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
          >
            <Button asChild variant="gold" size="lg" className="group">
              <a href="#buques">
                Ver buquês
                <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
              </a>
            </Button>
            <Button asChild variant="outline-cream" size="lg">
              <a
                href={whatsappLink(contact.whatsapp, contact.customArrangementMessage)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Montar meu arranjo
              </a>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.5 }}
            className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-cream-100/80"
          >
            <span className="flex items-center gap-2">
              <span className="flex text-gold-400" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-current" />
                ))}
              </span>
              <span>
                <strong className="font-semibold text-cream-50">5,0</strong> de avaliação
              </span>
            </span>
            <span className="hidden h-4 w-px bg-cream-100/25 sm:block" aria-hidden="true" />
            <span>
              <strong className="font-semibold text-cream-50">+15 mil</strong> buquês entregues
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* Selo flutuante de confiança */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6, rotate: -30 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 1.2, delay: 1.3, ease: EASE }}
        className="absolute right-5 bottom-28 hidden sm:block lg:right-[8%] lg:bottom-[18%]"
      >
        <motion.div
          animate={reduce ? undefined : { y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <DeliverySeal className="size-32 lg:size-44" />
        </motion.div>
      </motion.div>

      {/* Indicador de scroll */}
      <motion.a
        href="#numeros"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-7 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 rounded-full text-[10px] font-semibold tracking-[0.3em] text-cream-100/70 uppercase transition-colors hover:text-gold-300"
        aria-label="Rolar para o conteúdo"
      >
        <span className="flex h-10 w-6 justify-center rounded-full border border-current pt-2">
          <span className="block size-1.5 animate-scroll-dot rounded-full bg-gold-400" />
        </span>
        Role
      </motion.a>
    </section>
  )
}
