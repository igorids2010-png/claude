import { cn } from "@/lib/utils"
import { LogoMark } from "@/components/botanical-ornaments"

export function Logo({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const light = tone === "light"
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className={cn("size-9 transition-colors duration-500", light ? "text-gold-400" : "text-gold-600")} />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-serif text-[1.35rem] font-semibold tracking-tight transition-colors duration-500",
            light ? "text-cream-100" : "text-forest-800"
          )}
        >
          Jardim <span className="italic font-medium">Aurora</span>
        </span>
        <span
          className={cn(
            "mt-1 text-[9px] font-semibold uppercase tracking-[0.34em] transition-colors duration-500",
            light ? "text-gold-300" : "text-gold-700"
          )}
        >
          Floricultura
        </span>
      </span>
    </span>
  )
}
