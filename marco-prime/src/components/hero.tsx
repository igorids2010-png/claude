import Image from "next/image";

import { Button } from "@/components/ui/button";
import { PropertySearch } from "@/components/property-search";
import { Reveal } from "@/components/reveal";
import { ScrollIndicator } from "@/components/scroll-indicator";

export function Hero() {
  return (
    <section
      id="inicio"
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden pb-16 pt-32 sm:pb-20 xl:pb-28"
    >
      {/* Plano de fundo: skyline corporativo com overlay escuro. */}
      <Image
        src="/images/hero-skyline.svg"
        alt="Skyline de um distrito corporativo ao anoitecer, com torres envidraçadas iluminadas"
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-bottom"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgba(10,10,10,0.88)_0%,rgba(10,10,10,0.5)_40%,rgba(10,10,10,0.94)_100%)]"
      />

      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <div className="max-w-3xl">
          <Reveal className="eyebrow flex items-center gap-3">
            <span aria-hidden="true" className="h-px w-10 bg-gold/60" />
            Imóveis comerciais de alto padrão
          </Reveal>

          <Reveal delay={90}>
            <h1
              id="hero-title"
              className="mt-7 text-balance text-4xl leading-[1.08] sm:text-5xl lg:text-6xl"
            >
              O endereço certo para o seu{" "}
              <em className="not-italic text-gold">negócio crescer</em>
            </h1>
          </Reveal>

          <Reveal delay={170}>
            <p className="mt-7 max-w-xl text-pretty text-base leading-relaxed text-foreground/70 sm:text-lg">
              Curadoria de escritórios, lajes corporativas e galpões logísticos
              nos eixos mais valorizados do país. Quinze anos assessorando
              empresas que não negociam localização.
            </p>
          </Reveal>

          <Reveal
            delay={250}
            className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Button asChild size="lg">
              <a href="#imoveis">Ver imóveis disponíveis</a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#contato">Fale com um especialista</a>
            </Button>
          </Reveal>
        </div>

        <Reveal delay={330} className="mt-12 lg:mt-16">
          <PropertySearch />
        </Reveal>
      </div>

      <ScrollIndicator />
    </section>
  );
}
