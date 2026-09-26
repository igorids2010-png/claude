"use client";

import { useCallback, useRef, useState, type PointerEvent } from "react";
import { MoveHorizontal } from "lucide-react";
import { SmartImage } from "@/components/smart-image";

/** Comparador arrastável antes/depois (mouse, toque e teclado). */
export function BeforeAfterSlider({ image, alt }: { image: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50);
  const dragging = useRef(false);

  const update = useCallback((clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(100, Math.max(0, p)));
  }, []);

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    update(e.clientX);
  };

  return (
    <div
      ref={ref}
      onPointerDown={onDown}
      onPointerMove={(e) => dragging.current && update(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
      className="relative aspect-[16/10] w-full cursor-ew-resize touch-pan-y select-none overflow-hidden rounded-[2rem] bg-ink-soft"
    >
      {/* Depois */}
      <SmartImage src={image} alt={`${alt} — depois`} fill sizes="(min-width:1024px) 60vw, 100vw" className="object-cover" draggable={false} />
      {/* Antes (recortado) */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <SmartImage
          src={image}
          alt={`${alt} — antes`}
          fill
          sizes="(min-width:1024px) 60vw, 100vw"
          className="filter-before object-cover"
          draggable={false}
        />
      </div>

      <span className="absolute left-5 top-5 rounded-full bg-black/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md">
        Antes
      </span>
      <span className="absolute right-5 top-5 rounded-full bg-turquoise-500 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
        Depois
      </span>

      <div className="pointer-events-none absolute inset-y-0" style={{ left: `${pos}%` }}>
        <div className="absolute inset-y-0 -translate-x-1/2 border-l-2 border-white/90 shadow-[0_0_20px_rgba(0,0,0,0.4)]" />
        <div className="absolute top-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-ink shadow-2xl ring-4 ring-white/30">
          <MoveHorizontal className="size-5" />
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Comparar antes e depois"
        className="absolute inset-0 size-full cursor-ew-resize opacity-0"
        onPointerDown={(e) => e.stopPropagation()}
        tabIndex={0}
        style={{ pointerEvents: "none" }}
      />
    </div>
  );
}
