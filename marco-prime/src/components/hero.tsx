import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { HeroTicker } from "@/components/hero-ticker";
import { PropertySearch } from "@/components/property-search";
import { Reveal } from "@/components/reveal";
import { ScrollIndicator } from "@/components/scroll-indicator";

/** Cada linha do título sobe de dentro da própria máscara, em cascata. */
function HeadlineLine({
  children,
  delay,
}: {
  children: React.ReactNode;
  delay: number;
}) {
  return (
    <span className="block overflow-hidden pb-[0.12em]">
      <span
        className="block motion-safe:animate-rise"
        style={{ animationDelay: `${delay}ms` }}
      >
        {children}
      </span>
    </span>
  );
}

export function Hero() {
  return (
    <section
      id="inicio"
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden pb-16 pt-32 sm:pb-20 xl:pb-28"
    >
      {/* Fundo com aproximação lenta: a cidade "respira" atrás do texto. */}
      <div className="absolute inset-0 -z-20 motion-safe:animate-ken-burns">
        <Image
          src="/images/hero-skyline.svg"
          alt="Skyline de um distrito corporativo ao anoitecer, com torres envidraçadas iluminadas"
          fill
          priority
          sizes="100vw"
          className="object-cover object-bottom"
        />
      </div>

      {/* Camadas de leitura: gradiente vertical, vinheta lateral e grão. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgba(10,10,10,0.9)_0%,rgba(10,10,10,0.45)_42%,rgba(10,10,10,0.96)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_20%_45%,transparent_0%,rgba(10,10,10,0.75)_100%)]"
      />
      <div
        aria-hidden="true"
        className="grain absolute inset-0 -z-10 opacity-[0.04] mix-blend-overlay"
      />

      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <div className="max-w-4xl">
          <div className="flex items-center gap-4 overflow-hidden">
            <span
              aria-hidden="true"
              className="h-px w-12 origin-left bg-gold motion-safe:animate-draw"
            />
            <span className="eyebrow motion-safe:animate-rise">
              Imóveis comerciais de alto padrão
            </span>
          </div>

          <h1
            id="hero-title"
            className="mt-8 text-[clamp(2.75rem,7vw,5.5rem)] font-light leading-[0.98] tracking-[-0.02em]"
          >
            <HeadlineLine delay={120}>O endereço certo</HeadlineLine>
            <HeadlineLine delay={260}>
              para o seu{" "}
              {/* O brilho varre a palavra dourada duas vezes e para. */}
              <em className="not-italic bg-[linear-gradient(100deg,var(--color-gold)_38%,#fff4d6_50%,var(--color-gold)_62%)] bg-[length:250%_100%] bg-clip-text text-transparent motion-safe:animate-shimmer">
                negócio crescer
              </em>
            </HeadlineLine>
          </h1>

          <Reveal delay={620}>
            <p className="mt-8 max-w-lg text-pretty text-base leading-relaxed text-foreground/75 sm:text-lg">
              Curadoria de escritórios, lajes corporativas e galpões logísticos
              nos eixos mais valorizados do país.{" "}
              <span className="text-foreground">
                Quinze anos assessorando empresas que não negociam localização.
              </span>
            </p>
          </Reveal>

          <Reveal
            delay={720}
            className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Button asChild size="lg" className="group">
              <a href="#imoveis">
                Ver imóveis disponíveis
                <ArrowRight
                  aria-hidden="true"
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#contato">Fale com um especialista</a>
            </Button>
          </Reveal>
        </div>

        <Reveal delay={820} className="mt-12 lg:mt-14">
          <HeroTicker />
        </Reveal>

        <Reveal delay={900} className="mt-5">
          <PropertySearch />
        </Reveal>
      </div>

      <ScrollIndicator />
    </section>
  );
}
