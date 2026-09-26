"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { SmartImage } from "@/components/smart-image";
import { Reveal, Stagger, StaggerItem } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { about } from "@/data/site";

export function About() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y1 = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const y2 = useTransform(scrollYProgress, [0, 1], [120, -120]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 90]);

  return (
    <section id="sobre" ref={ref} className="relative overflow-hidden py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 sm:px-8 lg:grid-cols-2 lg:gap-24">
        {/* Composição de imagens */}
        <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
          <motion.div
            style={{ y: y1 }}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="relative aspect-[4/5] w-[85%] overflow-hidden rounded-[2rem] shadow-[0_40px_80px_-40px_rgba(10,15,17,0.5)]"
          >
            <motion.div
              variants={{ hidden: { clipPath: "inset(100% 0 0 0)" }, show: { clipPath: "inset(0% 0 0 0)" } }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <SmartImage src={about.image} alt="Equipe da clínica em atendimento" fill sizes="(min-width:1024px) 40vw, 90vw" className="object-cover" />
            </motion.div>
          </motion.div>

          <motion.div
            style={{ y: y2 }}
            className="absolute -bottom-10 right-0 aspect-square w-[48%] overflow-hidden rounded-[1.75rem] border-[6px] border-white shadow-2xl"
          >
            <SmartImage src={about.secondaryImage} alt="Detalhe do consultório" fill sizes="30vw" className="object-cover" />
          </motion.div>

          {/* Selo giratório */}
          <motion.div
            style={{ rotate }}
            className="absolute -top-6 right-[8%] grid size-32 place-items-center rounded-full bg-ink text-white shadow-xl sm:size-36"
          >
            <svg viewBox="0 0 100 100" className="absolute inset-0 size-full p-2" aria-hidden>
              <defs>
                <path id="circle" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
              </defs>
              <text className="fill-white/80 text-[7.5px] font-semibold uppercase">
                <textPath href="#circle" textLength="236" lengthAdjust="spacing">
                  Excelência • Cuidado • Tecnologia •
                </textPath>
              </text>
            </svg>
          </motion.div>
          <div className="pointer-events-none absolute -top-6 right-[8%] grid size-32 place-items-center sm:size-36">
            <span className="font-serif text-3xl font-medium text-turquoise-300">15+</span>
          </div>

          <div className="absolute -left-4 bottom-16 hidden rounded-2xl border border-black/5 bg-white/90 p-4 shadow-xl backdrop-blur-md sm:block">
            <p className="font-serif text-3xl font-medium text-ink">
              +20<span className="text-turquoise-500">.</span>
            </p>
            <p className="text-xs font-medium text-muted-foreground">Especialistas no corpo clínico</p>
          </div>
        </div>

        <div>
          <SectionHeading eyebrow={about.eyebrow} title={about.title} description={about.text} />
          <Stagger className="mt-10 space-y-4" delay={0.2}>
            {about.highlights.map((h) => (
              <StaggerItem key={h} className="flex items-center gap-4 border-b border-black/5 pb-4">
                <span className="grid size-9 place-items-center rounded-full bg-turquoise-50 text-turquoise-600">
                  <BadgeCheck className="size-5" />
                </span>
                <span className="text-base font-medium text-ink">{h}</span>
              </StaggerItem>
            ))}
          </Stagger>
          <Reveal delay={0.3} className="mt-10 flex flex-wrap items-center gap-6">
            <Button asChild size="lg" variant="dark">
              <a href="#contato">
                Conheça a clínica <ArrowRight className="transition-transform group-hover/btn:translate-x-1" />
              </a>
            </Button>
            <div className="text-sm">
              <p className="font-semibold text-ink">[Nome do(a) Diretor(a) Clínico(a)]</p>
              <p className="text-muted-foreground">Diretor(a) clínico(a) · CRO-[UF] [número]</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
