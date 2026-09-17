import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-xs px-2.5 py-1 text-[0.625rem] font-medium uppercase tracking-[0.18em] transition-colors",
  {
    variants: {
      variant: {
        default: "bg-gold text-primary-foreground",
        outline: "border border-gold/50 text-gold backdrop-blur-sm",
        muted: "bg-black/60 text-foreground/80 backdrop-blur-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
