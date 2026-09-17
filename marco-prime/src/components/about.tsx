import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";

const pillars = [
  {
    title: "Presença nos eixos que importam",
    description:
      "Faria Lima, Berrini, Vila Olímpia, Alphaville e os principais polos logísticos do interior paulista.",
  },
  {
    title: "Mandatos exclusivos",
    description:
      "Boa parte do portfólio é off-market: imóveis que nunca chegam aos portais de anúncio.",
  },
];

export function About() {
  return (
    <section
      id="sobre"
      aria-labelledby="sobre-title"
      className="mx-auto max-w-7xl scroll-mt-24 px-6 py-24 lg:px-10 lg:py-32"
    >
      <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <Reveal className="relative">
          <div className="relative aspect-4/5 overflow-hidden border border-border sm:aspect-4/3 lg:aspect-4/5">
            <Image
              src="/images/equipe.svg"
              alt="Equipe de consultores da Marco Prime reunida diante da parede de vidro do escritório, com a cidade ao fundo"
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
          </div>
          {/* Selo sobreposto reforça o tom de autoridade. */}
          <div className="absolute -bottom-6 -right-2 hidden border border-gold/40 bg-background px-7 py-6 sm:block lg:-right-8">
            <p className="font-serif text-4xl text-gold">2009</p>
            <p className="mt-2 text-[0.625rem] uppercase tracking-[0.22em] text-muted-foreground">
              Fundada em São Paulo
            </p>
          </div>
        </Reveal>

        <div>
          <SectionHeading
            titleId="sobre-title"
            eyebrow="Sobre a Marco Prime"
            title="Quinze anos definindo endereços corporativos"
            description="Nascemos como uma boutique de consultoria imobiliária para empresas que tratam o endereço como decisão estratégica, não como despesa. Hoje assessoramos fundos, multinacionais e operações em expansão acelerada — sempre com o mesmo padrão de análise."
          />

          <ul className="mt-10 flex flex-col divide-y divide-border border-y border-border">
            {pillars.map((pillar, index) => (
              <Reveal
                as="li"
                key={pillar.title}
                delay={index * 100}
                className="flex flex-col gap-2 py-6"
              >
                <h3 className="text-base tracking-wide">{pillar.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {pillar.description}
                </p>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={200} className="mt-10">
            <Button asChild variant="outline">
              <a href="#contato">Conheça nossa assessoria</a>
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
