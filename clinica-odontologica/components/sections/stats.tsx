"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView } from "framer-motion";
import { stats } from "@/data/site";
import { Stagger, StaggerItem } from "@/components/reveal";

function Counter({ value, decimals = 0, suffix }: { value: number; decimals?: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 2.2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, value]);

  const formatted = display.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span ref={ref} className="tabular-nums">
      {formatted}
      <span className="text-turquoise-500">{suffix}</span>
    </span>
  );
}

export function Stats() {
  return (
    <section aria-label="Números da clínica" className="relative z-10 -mt-20 px-5 sm:px-8">
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-[0_40px_100px_-40px_rgba(10,15,17,0.35)]"
      >
        <Stagger className="grid grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <StaggerItem
              key={s.label}
              className="group relative border-black/5 p-6 sm:p-10 [&:nth-child(-n+2)]:border-b lg:[&:nth-child(-n+2)]:border-b-0 [&:nth-child(odd)]:border-r lg:[&:not(:last-child)]:border-r"
            >
              <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-turquoise-500 transition-transform duration-700 group-hover:scale-x-100" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">0{i + 1}</p>
              <p className="mt-3 font-serif text-4xl font-medium text-ink sm:text-6xl">
                <Counter value={s.value} decimals={s.decimals} suffix={s.suffix} />
              </p>
              <p className="mt-2 text-sm font-semibold text-ink sm:text-base">{s.label}</p>
              <p className="mt-1 hidden text-sm text-muted-foreground sm:block">{s.description}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </motion.div>
    </section>
  );
}
