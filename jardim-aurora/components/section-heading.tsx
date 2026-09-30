import * as React from "react"

import { cn } from "@/lib/utils"
import { SprigDivider } from "@/components/botanical-ornaments"
import { Reveal } from "@/components/reveal"

type SectionHeadingProps = {
  eyebrow: string
  title: React.ReactNode
  description?: React.ReactNode
  align?: "center" | "left"
  tone?: "light" | "dark"
  className?: string
  id?: string
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  tone = "light",
  className,
  id,
}: SectionHeadingProps) {
  const dark = tone === "dark"
  return (
    <Reveal
      className={cn(
        "flex max-w-2xl flex-col gap-4",
        align === "center" ? "mx-auto items-center text-center" : "items-start text-left",
        className
      )}
    >
      <span
        className={cn(
          "flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.28em]",
          dark ? "text-gold-400" : "text-gold-700"
        )}
      >
        {eyebrow}
      </span>
      <h2
        id={id}
        className={cn(
          "text-[2.1rem] leading-[1.12] font-medium sm:text-[2.6rem] lg:text-5xl",
          dark ? "text-cream-100" : "text-forest-800"
        )}
      >
        {title}
      </h2>
      <SprigDivider className={cn("my-1", dark ? "text-gold-500" : "text-gold-600")} />
      {description ? (
        <p className={cn("max-w-xl text-base leading-relaxed sm:text-lg", dark ? "text-cream-100/75" : "text-muted-foreground")}>
          {description}
        </p>
      ) : null}
    </Reveal>
  )
}
