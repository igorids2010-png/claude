import { cn } from "@/lib/utils"
import { Reveal } from "./reveal"

type SectionHeadingProps = {
  eyebrow: string
  title: string
  description?: string
  align?: "left" | "center"
  id?: string
  className?: string
}

export function SectionHeading({ eyebrow, title, description, align = "left", id, className }: SectionHeadingProps) {
  return (
    <Reveal className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      <p
        className={cn(
          "flex items-center gap-4 text-xs font-medium uppercase tracking-[0.35em] text-muted",
          align === "center" && "justify-center",
        )}
      >
        <span aria-hidden className="h-px w-10 bg-line-strong" />
        {eyebrow}
        {align === "center" && <span aria-hidden className="h-px w-10 bg-line-strong" />}
      </p>
      <h2
        id={id}
        className="mt-5 font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight text-balance sm:text-5xl lg:text-6xl"
      >
        {title}
      </h2>
      {description && <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">{description}</p>}
    </Reveal>
  )
}
