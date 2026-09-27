"use client"

import { useEffect, useRef, useState } from "react"

type Props = {
  percent: number
  message: string
  encontradas: number
  cidade: string
  nicho: string
  onCancel: () => void
}

const MAX_BLIPS = 14

// posições fixas (pseudo-aleatórias) para os pontos do radar não pularem a cada render
const BLIPS = Array.from({ length: MAX_BLIPS }, (_, i) => {
  const angle = (i * 137.5 * Math.PI) / 180
  const radius = 18 + ((i * 29) % 70) * 0.42
  return { x: 50 + Math.cos(angle) * radius, y: 50 + Math.sin(angle) * radius, delay: (i * 0.37) % 2.6 }
})

function useAnimatedNumber(target: number) {
  const [value, setValue] = useState(0)
  const fromRef = useRef(0)

  useEffect(() => {
    const from = fromRef.current
    const start = performance.now()
    const duration = 600
    let frame = 0

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const next = from + (target - from) * eased
      fromRef.current = next
      setValue(next)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target])

  return Math.round(value)
}

export function ScanProgress({ percent, message, encontradas, cidade, nicho, onCancel }: Props) {
  const shown = useAnimatedNumber(percent)
  const blips = Math.min(MAX_BLIPS, Math.ceil(encontradas / 6))

  return (
    <section
      aria-live="polite"
      aria-busy="true"
      className="animate-rise mx-auto flex w-full max-w-xl flex-col items-center gap-8 rounded-[28px] border border-line bg-panel/80 px-6 py-10 text-center backdrop-blur sm:px-10"
    >
      <div className="relative aspect-square w-56 sm:w-64" aria-hidden>
        <div className="absolute inset-0 rounded-full border border-line bg-[radial-gradient(circle,rgb(255_122_69/0.06),transparent_70%)]" />
        <div className="absolute inset-[16%] rounded-full border border-line/80" />
        <div className="absolute inset-[33%] rounded-full border border-line/70" />
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-line/60" />
        <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-line/60" />
        <div className="animate-sweep absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,rgb(255_122_69/0.55),rgb(255_122_69/0.08)_18%,transparent_30%)]" />
        {BLIPS.slice(0, blips).map((b, i) => (
          <span
            key={i}
            className="animate-blip absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal shadow-[0_0_12px_2px_rgb(255_122_69/0.7)]"
            style={{ left: `${b.x}%`, top: `${b.y}%`, animationDelay: `${b.delay}s` }}
          />
        ))}
        <span className="absolute left-1/2 top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal" />
      </div>

      <div className="flex flex-col items-center gap-1">
        <span className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-dim">Procurando</span>
        <span className="font-display text-7xl font-bold tabular-nums tracking-tight text-signal sm:text-8xl">
          {shown}
          <span className="text-4xl text-signal/60 sm:text-5xl">%</span>
        </span>
      </div>

      <div className="flex w-full flex-col gap-3">
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-panel-2"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={shown}
          aria-label="Progresso da busca"
        >
          <div
            className="h-full rounded-full bg-signal transition-[width] duration-500 ease-out"
            style={{ width: `${shown}%` }}
          />
        </div>
        <p className="font-mono text-sm text-muted">{message}</p>
      </div>

      <div className="flex flex-col items-center gap-1">
        <p className="text-sm text-muted">
          <span className="font-mono font-semibold tabular-nums text-fg">{encontradas}</span> empresas encontradas até
          agora
        </p>
        <p className="text-xs text-dim">
          {nicho} · {cidade}
        </p>
      </div>

      <button
        type="button"
        onClick={onCancel}
        className="rounded-full border border-line px-5 py-2 text-sm font-semibold text-muted transition hover:border-signal/50 hover:text-fg"
      >
        Cancelar
      </button>
    </section>
  )
}
