import Image from "next/image";
import { ArrowUpRight, MapPin, Ruler } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatArea, formatPrice } from "@/lib/utils";
import type { Property } from "@/lib/data/properties";

export function PropertyCard({
  property,
  priority = false,
}: {
  property: Property;
  priority?: boolean;
}) {
  return (
    <Card className="group relative flex h-full flex-col overflow-hidden transition-all duration-500 hover:border-gold/60 focus-within:border-gold/60 hover:shadow-[0_28px_60px_-40px_var(--color-gold)]">
      <div className="relative aspect-4/3 overflow-hidden bg-[#0d0d0d]">
        <Image
          src={property.image}
          alt={property.imageAlt}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-t from-card/85 via-card/10 to-transparent"
        />

        <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-3">
          {property.badge ? (
            <Badge variant={property.badge === "Novo" ? "default" : "outline"}>
              {property.badge}
            </Badge>
          ) : (
            <span />
          )}
          <Badge variant="muted">{property.transaction}</Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="eyebrow">{property.type}</p>

        <h3 className="mt-3 text-xl leading-snug">
          {/* O link cobre o card inteiro, mantendo um único alvo de foco. */}
          <a
            href="#contato"
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            {property.title}
            <span className="sr-only"> — falar com um consultor</span>
          </a>
        </h3>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <MapPin aria-hidden="true" className="size-3.5 text-gold/70" />
            {property.region}, {property.state}
          </span>
          <span className="inline-flex items-center gap-2">
            <Ruler aria-hidden="true" className="size-3.5 text-gold/70" />
            {formatArea(property.area)}
          </span>
        </div>

        <ul className="mt-5 flex flex-wrap gap-2">
          {property.highlights.map((highlight) => (
            <li
              key={highlight}
              className="border border-border/80 px-2.5 py-1 text-[0.6875rem] uppercase tracking-[0.12em] text-foreground/60"
            >
              {highlight}
            </li>
          ))}
        </ul>

        <div className="mt-auto flex items-end justify-between gap-4 pt-7">
          <p className="font-serif text-2xl text-gold">
            {formatPrice(property.price, property.transaction)}
          </p>
          <span
            aria-hidden="true"
            className="flex size-10 items-center justify-center border border-border text-gold transition-all duration-300 group-hover:border-gold group-hover:bg-gold group-hover:text-primary-foreground"
          >
            <ArrowUpRight className="size-4" />
          </span>
        </div>
      </div>
    </Card>
  );
}
