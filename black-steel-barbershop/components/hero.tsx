"use client"

import { useRef, type PointerEvent } from "react"
import Image from "next/image"
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion"
import { ArrowRight, Clock, MapPin, Star } from "lucide-react"

import { images, site, whatsappUrl } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Shutter } from "./shutter"

const headline = ["Estilo é atitude.", "Cuidado é essencial."]
const ease = [0.22, 1, 0.36, 1] as const

// Momento em que a porta de aço já subiu o suficiente para o texto aparecer.
const DOOR_OPEN = 1.15

const rise: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: (delay: number) => ({ opacity: 1, y: 0, transition: { duration: 0.9, ease, delay } }),
}

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const base = reduce ? 0 : DOOR_OPEN

  // Parallax ao rolar
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "20%"])
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "35%"])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  // Luz que acompanha o mouse, como um spot do trilho de iluminação
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const glow = useMotionValue(0)
  const x = useSpring(pointerX, { stiffness: 140, damping: 22 })
  const y = useSpring(pointerY, { stiffness: 140, damping: 22 })
  const glowOpacity = useSpring(glow, { stiffness: 80, damping: 20 })
  const spotlight = useMotionTemplate`radial-gradient(520px circle at ${x}px ${y}px, rgba(255,255,255,0.22), transparent 65%)`

  function handlePointerMove(e: PointerEvent<HTMLElement>) {
    if (e.pointerType !== "mouse" || reduce || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    pointerX.set(e.clientX - rect.left)
    pointerY.set(e.clientY - rect.top)
    glow.set(1)
  }

  return (
    <section
      ref={ref}
      id="inicio"
      aria-labelledby="hero-title"
      onPointerMove={handlePointerMove}
      onPointerLeave={() => glow.set(0)}
      className="relative isolate flex min-h-svh flex-col overflow-hidden bg-background"
    >
      {/* Foto do salão: zoom de entrada, zoom lento contínuo e parallax */}
      <motion.div aria-hidden style={{ y: imageY }} className="absolute inset-0 bg-surface-2">
        <motion.div
          className="absolute inset-0"
          initial={{ scale: reduce ? 1 : 1.18 }}
          animate={{ scale: 1 }}
          transition={{ duration: 3, ease, delay: 0.35 }}
        >
          <div className="grain absolute inset-0 animate-ken-burns">
            <Image
              src={images.hero.src}
              alt=""
              fill
              priority
              sizes="100vw"
              style={{ objectPosition: images.hero.position }}
              className="object-cover grayscale contrast-[1.15] brightness-[0.85]"
            />
          </div>
        </motion.div>

        {/* Escurece o lado do texto e funde a base da foto com a página */}
        <div className="absolute inset-0 bg-black/25" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/5" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/50" />
        <div className="absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.6)_100%)]" />
      </motion.div>

      <motion.div
        aria-hidden
        style={{ background: spotlight, opacity: glowOpacity }}
        className="pointer-events-none absolute inset-0 z-[2] mix-blend-overlay"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-[3] w-1/4 animate-light-sweep bg-gradient-to-r from-transparent via-white/20 to-transparent mix-blend-overlay motion-reduce:hidden"
      />

      <Shutter />

      {/* Conteúdo */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-end px-5 pt-28 pb-28 sm:px-8 sm:pt-32 sm:pb-16 lg:justify-center lg:pb-10"
      >
        <div>
          <motion.p
            variants={rise}
            custom={base}
            initial="hidden"
            animate="show"
            className="inline-flex items-center gap-3 border border-white/25 bg-black/30 px-4 py-2 text-[0.65rem] font-medium uppercase tracking-[0.3em] text-neutral-200 backdrop-blur-sm sm:text-xs"
          >
            <span aria-hidden className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-white/70" />
              <span className="relative inline-flex size-2 rounded-full bg-white" />
            </span>
            Barbearia clássica · Desde 2017
          </motion.p>

          <h1
            id="hero-title"
            className="mt-7 font-display text-[3.5rem] font-bold uppercase leading-[0.9] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl xl:text-[6.75rem] 2xl:text-[7.5rem]"
          >
            {headline.map((line, i) => (
              <span key={line} className="-mt-[0.04em] block overflow-hidden pt-[0.14em] pb-[0.04em] first:mt-0">
                <motion.span
                  className={i === 1 ? "block text-transparent [-webkit-text-stroke:1.5px_#fafafa]" : "block"}
                  initial={reduce ? { opacity: 0 } : { y: "105%" }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 1.1, ease, delay: base + 0.1 + i * 0.15 }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.span
            aria-hidden
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, ease, delay: base + 0.45 }}
            className="mt-8 block h-px w-32 origin-left bg-white/60"
          />

          <motion.p
            variants={rise}
            custom={base + 0.5}
            initial="hidden"
            animate="show"
            className="mt-8 max-w-xl text-base leading-relaxed text-neutral-200 sm:text-lg"
          >
            Cadeiras de couro, navalha afiada e toalha quente. Uma barbearia clássica com atitude moderna, feita para o
            homem que valoriza cada detalhe.
          </motion.p>

          <motion.div
            variants={rise}
            custom={base + 0.65}
            initial="hidden"
            animate="show"
            className="mt-10 flex flex-col gap-4 sm:flex-row"
          >
            <Button asChild size="lg">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                Agendar horário
                <ArrowRight />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-black/20 backdrop-blur-sm">
              <a href="#servicos">Ver serviços</a>
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Barra de informações + indicador de scroll */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease, delay: base + 0.9 }}
        className="relative z-10 hidden border-t border-white/15 bg-black/40 backdrop-blur-md md:block"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-8 py-5">
          <ul className="flex items-center text-xs uppercase tracking-[0.22em] text-neutral-300">
            <li className="flex items-center gap-3 pr-8">
              <Clock aria-hidden className="size-4 text-white" />
              Ter–Sex 09h–20h · Sáb 08h–18h
            </li>
            <li className="flex items-center gap-3 border-l border-white/15 px-8">
              <MapPin aria-hidden className="size-4 text-white" />
              {site.address.street} · SP
            </li>
            <li className="hidden items-center gap-3 border-l border-white/15 pl-8 xl:flex">
              <Star aria-hidden className="size-4 fill-white text-white" />
              5,0 · avaliação dos clientes
            </li>
          </ul>

          <a
            href="#numeros"
            aria-label="Rolar para a próxima seção"
            className="flex items-center gap-3 text-[0.65rem] uppercase tracking-[0.4em] text-neutral-400 transition-colors hover:text-white"
          >
            Role
            <span className="flex h-9 w-5 justify-center rounded-full border border-white/40 pt-1.5">
              <span className="block size-1 animate-scroll-dot rounded-full bg-white" />
            </span>
          </a>
        </div>
      </motion.div>
    </section>
  )
}
