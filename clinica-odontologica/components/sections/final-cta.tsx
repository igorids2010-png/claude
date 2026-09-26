"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CalendarCheck, Check, Clock, MapPin, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Reveal } from "@/components/reveal";
import { clinic, finalCta } from "@/data/site";

export function FinalCta() {
  const [sent, setSent] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Site demonstrativo: aqui entraria a integração (WhatsApp, e-mail, CRM...).
    setSent(true);
  };

  return (
    <section id="contato" className="relative px-3 pb-3 sm:px-5 sm:pb-5">
      <div className="grain relative isolate overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-turquoise-500 via-turquoise-700 to-ink px-5 py-20 text-white sm:px-8 sm:py-28">
        {/* Elementos decorativos */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="pointer-events-none absolute -right-40 -top-40 -z-10 size-[40rem] rounded-full border border-white/10"
        >
          <span className="absolute left-1/2 top-0 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-turquoise-200 shadow-[0_0_20px_6px_rgba(111,220,207,0.6)]" />
        </motion.div>
        <div className="pointer-events-none absolute -right-20 -top-20 -z-10 size-[28rem] rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-40 left-1/4 -z-10 size-[30rem] rounded-full bg-turquoise-300/30 blur-[120px]" />

        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <Reveal>
              <Badge variant="glass">
                <CalendarCheck className="size-3.5" /> {finalCta.eyebrow}
              </Badge>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="mt-8 text-balance text-5xl font-medium leading-[0.98] sm:text-6xl lg:text-7xl">
                Seu novo sorriso começa com uma <em className="text-turquoise-200">conversa</em>.
              </h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">{finalCta.text}</p>
            </Reveal>
            <Reveal delay={0.3} className="mt-10 grid gap-4 text-sm sm:grid-cols-3">
              {[
                { icon: Phone, label: "Telefone", value: clinic.whatsapp },
                { icon: MapPin, label: "Endereço", value: clinic.city },
                { icon: Clock, label: "Horário", value: `${clinic.hours[0].time}` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 ring-1 ring-white/20">
                    <Icon className="size-4" />
                  </span>
                  <span>
                    <span className="block text-[11px] uppercase tracking-[0.15em] text-white/50">{label}</span>
                    <span className="font-medium">{value}</span>
                  </span>
                </div>
              ))}
            </Reveal>
          </div>

          <Reveal delay={0.2} y={60}>
            <div className="relative rounded-[2rem] border border-white/15 bg-ink/40 p-6 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-10">
              <AnimatePresence mode="wait">
                {sent ? (
                  <motion.div
                    key="ok"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex min-h-[22rem] flex-col items-center justify-center text-center"
                  >
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
                      className="grid size-16 place-items-center rounded-full bg-turquoise-400 text-ink"
                    >
                      <Check className="size-8" />
                    </motion.span>
                    <p className="mt-6 font-serif text-3xl">Solicitação recebida!</p>
                    <p className="mt-2 max-w-xs text-white/60">Nossa equipe entrará em contato em breve para confirmar seu horário.</p>
                    <Button variant="outline-light" className="mt-8" onClick={() => setSent(false)}>
                      Enviar outra solicitação
                    </Button>
                  </motion.div>
                ) : (
                  <motion.form key="form" onSubmit={onSubmit} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                    <p className="font-serif text-3xl">Agende sua avaliação</p>
                    <p className="text-sm text-white/60">Retornamos em até 1 hora útil.</p>
                    <div className="space-y-3 pt-3">
                      <label className="sr-only" htmlFor="nome">Nome</label>
                      <Input id="nome" required placeholder="Seu nome completo" autoComplete="name" />
                      <label className="sr-only" htmlFor="tel">Telefone</label>
                      <Input id="tel" required type="tel" placeholder="WhatsApp com DDD" autoComplete="tel" />
                      <label className="sr-only" htmlFor="tratamento">Tratamento de interesse</label>
                      <select
                        id="tratamento"
                        defaultValue=""
                        required
                        className="flex h-12 w-full appearance-none rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white transition-colors focus-visible:border-turquoise-400 focus-visible:outline-none invalid:text-white/40 [&>option]:text-ink"
                      >
                        <option value="" disabled>Tratamento de interesse</option>
                        {finalCta.treatmentsOptions.map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                    <Button type="submit" variant="light" size="lg" className="mt-2 w-full">
                      Quero agendar minha avaliação
                      <ArrowRight className="transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                    <p className="text-center text-[11px] text-white/40">Seus dados estão protegidos conforme a LGPD.</p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
