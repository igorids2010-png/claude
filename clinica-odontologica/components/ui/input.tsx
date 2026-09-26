import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-12 w-full rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white placeholder:text-white/40 transition-colors focus-visible:border-turquoise-400 focus-visible:bg-white/10 focus-visible:outline-none",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
