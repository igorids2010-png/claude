import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/reveal";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "light",
  className,
}: SectionHeadingProps) {
  const dark = tone === "dark";
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      <Reveal>
        <Badge variant={dark ? "dark" : "default"}>
          <span className="size-1.5 rounded-full bg-turquoise-400" />
          {eyebrow}
        </Badge>
      </Reveal>
      <Reveal delay={0.08}>
        <h2
          className={cn(
            "mt-6 text-balance text-4xl font-medium leading-[1.05] sm:text-5xl lg:text-6xl",
            dark ? "text-white" : "text-ink"
          )}
        >
          {title}
        </h2>
      </Reveal>
      {description && (
        <Reveal delay={0.16}>
          <p className={cn("mt-6 text-base leading-relaxed sm:text-lg", dark ? "text-white/60" : "text-muted-foreground")}>
            {description}
          </p>
        </Reveal>
      )}
    </div>
  );
}
