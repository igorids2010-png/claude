"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { SmartImage } from "@/components/smart-image";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { iconMap } from "@/components/icons";
import { treatments, type Treatment } from "@/data/site";
import { cn } from "@/lib/utils";

function TreatmentCard({ t, index }: { t: Treatment; index: number }) {
  const Icon = iconMap[t.icon];
  return (
    <motion.article
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 1, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      className={cn("group relative", index % 2 === 1 && "lg:mt-16")}
    >
      <a
        href="#contato"
        className="relative block aspect-[3/4] overflow-hidden rounded-[1.75rem] bg-ink shadow-[0_30px_60px_-30px_rgba(10,15,17,0.5)] transition-shadow duration-500 hover:shadow-[0_40px_80px_-30px_rgba(22,169,155,0.55)]"
      >
        <SmartImage
          src={t.image}
          alt={t.title}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent transition-opacity duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-turquoise-800/80 via-turquoise-700/20 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />

        <div className="absolute left-5 right-5 top-5 flex items-start justify-between">
          <span className="grid size-12 place-items-center rounded-2xl border border-white/20 bg-white/10 text-white backdrop-blur-md transition-all duration-500 group-hover:rotate-[-8deg] group-hover:bg-turquoise-500">
            <Icon className="size-5" />
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-md">
            {t.tag}
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-6 text-white">
          <span className="font-sans text-xs text-turquoise-300">0{index + 1}</span>
          <h3 className="mt-1 text-3xl font-medium leading-tight">{t.title}</h3>
          <div className="grid grid-rows-[0fr] transition-all duration-500 ease-out group-hover:grid-rows-[1fr] max-lg:grid-rows-[1fr]">
            <p className="overflow-hidden text-sm leading-relaxed text-white/75">
              <span className="block pt-3">{t.description}</span>
            </p>
          </div>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">
            Saiba mais
            <span className="grid size-8 place-items-center rounded-full bg-white text-ink transition-all duration-500 group-hover:rotate-45 group-hover:bg-turquoise-400">
              <ArrowUpRight className="size-4" />
            </span>
          </span>
        </div>
      </a>
    </motion.article>
  );
}

export function Treatments() {
  return (
    <section id="tratamentos" className="relative overflow-hidden py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHeading
            eyebrow="Tratamentos em destaque"
            title={
              <>
                Excelência em cada <em className="text-turquoise-600">detalhe</em> do seu sorriso.
              </>
            }
            description="Da prevenção à reabilitação completa, oferecemos tratamentos personalizados com tecnologia de ponta e resultados naturais."
          />
          <Reveal delay={0.2}>
            <Button asChild variant="outline" size="lg" className="text-ink">
              <a href="#contato">
                Ver todos os tratamentos <ArrowUpRight />
              </a>
            </Button>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {treatments.map((t, i) => (
            <TreatmentCard key={t.slug} t={t} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
