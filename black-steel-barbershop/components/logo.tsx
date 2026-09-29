import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    <a href="#home" className={cn("group inline-flex items-center gap-3", className)} aria-label="Black Steel Barbershop, back to top">
      <span
        aria-hidden
        className="grid size-9 place-items-center border border-white/70 font-display text-sm font-bold transition-colors duration-300 group-hover:bg-white group-hover:text-black"
      >
        BS
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-bold uppercase tracking-[0.2em]">Black Steel</span>
        <span className="mt-1 text-[0.6rem] uppercase tracking-[0.45em] text-muted">Barbershop</span>
      </span>
    </a>
  )
}
