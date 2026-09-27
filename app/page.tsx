"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Empresa, SearchEvent } from "@/lib/places"
import { CAPITAIS, CIDADES_GRANDES, NICHOS } from "@/lib/sugestoes"
import { Combobox } from "@/components/combobox"
import { ScanProgress } from "@/components/scan-progress"
import { Results } from "@/components/results"

type Etapa =
  | { tipo: "form" }
  | { tipo: "carregando"; percent: number; message: string; encontradas: number }
  | { tipo: "resultado"; cidade: string; nicho: string; analisadas: number; empresas: Empresa[] }
  | { tipo: "erro"; message: string }

const GRUPOS_CIDADES = [
  { titulo: "Capitais", itens: CAPITAIS },
  { titulo: "Outras cidades grandes", itens: CIDADES_GRANDES },
]
const GRUPOS_NICHOS = [{ titulo: "Nichos populares", itens: NICHOS }]

const PASSOS = [
  { titulo: "Escolha cidade e nicho", texto: "Qualquer cidade do Brasil, qualquer tipo de negócio." },
  { titulo: "O radar varre o Google Maps", texto: "A cidade é dividida em regiões para trazer o máximo de empresas." },
  { titulo: "Copie quem não tem site", texto: "Telefone, endereço e link prontos para você entrar em contato." },
]

