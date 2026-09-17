import { ArrowRight, PhoneCall } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { site } from "@/lib/site";

/** Bloco de conversão final, em dourado sólido para máximo contraste. */
export function FinalCta() {
  return (
    <section
      id="contato"
      aria-labelledby="contato-title"
      className="scroll-mt-20 bg-gold text-primary-foreground"
    >
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-20">
          <Reveal>
            <span className="flex items-center gap-3 text-[0.6875rem] uppercase tracking-[0.28em] text-primary-foreground/80">
              <span aria-hidden="true" className="h-px w-8 bg-primary-foreground/40" />
              Consultoria sem compromisso
            </span>
            <h2
              id="contato-title"
              className="mt-7 text-balance text-3xl leading-[1.12] sm:text-4xl lg:text-5xl"
            >
              Agende uma consultoria e receba uma seleção sob medida em 48 horas
            </h2>
            <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-primary-foreground/75">
              Conte o perfil da sua operação — headcount, região desejada, prazo
              de mudança e orçamento. Um consultor sênior monta a shortlist e
              agenda as visitas.
            </p>
          </Reveal>

          <Reveal delay={140} className="flex flex-col gap-4">
            <Button
              asChild
              size="lg"
              className="w-full bg-[#0a0a0a] text-gold hover:bg-[#151515] hover:shadow-none"
            >
              <a href={site.whatsappHref} target="_blank" rel="noopener noreferrer">
                Agendar consultoria
                <ArrowRight aria-hidden="true" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full border-primary-foreground/40 text-primary-foreground hover:border-primary-foreground hover:bg-primary-foreground/10"
            >
              <a href={site.phoneHref}>
                <PhoneCall aria-hidden="true" />
                {site.phone}
              </a>
            </Button>
            <p className="text-center text-xs text-primary-foreground/75">
              {site.hours}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
