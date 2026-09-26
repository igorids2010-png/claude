"use client";

import { useRef, type MouseEvent } from "react";
import { motion } from "framer-motion";
import { SectionHeading } from "@/components/section-heading";
import { iconMap } from "@/components/icons";
import { differentials, type Differential } from "@/data/site";

function DifferentialCard({ d, index }: { d: Differential; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const Icon = iconMap[d.icon];

  // Efeito "spotlight" que segue o cursor
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--y", `${e.clientY - rect.top}px`);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.9, delay: (index % 3) * 0.12, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-[1.75rem] border border-black/5 bg-white p-8 transition-all duration-500 hover:-translate-y-1 hover:border-turquoise-200 hover:shadow-[0_30px_60px_-30px_rgba(22,169,155,0.45)] sm:p-10"
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 [background:radial-gradient(400px_circle_at_var(--x)_var(--y),rgba(22,169,155,0.10),transparent_60%)]" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="relative grid size-14 place-items-center rounded-2xl bg-turquoise-50 text-turquoise-600 transition-all duration-500 group-hover:bg-turquoise-500 group-hover:text-white group-hover:shadow-[0_10px_30px_-8px_rgba(22,169,155,0.8)]">
            <Icon className="size-6 transition-transform duration-500 group-hover:scale-110" />
          </span>
          <span className="font-serif text-5xl text-black/[0.06] transition-colors duration-500 group-hover:text-turquoise-500/20">
            0{index + 1}
          </span>
        </div>
        <h3 className="mt-8 text-2xl font-medium text-ink sm:text-[1.7rem]">{d.title}</h3>
        <p className="mt-3 leading-relaxed text-muted-foreground">{d.description}</p>
      </div>
    </motion.div>
  );
}

export function Differentials() {
  return (
    <section id="diferenciais" className="relative overflow-hidden bg-mist py-24 sm:py-32">
      <div className="pointer-events-none absolute -right-40 top-20 size-[30rem] rounded-full bg-turquoise-200/40 blur-[120px]" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          align="center"
          eyebrow="Por que nos escolher"
          title={
            <>
              Um novo padrão de <em className="text-turquoise-600">cuidado</em> odontológico.
            </>
          }
          description="Cada detalhe da nossa clínica foi pensado para oferecer segurança, conforto e resultados que superam expectativas."
        />
        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {differentials.map((d, i) => (
            <DifferentialCard key={d.title} d={d} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
