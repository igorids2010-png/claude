"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Empresa, Fonte, SearchEvent } from "@/lib/types"
import { useMeusLeads } from "@/lib/leads"
import { SearchForm } from "@/components/search-form"
import { ScanProgress } from "@/components/scan-progress"
import { Results } from "@/components/results"
import { MyLeads } from "@/components/my-leads"

type Aba = "buscar" | "leads"

type Etapa =
  | { tipo: "form" }
  | {
      tipo: "carregando"
      percent: number
      message: string
      encontradas: number
      analisadas: number
      regioesProntas: number
      regioesTotal: number
    }
  | {
      tipo: "resultado"
      fonte: Fonte
      cidade: string
      nichos: string[]
      quantidade: number
      analisadas: number
      empresas: Empresa[]
      regioesSemResposta: number
    }
  | { tipo: "erro"; message: string }

const CARREGANDO_INICIAL: Etapa = {
  tipo: "carregando",
  percent: 0,
  message: "Preparando a busca…",
  encontradas: 0,
  analisadas: 0,
  regioesProntas: 0,
  regioesTotal: 9,
}

export default function Home() {
  const [aba, setAba] = useState<Aba>("buscar")
  const [cidade, setCidade] = useState("")
  const [nichos, setNichos] = useState<string[]>([])
  const [quantidade, setQuantidade] = useState(50)
  const [etapa, setEtapa] = useState<Etapa>({ tipo: "form" })
  const [aviso, setAviso] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const { leads, ids, adicionar, atualizar, remover } = useMeusLeads()

  // mantém a aba no endereço (#meus-leads) para o botão voltar e para favoritos
  useEffect(() => {
    const sincronizar = () => setAba(window.location.hash === "#meus-leads" ? "leads" : "buscar")
    sincronizar()
    window.addEventListener("hashchange", sincronizar)
    return () => window.removeEventListener("hashchange", sincronizar)
  }, [])

  const irPara = (nova: Aba) => {
    window.location.hash = nova === "leads" ? "meus-leads" : ""
    setAba(nova)
    window.scrollTo({ top: 0 })
  }

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

  const marcarContatado = useCallback(
    (empresa: Empresa) => {
      adicionar(empresa, etapa.tipo === "resultado" ? etapa.cidade : cidade)
      setAviso("Salvo em Meus leads!")
    },
    [adicionar, etapa, cidade],
  )

  const procurar = async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setEtapa(CARREGANDO_INICIAL)
    window.scrollTo({ top: 0 })

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cidade: cidade.trim(), nichos, quantidade, excluir: [...ids] }),
        signal: controller.signal,
      })
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
            const { type: _, ...dados } = evento
            setEtapa({ tipo: "carregando", ...dados })
          } else if (evento.type === "result") {
            const { type: _, ...dados } = evento
            setEtapa({ tipo: "resultado", ...dados })
            terminou = true
          } else if (evento.type === "error") {
            setEtapa({ tipo: "erro", message: evento.message })
            terminou = true
          }
        }
      }

      if (!terminou) {
        throw new Error(
          "O servidor encerrou a busca antes de terminar (provavelmente o mapa demorou demais para responder). Tente de novo em instantes.",
        )
      }
    } catch (err) {
      if (controller.signal.aborted) return
      setEtapa({ tipo: "erro", message: err instanceof Error ? err.message : "Algo deu errado na busca." })
    }
  }

  const cancelar = () => {
    abortRef.current?.abort()
    setEtapa({ tipo: "form" })
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line/70 bg-ink/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[960px] items-center justify-between gap-3 px-4 sm:px-6">
          <button type="button" onClick={() => irPara("buscar")} className="flex items-center gap-2.5" aria-label="Início">
            <Marca />
            <span className="hidden font-display text-lg font-bold tracking-tight sm:inline">
              Radar <span className="text-accent-soft">Sem Site</span>
            </span>
          </button>
          <nav className="flex rounded-2xl border border-line bg-panel p-1" aria-label="Menu principal">
            <AbaBotao ativa={aba === "buscar"} onClick={() => irPara("buscar")}>
              Buscar leads
            </AbaBotao>
            <AbaBotao ativa={aba === "leads"} onClick={() => irPara("leads")}>
              Meus leads
              {leads.length > 0 && (
                <span
                  className={`ml-1.5 rounded-full px-1.5 font-mono text-[0.7rem] tabular-nums ${
                    aba === "leads" ? "bg-white/20" : "bg-accent/20 text-accent-soft"
                  }`}
                >
                  {leads.length}
                </span>
              )}
            </AbaBotao>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[960px] flex-col px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
        {aba === "leads" ? (
          <MyLeads
            leads={leads}
            onAtualizar={atualizar}
            onRemover={remover}
            onCopy={copiar}
            onIrParaBusca={() => irPara("buscar")}
          />
        ) : (
          <>
            {etapa.tipo === "form" && (
              <div className="animate-rise flex flex-col gap-8">
                <div className="flex flex-col items-center gap-4 pt-2 text-center sm:pt-6">
                  <h1 className="font-display text-[clamp(3rem,10.5vw,6.2rem)] font-extrabold leading-[0.92] tracking-[-0.035em]">
                    Radar <span className="bg-gradient-to-r from-accent to-accent-soft bg-clip-text text-transparent">Sem Site</span>
                  </h1>
                  <p className="max-w-md text-lg text-muted text-balance">
                    Encontre empresas da sua cidade que ainda não têm site — prontas para você oferecer um.
                  </p>
                </div>
                <SearchForm
                  cidade={cidade}
                  nichos={nichos}
                  quantidade={quantidade}
                  onCidade={setCidade}
                  onNichos={setNichos}
                  onQuantidade={setQuantidade}
                  onSubmit={procurar}
                />
              </div>
            )}

            {etapa.tipo === "carregando" && (
              <ScanProgress
                {...etapa}
                quantidade={quantidade}
                cidade={cidade}
                nichos={nichos}
                onCancel={cancelar}
              />
            )}

            {etapa.tipo === "resultado" && (
              <Results
                {...etapa}
                idsSalvos={ids}
                onNewSearch={() => setEtapa({ tipo: "form" })}
                onCopy={copiar}
                onMarcarContatado={marcarContatado}
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
                    className="rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white hover:brightness-110"
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
          </>
        )}
      </main>

      <div
        aria-live="polite"
        className={`fixed inset-x-0 bottom-6 z-50 mx-auto w-fit rounded-full border border-line bg-panel-2 px-5 py-3 text-sm font-semibold shadow-2xl shadow-black/70 transition duration-300 ${
          aviso ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <span className="mr-2 text-ok">✓</span>
        {aviso}
      </div>
    </>
  )
}

function AbaBotao({ ativa, onClick, children }: { ativa: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={ativa ? "page" : undefined}
      className={`flex items-center rounded-xl px-3.5 py-2 text-sm font-semibold transition sm:px-4 ${
        ativa ? "bg-accent text-white shadow-[0_0_20px_-6px_rgb(47_124_255/0.9)]" : "text-muted hover:text-fg"
      }`}
    >
      {children}
    </button>
  )
}

function Marca() {
  return (
    <span
      aria-hidden
      className="relative grid size-9 shrink-0 place-items-center rounded-xl border border-accent/40 bg-accent/10 shadow-[0_0_20px_-8px_rgb(47_124_255/0.9)]"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8cb8ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4.5 4.5" />
        <circle cx="11" cy="11" r="1.6" fill="#2f7cff" stroke="none" />
      </svg>
    </span>
  )
}
