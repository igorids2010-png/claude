import { cn } from "@/lib/utils";

/** Marca tipográfica: monograma em dourado + nome em serifada. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center border border-gold/60 font-serif text-sm tracking-[0.1em] text-gold"
      >
        MP
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-serif text-lg tracking-[0.08em] text-foreground">
          Marco Prime
        </span>
        <span className="mt-1 text-[0.5625rem] uppercase tracking-[0.3em] text-muted-foreground">
          Imóveis Corporativos
        </span>
      </span>
    </span>
  );
}
