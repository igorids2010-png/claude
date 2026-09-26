"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { ArrowDown, ArrowRight, Play, ShieldCheck, Sparkles } from "lucide-react";
import { SmartImage } from "@/components/smart-image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Stars } from "@/components/stars";
import { hero } from "@/data/site";

const ease = [0.22, 1, 0.36, 1] as const;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.5 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 1, ease } },
};
const word: Variants = {
  hidden: { y: "110%" },
  show: { y: "0%", transition: { duration: 1.1, ease } },
};

function SplitLine({ text, className }: { text: string; className?: string }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.12em] align-bottom">
          <motion.span variants={word} className={`inline-block ${className ?? ""}`}>
            {w}&nbsp;
          </motion.span>
        </span>
      ))}
    </>
  );
}

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      id="inicio"
      ref={ref}
      className="grain relative isolate flex min-h-[100svh] items-center overflow-hidden bg-ink text-white"
    >
      {/* Imagem de fundo com parallax + zoom lento */}
      <motion.div style={{ y: imageY }} className="absolute inset-0 -z-20">
        <motion.div
          initial={{ scale: 1.25 }}
          animate={{ scale: 1.05 }}
          transition={{ duration: 2.8, ease }}
          className="absolute inset-0"
        >
          <SmartImage
            src={hero.image}
            alt="Consultório odontológico premium, moderno e bem iluminado"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </motion.div>
      </motion.div>

      {/* Camadas de gradiente para contraste e atmosfera */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/80 to-ink/20" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-transparent to-ink/60" />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 0.6 }}
        className="pointer-events-none absolute -left-40 top-1/4 -z-10 size-[36rem] rounded-full bg-turquoise-500/25 blur-[120px]"
      />

      {/* Linhas de grade decorativas */}
      <div className="pointer-events-none absolute inset-0 -z-10 hidden lg:block">
        <div className="mx-auto grid h-full max-w-7xl grid-cols-4 px-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border-l border-white/[0.05] last:border-r" />
          ))}
        </div>
      </div>

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="mx-auto w-full max-w-7xl px-5 pb-32 pt-36 sm:px-8 lg:pb-40"
      >
        <motion.div variants={container} initial="hidden" animate="show" className="max-w-3xl">
          <motion.div variants={item}>
            <Badge variant="glass">
              <Sparkles className="size-3.5 text-turquoise-300" />
              {hero.eyebrow}
            </Badge>
          </motion.div>

          <h1 className="mt-8 text-[2.7rem] font-normal leading-[1.02] tracking-tight sm:text-7xl lg:text-[5.5rem]">
            <SplitLine text={hero.titleStart} />
            <span className="inline-block whitespace-nowrap">
              <span className="relative inline-block overflow-hidden pb-[0.12em] align-bottom">
                <motion.span variants={word} className="inline-block italic text-turquoise-300">
                  {hero.titleHighlight}
                </motion.span>
                <motion.svg
                  viewBox="0 0 300 20"
                  className="absolute -bottom-1 left-0 h-3 w-full text-turquoise-400"
                  aria-hidden
                >
                  <motion.path
                    d="M2 14 C 80 4, 200 2, 298 10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2, delay: 1.6, ease }}
                  />
                </motion.svg>
              </span>
              <span className="inline-block overflow-hidden pb-[0.12em] align-bottom">
                <motion.span variants={word} className="inline-block">
                  ,&nbsp;
                </motion.span>
              </span>
            </span>
            <SplitLine text={hero.titleEnd} className="text-white/90" />
          </h1>

          <motion.p variants={item} className="mt-8 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
            {hero.subtitle}
          </motion.p>

          <motion.div variants={item} className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Button asChild size="lg">
              <a href={hero.primaryCta.href}>
                <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-shine bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                {hero.primaryCta.label}
                <ArrowRight className="transition-transform duration-300 group-hover/btn:translate-x-1" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline-light">
              <a href={hero.secondaryCta.href}>
                <span className="grid size-7 place-items-center rounded-full bg-white text-ink">
                  <Play className="!size-3 fill-current" />
                </span>
                {hero.secondaryCta.label}
              </a>
            </Button>
          </motion.div>

          <motion.div variants={item} className="mt-12 flex items-center gap-6 text-sm text-white/60">
            <span className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-turquoise-300" /> Biossegurança certificada
            </span>
            <span className="hidden h-4 w-px bg-white/20 sm:block" />
            <span className="hidden sm:inline">Planejamento digital 3D</span>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Selo de confiança flutuante */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, delay: 1.4, ease }}
        className="absolute bottom-28 right-5 hidden sm:right-8 md:block lg:bottom-auto lg:right-[max(2rem,calc((100vw-80rem)/2+2rem))] lg:top-[58%]"
      >
        <div className="animate-float rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {hero.avatars.map((src, i) => (
                <div key={i} className="relative size-11 overflow-hidden rounded-full ring-2 ring-ink/60">
                  <SmartImage src={src} alt="" fill sizes="44px" className="object-cover" />
                </div>
              ))}
              <div className="relative grid size-11 place-items-center rounded-full bg-turquoise-500 text-xs font-bold ring-2 ring-ink/60">
                +
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Stars rating={5} className="text-white" />
                <span className="text-sm font-semibold">{hero.rating}</span>
              </div>
              <p className="mt-1 text-sm text-white/70">
                <strong className="font-semibold text-white">{hero.patients}</strong> pacientes felizes
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, delay: 1.7, ease }}
        className="absolute right-[max(2rem,calc((100vw-80rem)/2+2rem))] top-[34%] hidden xl:block"
      >
        <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-ink/40 px-4 py-3 backdrop-blur-xl [animation-delay:1.5s] animate-float">
          <span className="grid size-10 place-items-center rounded-xl bg-turquoise-500/20 text-turquoise-300">
            <Sparkles className="size-5" />
          </span>
          <div className="text-sm">
            <p className="font-semibold">Simulação 3D do sorriso</p>
            <p className="text-white/60">Veja o resultado antes de começar</p>
          </div>
        </div>
      </motion.div>

      {/* Indicador de scroll */}
      <motion.a
        href="#tratamentos"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2 }}
        className="absolute bottom-28 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-white/50 lg:flex"
        aria-label="Rolar para baixo"
      >
        Role
        <span className="grid h-12 w-7 justify-center rounded-full border border-white/25 pt-2">
          <motion.span
            animate={{ y: [0, 14, 0], opacity: [1, 0.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ArrowDown className="size-3" />
          </motion.span>
        </span>
      </motion.a>
    </section>
  );
}
