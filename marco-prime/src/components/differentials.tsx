import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { differentials } from "@/lib/data/differentials";

export function Differentials() {
  return (
    <section
      id="diferenciais"
      aria-labelledby="diferenciais-title"
      className="border-y border-border bg-[#0c0c0c]"
    >
      <div className="mx-auto max-w-7xl scroll-mt-24 px-6 py-24 lg:px-10 lg:py-32">
        <SectionHeading
          titleId="diferenciais-title"
          eyebrow="Por que a Marco Prime"
          title="Assessoria completa, do primeiro filtro à chave na mão"
          description="Não intermediamos volume. Conduzimos poucas operações por vez, com equipe própria em cada etapa crítica da negociação."
          align="center"
        />

        <ul className="mt-16 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {differentials.map((item, index) => (
            <Reveal
              as="li"
              key={item.title}
              delay={index * 90}
              className="group flex flex-col gap-5 bg-[#0c0c0c] p-8 transition-colors duration-500 hover:bg-[#111]"
            >
              <span
                aria-hidden="true"
                className="flex size-12 items-center justify-center border border-gold/40 text-gold transition-colors duration-500 group-hover:border-gold group-hover:bg-gold/10"
              >
                <item.icon className="size-5" strokeWidth={1.25} />
              </span>
              <h3 className="text-xl leading-snug">{item.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
