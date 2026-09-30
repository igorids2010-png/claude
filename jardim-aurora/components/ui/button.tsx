import * as React from "react"
import { Slot } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium tracking-wide transition-all duration-300 ease-(--ease-soft) outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-forest-800 text-cream-100 shadow-sm hover:bg-forest-700 hover:shadow-md",
        gold: "bg-gold-500 text-forest-900 shadow-[0_8px_24px_-12px_rgb(201_169_97/0.9)] hover:bg-gold-400 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-12px_rgb(201_169_97/0.95)]",
        outline:
          "border border-forest-800/25 bg-transparent text-forest-800 hover:border-gold-500 hover:bg-gold-500/10",
        "outline-cream":
          "border border-cream-100/70 bg-cream-100/5 text-cream-100 backdrop-blur-sm hover:border-gold-400 hover:bg-cream-100/15 hover:text-white",
        ghost: "text-forest-800 hover:bg-forest-800/5",
        link: "text-forest-800 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6",
        sm: "h-9 px-4 text-[13px]",
        lg: "h-13 px-8 text-[15px]",
        icon: "size-11",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
