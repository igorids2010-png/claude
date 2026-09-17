"use client";

import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/property-card";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { usePropertyFilters } from "@/components/property-filters";

export function FeaturedProperties() {
  const { results, isFiltered, reset } = usePropertyFilters();

  return (
    <section
      id="imoveis"
      aria-labelledby="imoveis-title"
      className="mx-auto max-w-7xl scroll-mt-24 px-6 py-24 lg:px-10 lg:py-32"
    >
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          titleId="imoveis-title"
          eyebrow="Portfólio selecionado"
          title="Imóveis em destaque"
          description="Ativos verificados um a um: documentação, infraestrutura predial e perfil de vizinhança auditados antes de chegarem até você."
        />
        <Reveal delay={120} className="shrink-0">
          <Button asChild variant="outline">
            <a href="#contato">Ver portfólio completo</a>
          </Button>
        </Reveal>
      </div>

      <div className="hairline mt-12" />

      {isFiltered ? (
        <Reveal className="mt-8 flex flex-wrap items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Exibindo {results.length} de 6 imóveis com os filtros selecionados.
          </p>
          <Button type="button" variant="ghost" size="sm" onClick={reset}>
            Limpar filtros
          </Button>
        </Reveal>
      ) : null}

      {results.length > 0 ? (
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((property, index) => (
            <Reveal
              as="li"
              key={property.id}
              delay={(index % 3) * 100}
              className="h-full"
            >
              <PropertyCard property={property} priority={index < 3} />
            </Reveal>
          ))}
        </ul>
      ) : (
        <Reveal className="mt-10 border border-border/80 bg-card px-8 py-16 text-center">
          <p className="font-serif text-2xl">
            Nenhum imóvel corresponde a esses critérios
          </p>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            Boa parte do nosso portfólio não é anunciada publicamente. Fale com
            um consultor e faremos uma busca dirigida ao seu perfil.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button type="button" variant="outline" onClick={reset}>
              Limpar filtros
            </Button>
            <Button asChild>
              <a href="#contato">Fale com um consultor</a>
            </Button>
          </div>
        </Reveal>
      )}
    </section>
  );
}
