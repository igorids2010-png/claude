import Image from "next/image"
import { Clock } from "lucide-react"

import type { Service } from "@/lib/data"
import { cn } from "@/lib/utils"

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })

type ServiceCardProps = {
  service: Service
  index: number
  className?: string
}

export function ServiceCard({ service, index, className }: ServiceCardProps) {
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden border border-line bg-surface transition-[border-color,transform,box-shadow] duration-500 hover:-translate-y-1 hover:border-white/70 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.15),0_30px_60px_-30px_rgba(255,255,255,0.25)]",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
        <Image
          src={service.image}
          alt={`Serviço de ${service.name.toLowerCase()} na Black Steel`}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover grayscale transition-[transform,filter] duration-700 ease-out group-hover:scale-110 group-hover:contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
        <span className="absolute top-4 left-4 font-display text-sm text-white/70 tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>
        {service.featured && (
          <span className="absolute top-4 right-4 bg-white px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-black">
            Mais pedido
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-display text-2xl font-bold uppercase tracking-wide">{service.name}</h3>
          <p className="shrink-0 font-display text-2xl font-bold">
            <span className="sr-only">Preço: </span>
            {currency.format(service.price)}
          </p>
        </div>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{service.description}</p>
        <div className="mt-6 flex items-center justify-between border-t border-line pt-5 text-xs uppercase tracking-[0.25em] text-subtle">
          <span className="flex items-center gap-2">
            <Clock aria-hidden className="size-3.5" />
            {service.duration}
          </span>
          <span
            aria-hidden
            className="h-px w-8 bg-white/30 transition-all duration-500 group-hover:w-16 group-hover:bg-white"
          />
        </div>
      </div>
    </article>
  )
}
