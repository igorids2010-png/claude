"use client";

import * as React from "react";

import { formatArea } from "@/lib/utils";
import { properties } from "@/lib/data/properties";

/** Só os imóveis marcados entram no rodízio — é a vitrine do hero. */
const featured = properties.filter((property) => property.badge).slice(0, 3);
const INTERVAL = 3800;

/**
 * Ticker que alterna os imóveis em destaque logo acima da busca.
 * Movimento pequeno e previsível: chama o olho sem competir com o título.
 */
export function HeroTicker() {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (
      featured.length < 2 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const id = window.setInterval(
      () => setIndex((value) => (value + 1) % featured.length),
      INTERVAL,
    );
    return () => window.clearInterval(id);
  }, []);

  const current = featured[index];

  return (
    <a
      href="#imoveis"
      className="group inline-flex max-w-full items-center gap-4 border border-gold/25 bg-black/40 py-2 pl-2 pr-5 backdrop-blur-md transition-colors hover:border-gold/60"
    >
      <span className="flex items-center gap-2 bg-gold px-3 py-1.5 text-[0.5625rem] uppercase tracking-[0.2em] text-primary-foreground">
        <span
          aria-hidden="true"
          className="size-1.5 rounded-full bg-primary-foreground motion-safe:animate-pulse"
        />
        {current.badge}
      </span>

      {/* A região viva anuncia a troca sem interromper quem usa leitor de tela. */}
      <span
        aria-live="polite"
        aria-atomic="true"
        className="min-w-0 truncate text-xs text-foreground/80 sm:text-sm"
      >
        <span className="text-foreground">{current.title}</span>
        <span className="text-muted-foreground">
          {" — "}
          {current.region} · {formatArea(current.area)}
        </span>
      </span>

      <span
        aria-hidden="true"
        className="ml-auto hidden shrink-0 text-gold transition-transform duration-300 group-hover:translate-x-1 sm:block"
      >
        →
      </span>
    </a>
  );
}
