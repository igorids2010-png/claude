import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em]",
  {
    variants: {
      variant: {
        default: "bg-turquoise-50 text-turquoise-700 ring-1 ring-turquoise-100",
        glass: "bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-md",
        dark: "bg-white/5 text-turquoise-300 ring-1 ring-white/10",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