export default function Home() {
  const [cidade, setCidade] = useState("")
  const [nicho, setNicho] = useState("")
  const [etapa, setEtapa] = useState<Etapa>({ tipo: "form" })
  const [aviso, setAviso] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), 1800)
    return () => clearTimeout(t)
  }, [aviso])

  const copiar = useCallback(async (texto: string, mensagem: string) => {
    try {
      await navigator.clipboard.writeText(texto)
      setAviso(mensagem)
    } catch {
      setAviso("Não foi possível copiar — selecione o texto manualmente.")
    }
  }, [])

  const procurar = async () => {
    const c = cidade.trim()
    const n = nicho.trim()
    if (!c || !n) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setEtapa({ tipo: "carregando", percent: 0, message: "Ligando o radar…", encontradas: 0 })

    try {
      const params = new URLSearchParams({ cidade: c, nicho: n })
      const response = await fetch(`/api/search?${params}`, { signal: controller.signal })
      if (!response.body) throw new Error("O servidor não respondeu.")

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let terminou = false

      while (!terminou) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const linhas = buffer.split("\n")
        buffer = linhas.pop() ?? ""

        for (const linha of linhas) {
          if (!linha.trim()) continue
          const evento = JSON.parse(linha) as SearchEvent
          if (evento.type === "progress") {
            setEtapa({ tipo: "carregando", percent: evento.percent, message: evento.message, encontradas: evento.encontradas })
          } else if (evento.type === "result") {
            setEtapa({ tipo: "resultado", ...evento })
            terminou = true
          } else if (evento.type === "error") {
            setEtapa({ tipo: "erro", message: evento.message })
            terminou = true
          }
        }
      }

      if (!terminou) throw new Error("A busca foi interrompida antes de terminar.")
    } catch (err) {
      if (controller.signal.aborted) return
      setEtapa({ tipo: "erro", message: err instanceof Error ? err.message : "Algo deu errado na busca." })
    }
  }

  const cancelar = () => {
    abortRef.current?.abort()
    setEtapa({ tipo: "form" })
  }

  const compacto = etapa.tipo !== "form"

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[920px] flex-col px-4 pb-20 pt-10 sm:px-6 sm:pt-16">
      <header className={`flex flex-col ${compacto ? "mb-8 items-start" : "mb-10 items-center text-center sm:mb-12"}`}>
        {compacto ? (
          <button
            type="button"
            onClick={cancelar}
            className="flex items-center gap-3 rounded-full pr-3 text-left"
            aria-label="Voltar ao início"
          >
            <RadarMark small />
            <span className="font-display text-2xl font-bold tracking-tight">
              Radar <span className="text-signal">Sem Site</span>
            </span>
          </button>
        ) : (
          <>
            <RadarMark />
            <h1 className="mt-6 font-display text-[clamp(3.2rem,11vw,6.5rem)] font-extrabold leading-[0.92] tracking-[-0.035em]">
              Radar <span className="text-signal">Sem Site</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted text-balance">
              Encontre empresas no Google Maps que ainda não têm site.
            </p>
          </>
        )}
      </header>

      {etapa.tipo === "form" && (
        <div className="animate-rise flex flex-col gap-10">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              procurar()
            }}
            className="flex flex-col gap-5 rounded-[28px] border border-line bg-panel/80 p-5 shadow-2xl shadow-black/30 backdrop-blur sm:p-7"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Combobox
                label="Cidade"
                placeholder="Digite ou escolha a cidade"
                value={cidade}
                onChange={setCidade}
                grupos={GRUPOS_CIDADES}
                icon={<PinGlyph />}
              />
              <Combobox
                label="Nicho"
                placeholder="Ex: lanchonetes, dentistas…"
                value={nicho}
                onChange={setNicho}
                grupos={GRUPOS_NICHOS}
                icon={<ShopGlyph />}
              />
            </div>
            <button
              type="submit"
              disabled={!cidade.trim() || !nicho.trim()}
              className="h-14 rounded-2xl bg-signal text-base font-bold text-[#1a0d05] shadow-[0_10px_30px_-10px_rgb(255_122_69/0.7)] transition hover:brightness-110 active:translate-y-px disabled:cursor-not-allowed disabled:bg-panel-2 disabled:text-dim disabled:shadow-none"
            >
              Procurar empresas
            </button>
          </form>

          <ol className="grid gap-3 sm:grid-cols-3">
            {PASSOS.map((passo, i) => (
              <li key={passo.titulo} className="flex gap-3 rounded-2xl border border-line/70 p-4">
                <span className="font-mono text-sm font-semibold text-signal">{i + 1}</span>
                <div>
                  <p className="text-sm font-semibold">{passo.titulo}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{passo.texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {etapa.tipo === "carregando" && (
        <ScanProgress
          percent={etapa.percent}
          message={etapa.message}
          encontradas={etapa.encontradas}
          cidade={cidade}
          nicho={nicho}
          onCancel={cancelar}
        />
      )}

      {etapa.tipo === "resultado" && (
        <Results
          cidade={etapa.cidade}
          nicho={etapa.nicho}
          analisadas={etapa.analisadas}
          empresas={etapa.empresas}
          onNewSearch={() => setEtapa({ tipo: "form" })}
          onCopy={copiar}
        />
      )}

      {etapa.tipo === "erro" && (
        <section
          role="alert"
          className="animate-rise mx-auto flex max-w-lg flex-col items-center gap-4 rounded-[28px] border border-danger/40 bg-panel px-6 py-10 text-center"
        >
          <p className="font-display text-2xl font-semibold">A busca não deu certo</p>
          <p className="text-sm leading-relaxed text-muted">{etapa.message}</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={procurar}
              className="rounded-xl bg-signal px-5 py-2.5 text-sm font-bold text-[#1a0d05] hover:brightness-110"
            >
              Tentar de novo
            </button>
            <button
              type="button"
              onClick={() => setEtapa({ tipo: "form" })}
              className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold text-muted hover:text-fg"
            >
              Voltar
            </button>
          </div>
        </section>
      )}

      <div
        aria-live="polite"
        className={`fixed inset-x-0 bottom-6 z-50 mx-auto w-fit rounded-full border border-line bg-panel-2 px-5 py-3 text-sm font-semibold shadow-2xl shadow-black/60 transition duration-300 ${
          aviso ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <span className="mr-2 text-ok">✓</span>
        {aviso}
      </div>
    </main>
  )
}

function RadarMark({ small = false }: { small?: boolean }) {
  return (
    <span
      aria-hidden
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-panel ${
        small ? "size-10" : "size-16"
      }`}
    >
      <span className="absolute inset-[22%] rounded-full border border-signal/35" />
      <span className="animate-sweep absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,rgb(255_122_69/0.45),transparent_30%)]" />
      <span className="relative size-1.5 rounded-full bg-signal shadow-[0_0_0_4px_rgb(255_122_69/0.18)]" />
    </span>
  )
}

function PinGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function ShopGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9 4.5 4h15L21 9" />
      <path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0V9Z" />
      <path d="M5 13v7h14v-7" />
    </svg>
  )
}
