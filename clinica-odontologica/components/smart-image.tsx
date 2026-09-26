"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * next/image com fallback elegante: se a imagem remota falhar,
 * exibe um gradiente da marca no lugar (o layout nunca "quebra").
 */
export function SmartImage({ className, alt, ...props }: ImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "absolute inset-0 bg-[radial-gradient(120%_80%_at_30%_20%,var(--color-turquoise-300)_0%,var(--color-turquoise-700)_45%,var(--color-ink)_100%)]",
          className
        )}
      />
    );
  }

  return <Image alt={alt} className={className} onError={() => setFailed(true)} {...props} />;
}
