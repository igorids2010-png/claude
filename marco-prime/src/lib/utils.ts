import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatação feita à mão em vez de `Intl`: as versões de ICU do servidor e do
 * navegador divergem no separador usado após "R$" e quebram a hidratação.
 */
function groupThousands(value: number) {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** "96 mi", "2,4 bi", "285 mil" — uma casa decimal, sem zero à toa. */
function compact(value: number) {
  const units: [number, string][] = [
    [1_000_000_000, "bi"],
    [1_000_000, "mi"],
    [1_000, "mil"],
  ];

  for (const [threshold, suffix] of units) {
    if (value >= threshold) {
      const scaled = Math.round((value / threshold) * 10) / 10;
      const label = Number.isInteger(scaled)
        ? String(scaled)
        : String(scaled).replace(".", ",");
      return `${label} ${suffix}`;
    }
  }

  return groupThousands(value);
}

/** Valores de locação saem por extenso; valores de venda, de forma compacta. */
export function formatPrice(value: number, transaction: "Locação" | "Venda") {
  if (transaction === "Venda") {
    return `R$ ${compact(value)}`;
  }
  return `R$ ${groupThousands(value)}/mês`;
}

export function formatArea(value: number) {
  return `${groupThousands(value)} m²`;
}
