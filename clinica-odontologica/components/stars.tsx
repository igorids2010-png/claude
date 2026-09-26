import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({ rating = 5, className }: { rating?: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-label={`${rating} de 5 estrelas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn("size-4", i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-transparent text-current/30")}
        />
      ))}
    </div>
  );
}
