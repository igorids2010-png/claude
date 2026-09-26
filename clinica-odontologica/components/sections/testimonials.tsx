"use client";

import { useCallback, useEffect, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import { Quote } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { SmartImage } from "@/components/smart-image";
import { Stars } from "@/components/stars";
import { Reveal } from "@/components/reveal";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { testimonials } from "@/data/site";
import { cn } from "@/lib/utils";

export function Testimonials() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const onSelect = useCallback((a: NonNullable<CarouselApi>) => setCurrent(a.selectedScrollSnap()), []);

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    onSelect(api);
    api.on("select", onSelect);
    api.on("reInit", () => setCount(api.scrollSnapList().length));
    return () => {
      api.off("select", onSelect);
    };
  }, [api, onSelect]);

  return (
    <section id="depoimentos" className="relative overflow-hidden py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-10 lg:flex-row lg:items-end">
          <SectionHeading
            eyebrow="Depoimentos"
            title={
              <>
                Sorrisos que contam <em className="text-turquoise-600">histórias</em>.
              </>
            }
            description="A opinião de quem já viveu a experiência é o nosso maior orgulho."
          />
          <Reveal delay={0.2} className="flex items-center gap-6">
            <div className="text-right">
              <p className="mb-2 font-serif text-5xl font-medium leading-none text-ink">4,9</p>
              <Stars rating={5} className="justify-end" />
              <p className="mt-1 text-xs text-muted-foreground">+1.800 avaliações no Google</p>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.1} className="mt-16">
          <Carousel
            setApi={setApi}
            opts={{ align: "start", loop: true }}
            plugins={[Autoplay({ delay: 5500, stopOnInteraction: false, stopOnMouseEnter: true })]}
          >
            <CarouselContent>
              {testimonials.map((t, i) => (
                <CarouselItem key={t.name} className="md:basis-1/2 lg:basis-1/3">
                  <figure
                    className={cn(
                      "group relative flex h-full flex-col rounded-[1.75rem] border p-8 transition-all duration-700 sm:p-10",
                      current === i
                        ? "border-ink bg-ink text-white shadow-[0_40px_80px_-40px_rgba(10,15,17,0.6)]"
                        : "border-black/5 bg-mist text-ink"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <Stars rating={t.rating} />
                      <Quote className={cn("size-10 transition-colors duration-700", current === i ? "text-turquoise-400" : "text-turquoise-200")} />
                    </div>
                    <blockquote className="mt-8 flex-1 font-serif text-xl leading-snug sm:text-[1.4rem]">“{t.text}”</blockquote>
                    <figcaption className="mt-10 flex items-center gap-4 border-t border-current/10 pt-6">
                      <div className="relative size-14 overflow-hidden rounded-full ring-2 ring-turquoise-400/60 ring-offset-2 ring-offset-transparent">
                        <SmartImage src={t.avatar} alt={t.name} fill sizes="56px" className="object-cover" />
                      </div>
                      <div>
                        <p className="font-semibold">{t.name}</p>
                        <p className={cn("text-sm", current === i ? "text-white/60" : "text-muted-foreground")}>
                          {t.role} · <span className="text-turquoise-500">{t.treatment}</span>
                        </p>
                      </div>
                    </figcaption>
                  </figure>
                </CarouselItem>
              ))}
            </CarouselContent>

            <div className="mt-10 flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                {Array.from({ length: count }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => api?.scrollTo(i)}
                    aria-label={`Ir para depoimento ${i + 1}`}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-500",
                      current === i ? "w-10 bg-turquoise-500" : "w-4 bg-black/10 hover:bg-black/25"
                    )}
                  />
                ))}
              </div>
              <div className="flex gap-3">
                <CarouselPrevious />
                <CarouselNext />
              </div>
            </div>
          </Carousel>
        </Reveal>
      </div>
    </section>
  );
}
