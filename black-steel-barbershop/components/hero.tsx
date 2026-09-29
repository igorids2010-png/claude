"use client"

import { useRef } from "react"
import Image from "next/image"
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion"
import { ArrowRight } from "lucide-react"

import { images, whatsappUrl } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { staggerChild, staggerParent } from "./reveal"

const headline = ["Estilo é atitude.", "Cuidado é essencial."]

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "18%"])
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "30%"])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <section
      ref={ref}
      id="inicio"
      aria-labelledby="hero-title"
      className="relative flex min-h-svh items-end overflow-hidden pb-24 sm:items-center sm:pb-0"
    >
      {/* Imagem de fundo com zoom lento de entrada + parallax no scroll */}
      <motion.div aria-hidden style={{ y: imageY }} className="absolute inset-0 -z-10 bg-surface-2">
        <motion.div
          className="grain absolute inset-0"
          initial={{ scale: reduce ? 1 : 1.18 }}
          animate={{ scale: 1.04 }}
          transition={{ duration: 2.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            src={images.hero}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover grayscale contrast-125"
          />
        </motion.div>
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-background/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
      </motion.div>

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="mx-auto w-full max-w-7xl px-5 pt-32 sm:px-8"
      >
        <motion.div variants={staggerParent} initial="hidden" animate="show" className="max-w-4xl">
          <motion.p
            variants={staggerChild}
            className="flex items-center gap-4 text-[0.65rem] font-medium uppercase tracking-[0.3em] text-neutral-300 sm:text-xs sm:tracking-[0.4em]"
          >
            <span aria-hidden className="h-px w-12 bg-white/50" />
            Barbearia clássica · Desde 2017
          </motion.p>

          <h1
            id="hero-title"
            className="mt-6 font-display text-[3.4rem] font-bold uppercase leading-[0.9] tracking-tight sm:text-7xl lg:text-8xl xl:text-[7.5rem]"
          >
            {headline.map((line, i) => (
              <span key={line} className="-mt-[0.12em] block overflow-hidden pt-[0.14em] pb-[0.04em] first:mt-0">
                <motion.span
                  className={i === 1 ? "block text-transparent [-webkit-text-stroke:1.5px_#fafafa]" : "block"}
                  variants={{
                    hidden: { y: reduce ? 0 : "105%", opacity: reduce ? 0 : 1 },
                    show: {
                      y: 0,
                      opacity: 1,
                      transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.15 + i * 0.15 },
                    },
                  }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p variants={staggerChild} className="mt-8 max-w-xl text-base leading-relaxed text-neutral-300 sm:text-lg">
            Uma experiência exclusiva de barbearia: navalha, toalha quente e atendimento sem pressa, num espaço pensado
            para o homem que valoriza cada detalhe.
          </motion.p>

          <motion.div variants={staggerChild} className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                Agendar horário
                <ArrowRight />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#servicos">Ver serviços</a>
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Indicador de scroll */}
      <motion.a
        href="#numeros"
        aria-label="Rolar para a próxima seção"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 text-[0.65rem] uppercase tracking-[0.4em] text-neutral-400 transition-colors hover:text-white sm:flex"
      >
        Role
        <span className="flex h-10 w-6 justify-center rounded-full border border-white/40 pt-2">
          <span className="block size-1 animate-scroll-dot rounded-full bg-white" />
        </span>
      </motion.a>

      {/* Detalhe lateral */}
      <div
        aria-hidden
        className="absolute right-8 bottom-10 hidden items-center gap-4 text-[0.65rem] uppercase tracking-[0.4em] text-neutral-500 [writing-mode:vertical-rl] lg:flex"
      >
        <span className="h-16 w-px bg-white/30" />
        São Paulo · SP
      </div>
    </section>
  )
}
