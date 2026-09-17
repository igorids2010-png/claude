import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-[0.8125rem] font-medium uppercase tracking-[0.16em] transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gold text-primary-foreground hover:bg-gold-soft hover:shadow-[0_0_30px_-8px_var(--color-gold)]",
        outline:
          "border border-gold/50 text-gold hover:border-gold hover:bg-gold/10",
        ghost: "text-foreground/80 hover:text-gold",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground",
        link: "text-gold underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-7",
        sm: "h-10 px-5 text-[0.75rem]",
        lg: "h-14 px-9",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
