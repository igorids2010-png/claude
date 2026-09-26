import { clinic } from "@/data/site";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden className={cn("size-9", className)}>
      <rect width="40" height="40" rx="12" className="fill-turquoise-500" />
      <path
        d="M13.2 11.5c-2.6 0-4.2 2.3-4.2 5.3 0 3.4 1.3 5 2.2 8.5.8 3 1.2 5.2 2.9 5.2 1.8 0 1.9-3.4 3-5.6.6-1.2 1.7-1.2 2.3 0 1.1 2.2 1.2 5.6 3 5.6 1.7 0 2.1-2.2 2.9-5.2.9-3.5 2.2-5.1 2.2-8.5 0-3-1.6-5.3-4.2-5.3-2.3 0-3.2 1.3-5.1 1.3s-2.7-1.3-5-1.3Z"
        fill="white"
      />
      <path d="M25.5 14.5c1 .5 1.6 1.4 1.8 2.6" stroke="#16a99b" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ tone = "dark", className }: { tone?: "dark" | "light"; className?: string }) {
  return (
    <a href="#inicio" className={cn("flex items-center gap-3", className)} aria-label={`${clinic.name} ${clinic.suffix}`}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-serif text-2xl font-medium tracking-tight transition-colors duration-500",
            tone === "light" ? "text-white" : "text-ink"
          )}
        >
          {clinic.name}
        </span>
        <span
          className={cn(
            "mt-0.5 text-[9px] font-semibold uppercase tracking-[0.35em] transition-colors duration-500",
            tone === "light" ? "text-white/60" : "text-muted-foreground"
          )}
        >
          {clinic.suffix}
        </span>
      </span>
    </a>
  );
}
