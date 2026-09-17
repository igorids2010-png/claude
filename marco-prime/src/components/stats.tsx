import { Reveal } from "@/components/reveal";
import { stats } from "@/lib/data/stats";

export function Stats() {
  return (
    <section
      id="numeros"
      aria-labelledby="numeros-title"
      className="border-y border-border bg-[#0c0c0c]"
    >
      <h2 id="numeros-title" className="sr-only">
        A Marco Prime em números
      </h2>
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <dl className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Reveal
              key={stat.label}
              delay={index * 80}
              className="flex flex-col gap-2 px-0 py-10 sm:px-8 lg:py-14"
            >
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <span className="block font-serif text-4xl text-gold lg:text-5xl">
                  {stat.value}
                </span>
                <span className="mt-3 block text-[0.6875rem] uppercase tracking-[0.2em] text-foreground/85">
                  {stat.label}
                </span>
                <span className="mt-4 block max-w-56 text-sm leading-relaxed text-muted-foreground">
                  {stat.description}
                </span>
              </dd>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
