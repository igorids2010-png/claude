"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Hand } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { SmartImage } from "@/components/smart-image";
import { Reveal } from "@/components/reveal";
import { BeforeAfterSlider } from "@/components/before-after-slider";
import { gallery, type Transformation } from "@/data/site";
import { cn } from "@/lib/utils";

function TransformationCard({ item, index }: { item: Transformation; index: number }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <motion.button
      type="button"
      onClick={() => setRevealed((v) => !v)}
      aria-pressed={revealed}
      aria-label={`${item.title}: toque para ver o depois`}
      initial={{ opacity: 0, y: 60, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.9, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="group relative aspect-[4/5] w-full overflow-hidden rounded-[1.5rem] bg-ink-soft text-left"
    >
      <SmartImage
        src={item.image}
        alt={`${item.title} — depois`}
        fill
        sizes="(min-width:1024px) 20vw, 50vw"
        className="object-cover transition-transform duration-[1.2s] group-hover:scale-105"
      />
      {/* Camada "antes" que se recolhe no hover */}
      <div
        className={cn(
          "absolute inset-0 transition-[clip-path] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] [clip-path:inset(0_0_0_0)] group-hover:[clip-path:inset(0_0_0_100%)]",
          revealed && "[clip-path:inset(0_0_0_100%)]"
        )}
      >
        <SmartImage
          src={item.image}
          alt={`${item.title} — antes`}
          fill
          sizes="(min-width:1024px) 20vw, 50vw"
          className="filter-before object-cover"
        />
        <span className="absolute left-4 top-4 rounded-full bg-black/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md">
          Antes
        </span>
      </div>
      <span className="absolute right-4 top-4 rounded-full bg-turquoise-500 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white opacity-0 transition-opacity delay-300 duration-500 group-hover:opacity-100 data-[on=true]:opacity-100" data-on={revealed}>
        Depois
      </span>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/70 to-transparent p-4 pt-16 sm:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-turquoise-300">{item.treatment}</p>
        <p className="mt-1 font-serif text-lg leading-tight text-white sm:text-2xl">{item.title}</p>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-white/60">
          <Clock className="size-3.5" /> {item.duration}
        </p>
      </div>
    </motion.button>
  );
}

export function Gallery() {
  return (
    <section id="galeria" className="grain relative overflow-hidden bg-ink py-24 text-white sm:py-32">
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-turquoise-400/60 to-transparent" />
      <div className="pointer-events-none absolute -left-40 bottom-0 size-[36rem] rounded-full bg-turquoise-500/15 blur-[140px]" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHeading
            tone="dark"
            eyebrow={gallery.eyebrow}
            title={
              <>
                Transformações que <em className="text-turquoise-300">falam por si</em>.
              </>
            }
            description="Arraste o comparador ou passe o mouse sobre os casos para ver a diferença que um planejamento cuidadoso faz."
          />
          <Reveal delay={0.2} className="flex items-center gap-3 text-sm text-white/50">
            <Hand className="size-4 text-turquoise-300" /> Arraste para comparar
          </Reveal>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-5">
          <Reveal className="lg:col-span-3" y={60}>
            <BeforeAfterSlider image={gallery.featured.image} alt={gallery.featured.title} />
            <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-sm">
              <p className="font-serif text-xl sm:text-2xl">{gallery.featured.title}</p>
              <p className="flex shrink-0 items-center gap-2 text-white/50">
                <Clock className="size-4" /> {gallery.featured.duration}
              </p>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 gap-4 lg:col-span-2">
            {gallery.items.map((item, i) => (
              <TransformationCard key={item.title} item={item} index={i} />
            ))}
          </div>
        </div>

        <p className="mt-10 text-center text-xs text-white/40">{gallery.disclaimer}</p>
      </div>
    </section>
  );
}
