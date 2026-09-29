"use client"

import { useEffect, useRef, useState } from "react"

type Props = {
  percent: number
  message: string
  encontradas: number
  analisadas: number
  regioesProntas: number
  regioesTotal: number
  quantidade: number
  cidade: string
  nichos: string[]
  onCancel: () => void
}

const EM_PARALELO = 3
const MAX_PINOS = 36

// Ruas desenhadas com gradientes: cada região parece um pedaço de mapa.
const RUAS = [
  "linear-gradient(90deg, transparent 31%, rgb(140 184 255 / 0.10) 31% 33%, transparent 33%)",
  "linear-gradient(0deg, transparent 58%, rgb(140 184 255 / 0.10) 58% 60.5%, transparent 60.5%)",
  "linear-gradient(90deg, transparent 72%, rgb(140 184 255 / 0.07) 72% 73.5%, transparent 73.5%)",
  "linear-gradient(0deg, transparent 22%, rgb(140 184 255 / 0.07) 22% 23.5%, transparent 23.5%)",
  "linear-gradient(35deg, transparent 48%, rgb(140 184 255 / 0.08) 48% 50%, transparent 50%)",
].join(",")

// posições fixas por região para os alfinetes não pularem a cada atualização
function posicaoPino(regiao: number, i: number) {
  const semente = regiao * 97 + i * 131
  return { x: 14 + ((semente * 37) % 72), y: 22 + ((semente * 53) % 64) }
}

function useNumeroAnimado(alvo: number) {
  const [valor, setValor] = useState(0)
  const deRef = useRef(0)

  useEffect(() => {
    const de = deRef.current
    const inicio = performance.now()
    let frame = 0
    const passo = (agora: number) => {
      const t = Math.min(1, (agora - inicio) / 600)
      const atual = de + (alvo - de) * (1 - Math.pow(1 - t, 3))
      deRef.current = atual
      setValor(atual)
      if (t < 1) frame = requestAnimationFrame(passo)
    }
    frame = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(frame)
  }, [alvo])

  return Math.round(valor)
}

export function ScanProgress(props: Props) {
  const { percent, message, encontradas, analisadas, regioesProntas, regioesTotal, quantidade, cidade, nichos, onCancel } = props
  const mostrado = useNumeroAnimado(percent)
  const lado = Math.round(Math.sqrt(regioesTotal))

  // Distribui os alfinetes entre as regiões já varridas.
  const pinos = Math.min(MAX_PINOS, encontradas)
  const pinosPorRegiao = Array.from({ length: regioesTotal }, (_, r) =>
    r < regioesProntas ? Math.floor(pinos / Math.max(1, regioesProntas)) + (r < pinos % Math.max(1, regioesProntas) ? 1 : 0) : 0,
  )

  return (
    <section
      aria-live="polite"
      aria-busy="true"
      className="animate-rise mx-auto flex w-full max-w-2xl flex-col gap-7 rounded-[28px] border border-line bg-panel/85 p-5 backdrop-blur sm:p-8"
    >
      <div className="flex flex-col gap-1 text-center">
        <span className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-accent-soft">
          Procurando empresas sem site
        </span>
        <p className="text-sm text-muted">
          {nichos.join(" · ")} — {cidade}
        </p>
      </div>

      <div className="relative mx-auto aspect-square w-full max-w-[22rem]" aria-hidden>
        <div
          className="grid h-full w-full gap-1.5 rounded-3xl border border-line bg-ink p-1.5"
          style={{ gridTemplateColumns: `repeat(${lado}, 1fr)` }}
        >
          {Array.from({ length: regioesTotal }, (_, r) => {
            const pronta = r < regioesProntas
            const varrendo = !pronta && r < regioesProntas + EM_PARALELO
            return (
              <div
                key={r}
                className={`relative overflow-hidden rounded-xl border transition-colors duration-500 ${
                  pronta
                    ? "border-accent/35 bg-accent/[0.07]"
                    : varrendo
                      ? "border-accent/70 bg-panel-2"
                      : "border-line-soft bg-panel"
                }`}
                style={{ backgroundImage: RUAS }}
              >
                {varrendo && (
                  <div className="animate-scan absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-transparent via-accent/35 to-transparent" />
                )}
                {Array.from({ length: pinosPorRegiao[r] }, (_, i) => {
                  const p = posicaoPino(r, i)
                  return (
                    <span
                      key={i}
                      className="animate-pin absolute"
                      style={{ left: `${p.x}%`, top: `${p.y}%`, animationDelay: `${i * 70}ms` }}
                    >
                      <svg width="12" height="16" viewBox="0 0 12 16">
                        <path d="M6 0a6 6 0 0 1 6 6c0 4.2-6 10-6 10S0 10.2 0 6a6 6 0 0 1 6-6Z" fill="#2f7cff" />
                        <circle cx="6" cy="6" r="2.2" fill="#040506" />
                      </svg>
                    </span>
                  )
                })}
                {pronta && (
                  <span className="absolute right-1.5 top-1 font-mono text-[0.6rem] font-semibold text-accent-soft/80">✓</span>
                )}
              </div>
            )
          })}
        </div>

        {/* lupa passeando pelo mapa */}
        <div className="animate-lupa pointer-events-none absolute left-0 top-0 h-[28%] w-[28%]">
          <span className="animate-ping-soft absolute inset-[18%] rounded-full border border-accent/60" />
          <svg viewBox="0 0 64 64" className="relative h-full w-full drop-shadow-[0_0_14px_rgb(47_124_255/0.7)]">
            <circle cx="26" cy="26" r="18" fill="rgb(47 124 255 / 0.12)" stroke="#8cb8ff" strokeWidth="4" />
            <path d="M39 39 58 58" stroke="#8cb8ff" strokeWidth="6" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-4">
          <span className="font-display text-6xl font-bold leading-none tabular-nums tracking-tight text-fg sm:text-7xl">
            {mostrado}
            <span className="text-3xl text-accent-soft sm:text-4xl">%</span>
          </span>
          <div className="flex flex-col items-end gap-0.5 text-right">
            <span className="font-mono text-sm tabular-nums text-fg">
              <span className="font-semibold text-accent-soft">{encontradas}</span> / {quantidade} leads
            </span>
            <span className="font-mono text-xs tabular-nums text-dim">{analisadas} empresas analisadas</span>
          </div>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-panel-2"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={mostrado}
          aria-label="Progresso da busca"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-accent-soft shadow-[0_0_14px_rgb(47_124_255/0.8)] transition-[width] duration-500 ease-out"
            style={{ width: `${mostrado}%` }}
          />
        </div>
        <p className="font-mono text-sm text-muted">{message}</p>
      </div>

      <button
        type="button"
        onClick={onCancel}
        className="self-center rounded-full border border-line px-5 py-2 text-sm font-semibold text-muted transition hover:border-accent/50 hover:text-fg"
      >
        Cancelar
      </button>
    </section>
  )
}
