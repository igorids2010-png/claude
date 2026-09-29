"use client"

import { useMemo, useState } from "react"
import { GRID_SIZE, type Empresa, type Fonte } from "@/lib/types"
import { baixarArquivo, gerarCsv, normalizar, slug, textoTodas } from "@/lib/format"
import { CompanyCard } from "@/components/company-card"

const NOME_FONTE: Record<Fonte, string> = { google: "Google Maps", osm: "OpenStreetMap" }

type Props = {
  fonte: Fonte
  cidade: string
  nichos: string[]
  quantidade: number
  analisadas: number
  empresas: Empresa[]
  regioesSemResposta: number
  idsSalvos: Set<string>
  onNewSearch: () => void
  onCopy: (texto: string, aviso: string) => void
  onMarcarContatado: (empresa: Empresa) => void
}

export function Results(props: Props) {
  const { fonte, cidade, nichos, quantidade, analisadas, empresas, regioesSemResposta, idsSalvos } = props
  const { onNewSearch, onCopy, onMarcarContatado } = props
  const [filtro, setFiltro] = useState("")
  const [nichoAtivo, setNichoAtivo] = useState<string | null>(null)
  const [esconderSalvos, setEsconderSalvos] = useState(false)

  const visiveis = useMemo(() => {
    const busca = normalizar(filtro)
    return empresas.filter(
      (e) =>
        (!nichoAtivo || e.nicho === nichoAtivo) &&
        (!esconderSalvos || !idsSalvos.has(e.id)) &&
        (!busca || normalizar(`${e.nome} ${e.endereco}`).includes(busca)),
    )
  }, [empresas, filtro, nichoAtivo, esconderSalvos, idsSalvos])

  const contatados = empresas.filter((e) => idsSalvos.has(e.id)).length
  const faltaram = empresas.length < quantidade

  return (
    <section className="animate-rise flex flex-col gap-6">
      <div className="flex flex-col gap-5 rounded-[28px] border border-line bg-panel/85 p-5 backdrop-blur sm:p-7">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-accent-soft">
            Resultado da busca
          </span>
          <h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-balance sm:text-4xl">
            <span className="tabular-nums text-accent-soft">{empresas.length}</span>{" "}
            {empresas.length === 1 ? "lead sem site" : "leads sem site"}
            {faltaram && <span className="text-muted"> de {quantidade}</span>}
          </h2>
          <p className="text-muted">
            {cidade} · <span className="font-mono tabular-nums text-fg">{analisadas}</span> empresas analisadas no{" "}
            {NOME_FONTE[fonte]}
          </p>
        </div>

        {faltaram && analisadas > 0 && (
          <Aviso tom="neutro">
            <b className="text-fg">O mapa não tinha {quantidade} empresas sem site</b> para esses nichos em {cidade}. Para
            achar mais, adicione nichos parecidos ou busque numa cidade vizinha.
          </Aviso>
        )}
        {regioesSemResposta > 0 && (
          <Aviso tom="perigo">
            <b className="text-danger">Busca incompleta.</b> {regioesSemResposta} de {GRID_SIZE * GRID_SIZE} regiões da
            cidade não responderam a tempo. Faça a busca de novo para tentar completar.
          </Aviso>
        )}
        {fonte === "osm" && (
          <Aviso tom="info">
            <b className="text-accent-soft">Fonte gratuita (OpenStreetMap).</b> Algumas empresas podem ter site que não
            foi cadastrado no mapa. Confira no botão “Conferir no Maps” antes de entrar em contato.
          </Aviso>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={visiveis.length === 0}
            onClick={() => onCopy(textoTodas(visiveis), `${visiveis.length} empresas copiadas!`)}
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-40"
          >
            Copiar todas
          </button>
          <button
            type="button"
            disabled={visiveis.length === 0}
            onClick={() => baixarArquivo(gerarCsv(visiveis), `leads-sem-site-${slug(cidade)}.csv`)}
            className="rounded-xl border border-line bg-panel-2 px-4 py-2.5 text-sm font-semibold transition hover:border-accent/50 disabled:opacity-40"
          >
            Baixar CSV
          </button>
          <button
            type="button"
            onClick={onNewSearch}
            className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-muted transition hover:border-accent/50 hover:text-fg sm:ml-auto"
          >
            ← Nova busca
          </button>
        </div>

        {empresas.length > 0 && (
          <div className="flex flex-col gap-3">
            <input
              type="search"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Filtrar por nome ou bairro…"
              aria-label="Filtrar empresas por nome ou bairro"
              className="h-11 w-full rounded-xl border border-line bg-panel-2 px-4 text-sm outline-none transition placeholder:text-dim focus:border-accent focus-visible:outline-none"
            />
            <div className="flex flex-wrap items-center gap-2">
              {nichos.length > 1 &&
                [null, ...nichos].map((n) => (
                  <button
                    key={n ?? "todos"}
                    type="button"
                    aria-pressed={nichoAtivo === n}
                    onClick={() => setNichoAtivo(n)}
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      nichoAtivo === n
                        ? "border-accent bg-accent text-white"
                        : "border-line bg-panel-2 text-muted hover:border-accent/50 hover:text-fg"
                    }`}
                  >
                    {n ?? "Todos os nichos"} ({n ? empresas.filter((e) => e.nicho === n).length : empresas.length})
                  </button>
                ))}
              {contatados > 0 && (
                <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={esconderSalvos}
                    onChange={(e) => setEsconderSalvos(e.target.checked)}
                    className="size-4 accent-[#2f7cff]"
                  />
                  Esconder os {contatados} já contatados
                </label>
              )}
            </div>
          </div>
        )}
      </div>

      {empresas.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-line px-6 py-14 text-center">
          <p className="font-display text-xl font-semibold">
            {analisadas === 0 ? "Nenhuma empresa desses nichos no mapa." : "Todo mundo aqui já tem site."}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            {analisadas === 0
              ? `O ${NOME_FONTE[fonte]} não tem empresas desses nichos cadastradas em ${cidade}. Tente nichos parecidos ou uma cidade maior.`
              : `Nenhuma das ${analisadas} empresas encontradas em ${cidade} está sem site (ou você já contatou todas). Tente outros nichos.`}
          </p>
        </div>
      ) : visiveis.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">Nenhuma empresa corresponde aos filtros.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visiveis.map((empresa, i) => (
            <CompanyCard
              key={empresa.id}
              empresa={empresa}
              fonte={fonte}
              index={i}
              salvo={idsSalvos.has(empresa.id)}
              onCopy={onCopy}
              onMarcarContatado={onMarcarContatado}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function Aviso({ tom, children }: { tom: "info" | "perigo" | "neutro"; children: React.ReactNode }) {
  const estilos = {
    info: "border-accent/30 bg-accent/[0.06]",
    perigo: "border-danger/35 bg-danger/[0.06]",
    neutro: "border-line bg-panel-2/60",
  }
  return <p className={`rounded-2xl border px-4 py-3 text-sm leading-relaxed text-muted ${estilos[tom]}`}>{children}</p>
}
