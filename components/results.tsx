"use client"

import { useMemo, useState } from "react"
import { GRID_SIZE, type Empresa, type Fonte } from "@/lib/types"
import { gerarCsv, normalizar, textoTodas } from "@/lib/format"
import { CompanyCard } from "@/components/company-card"

const NOME_FONTE: Record<Fonte, string> = { google: "Google Maps", osm: "OpenStreetMap" }

type Props = {
  fonte: Fonte
  regioesSemResposta: number
  cidade: string
  nicho: string
  analisadas: number
  empresas: Empresa[]
  onNewSearch: () => void
  onCopy: (texto: string, aviso: string) => void
}

function nomeArquivo(cidade: string, nicho: string) {
  const slug = normalizar(`${nicho} ${cidade}`).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  return `sem-site-${slug}.csv`
}

export function Results({ fonte, regioesSemResposta, cidade, nicho, analisadas, empresas, onNewSearch, onCopy }: Props) {
  const [filtro, setFiltro] = useState("")

  const visiveis = useMemo(() => {
    const busca = normalizar(filtro)
    if (!busca) return empresas
    return empresas.filter((e) => normalizar(`${e.nome} ${e.endereco}`).includes(busca))
  }, [empresas, filtro])

  const baixarCsv = () => {
    const blob = new Blob([gerarCsv(visiveis, nicho)], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = nomeArquivo(cidade, nicho)
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="animate-rise flex flex-col gap-6">
      <div className="flex flex-col gap-5 rounded-[28px] border border-line bg-panel/80 p-6 backdrop-blur sm:p-7">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-dim">Resultado da varredura</span>
          <h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-balance sm:text-4xl">
            <span className="text-signal tabular-nums">{empresas.length}</span>{" "}
            {empresas.length === 1 ? "empresa sem site" : "empresas sem site"}
          </h2>
          <p className="text-muted">
            {nicho} em {cidade} ·{" "}
            <span className="font-mono tabular-nums text-fg">{analisadas}</span> analisadas no {NOME_FONTE[fonte]}
          </p>
        </div>

        {regioesSemResposta > 0 && (
          <p className="rounded-2xl border border-danger/35 bg-danger/[0.06] px-4 py-3 text-sm leading-relaxed text-muted">
            <span className="font-semibold text-danger">Busca incompleta.</span> {regioesSemResposta} de {GRID_SIZE * GRID_SIZE} regiões da
            cidade não responderam a tempo, então podem faltar empresas. Faça uma nova busca para tentar completar.
          </p>
        )}

        {fonte === "osm" && (
          <p className="rounded-2xl border border-star/30 bg-star/[0.06] px-4 py-3 text-sm leading-relaxed text-muted">
            <span className="font-semibold text-star">Fonte gratuita (OpenStreetMap).</span> Algumas empresas podem ter
            site que não foi cadastrado no mapa. Antes de entrar em contato, confira no botão{" "}
            <span className="text-fg">“Conferir no Google Maps”</span>.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={visiveis.length === 0}
            onClick={() => onCopy(textoTodas(visiveis, nicho), `${visiveis.length} empresas copiadas!`)}
            className="rounded-xl bg-signal px-4 py-2.5 text-sm font-bold text-[#1a0d05] transition hover:brightness-110 disabled:opacity-40"
          >
            Copiar todas
          </button>
          <button
            type="button"
            disabled={visiveis.length === 0}
            onClick={baixarCsv}
            className="rounded-xl border border-line bg-panel-2 px-4 py-2.5 text-sm font-semibold transition hover:border-signal/50 disabled:opacity-40"
          >
            Baixar CSV
          </button>
          <button
            type="button"
            onClick={onNewSearch}
            className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-muted transition hover:border-signal/50 hover:text-fg sm:ml-auto"
          >
            ← Nova busca
          </button>
        </div>

        {empresas.length > 0 && (
          <input
            type="search"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Filtrar por nome ou bairro…"
            aria-label="Filtrar empresas por nome ou bairro"
            className="h-11 w-full rounded-xl border border-line bg-panel-2 px-4 text-sm outline-none transition placeholder:text-dim focus:border-signal-soft"
          />
        )}
      </div>

      {analisadas === 0 ? (
        <div className="rounded-[28px] border border-dashed border-line px-6 py-14 text-center">
          <p className="font-display text-xl font-semibold">Nenhuma empresa desse nicho no mapa.</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            O {NOME_FONTE[fonte]} não tem {nicho.toLowerCase()} cadastrados em {cidade}. Tente um nicho parecido (ex:
            “restaurantes” em vez de “hamburguerias”) ou uma cidade maior.
          </p>
        </div>
      ) : empresas.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-line px-6 py-14 text-center">
          <p className="font-display text-xl font-semibold">Todo mundo aqui já tem site.</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Nenhuma das {analisadas} empresas de {nicho.toLowerCase()} em {cidade} está sem site. Tente outro nicho ou uma
            cidade vizinha.
          </p>
        </div>
      ) : visiveis.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">Nenhuma empresa corresponde a “{filtro}”.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visiveis.map((empresa, i) => (
            <CompanyCard key={empresa.id} empresa={empresa} fonte={fonte} nicho={nicho} index={i} onCopy={onCopy} />
          ))}
        </div>
      )}
    </section>
  )
}
