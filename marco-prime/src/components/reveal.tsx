"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type RevealProps = React.ComponentProps<"div"> & {
  /** Atraso em ms para escalonar elementos irmãos. */
  delay?: number;
  as?: "div" | "section" | "li" | "article";
};

/**
 * Revela o conteúdo com fade/slide quando ele entra na viewport.
 * O estado inicial oculto vive na variante `motion-safe`, então quem pede
 * movimento reduzido — ou navega sem JS — vê o conteúdo normalmente.
 */
export function Reveal({
  className,
  delay = 0,
  as: Tag = "div",
  children,
  ...props
}: RevealProps) {
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Navegadores sem IntersectionObserver recebem o conteúdo já revelado.
    if (typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // `as ElementType` mantém a tipagem simples ao trocar a tag renderizada.
  const Component = Tag as React.ElementType;

  return (
    <Component
      ref={ref}
      data-visible={visible || undefined}
      className={cn(
        "motion-safe:opacity-0 motion-safe:data-visible:animate-reveal",
        className,
      )}
      style={{ animationDelay: delay ? `${delay}ms` : undefined }}
      {...props}
    >
      {children}
    </Component>
  );
}
