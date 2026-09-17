import { cn } from "@/lib/utils";
import { Reveal } from "@/components/reveal";

type SectionHeadingProps = {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  align?: "left" | "center";
  className?: string;
  /** Id usado pelo `aria-labelledby` da seção. */
  titleId?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  titleId,
}: SectionHeadingProps) {
  return (
    <Reveal
      className={cn(
        "flex max-w-2xl flex-col gap-5",
        align === "center" && "mx-auto items-center text-center",
        className,
      )}
    >
      <span className="eyebrow flex items-center gap-3">
        <span aria-hidden="true" className="h-px w-8 bg-gold/60" />
        {eyebrow}
      </span>
      <h2
        id={titleId}
        className="text-balance text-3xl leading-[1.15] sm:text-4xl lg:text-5xl"
      >
        {title}
      </h2>
      {description ? (
        <p className="text-pretty text-base leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
    </Reveal>
  );
}
