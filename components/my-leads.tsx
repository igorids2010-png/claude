"use client"

import { useMemo, useState } from "react"
import { STATUS_LEAD, type LeadSalvo, type StatusLead } from "@/lib/leads"
import { baixarArquivo, formatarData, gerarCsvLeads, linkWhatsApp, normalizar, textoEmpresa } from "@/lib/format"
import { Icone } from "@/components/company-card"

type Props = {
  leads: LeadSalvo[]
  onAtualizar: (id: string, mudanca: Partial<Pick<LeadSalvo, "status" | "observacao">>) => void
  onRemover: (id: string) => void
  onCopy: (texto: string, aviso: string) => void
  onIrParaBusca: () => void
}

const rotuloStatus = (s: StatusLead) => STATUS_LEAD.find((x) => x.id === s)?.rotulo ?? s

export function MyLeads({ leads, onAtualizar, onRemover, onCopy, onIrParaBusca }: Props) {
  const [status, setStatus] = useState<StatusLead | null>(null)
  const [filtro, setFiltro] = useState("")

  const contagem = useMemo(() => {
    const c = Object.fromEntries(STATUS_LEAD.map((s) => [s.id, 0])) as Record<StatusLead, number>
    for (const l of leads) c[l.status]++
    return c
  }, [leads])

  const visiveis = useMemo(() => {
    const busca = normalizar(filtro)
    return leads.filter(
      (l) =>
        (!status || l.status === status) &&
        (!busca || normalizar(`${l.nome} ${l.nicho} ${l.cidade} ${l.endereco} ${l.observacao}`).includes(busca)),
    )
  }, [leads, status, filtro])

  if (leads.length === 0) {
    return (
      <section className="animate-rise flex flex-col items-center gap-4 rounded-[28px] border border-dashed border-line px-6 py-16 text-center">
        <span className="grid size-14 place-items-center rounded-2xl border border-accent/40 bg-accent/10 text-accent-soft">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.2A8.4 8.4 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3h.5a8.5 8.5 0 0 1 8 8v.5z" />
          </svg>
        </span>
        <h2 className="font-display text-2xl font-bold">Nenhum lead salvo ainda</h2>
        <p className="max-w-md text-sm leading-relaxed text-muted">
          Quando você mandar mensagem para uma empresa, toque em <b className="text-fg">“Mandei mensagem”</b> no card dela.
          Ela aparece aqui para você acompanhar quem respondeu, quem está negociando e quem fechou.
        </p>
        <button
          type="button"
          onClick={onIrParaBusca}
          className="mt-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
        >
          Buscar leads
        </button>
      </section>
    )
  }

  return (
    <section className="animate-rise flex flex-col gap-6">
      <div className="flex flex-col gap-5 rounded-[28px] border border-line bg-panel/85 p-5 backdrop-blur sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-accent-soft">
              Empresas que você já contatou
            </span>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              <span className="tabular-nums text-accent-soft">{leads.length}</span> {leads.length === 1 ? "lead" : "leads"}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => baixarArquivo(gerarCsvLeads(visiveis, rotuloStatus), "meus-leads.csv")}
            className="rounded-xl border border-line bg-panel-2 px-4 py-2.5 text-sm font-semibold transition hover:border-accent/50"
          >
            Baixar CSV
          </button>
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {[null, ...STATUS_LEAD.map((s) => s.id)].map((id) => {
            const ativo = status === id
            return (
              <button
                key={id ?? "todos"}
                type="button"
                aria-pressed={ativo}
                onClick={() => setStatus(id)}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition ${
                  ativo ? "border-accent bg-accent text-white" : "border-line bg-panel-2 text-muted hover:text-fg"
                }`}
              >
                {id ? rotuloStatus(id) : "Todos"}{" "}
                <span className={`font-mono text-xs tabular-nums ${ativo ? "text-white/75" : "text-dim"}`}>
                  {id ? contagem[id] : leads.length}
                </span>
              </button>
            )
          })}
        </div>

        <input
          type="search"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Buscar por nome, nicho, cidade ou anotação…"
          aria-label="Buscar nos meus leads"
          className="h-11 w-full rounded-xl border border-line bg-panel-2 px-4 text-sm outline-none transition placeholder:text-dim focus:border-accent focus-visible:outline-none"
        />
      </div>

      {visiveis.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">Nenhum lead com esses filtros.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visiveis.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onAtualizar={onAtualizar} onRemover={onRemover} onCopy={onCopy} />
          ))}
        </div>
      )}

      <p className="text-center text-xs text-dim">
        Seus leads ficam salvos neste navegador. Baixe o CSV de vez em quando para ter uma cópia.
      </p>
    </section>
  )
}

function LeadCard({
  lead,
  onAtualizar,
  onRemover,
  onCopy,
}: {
  lead: LeadSalvo
  onAtualizar: Props["onAtualizar"]
  onRemover: Props["onRemover"]
  onCopy: Props["onCopy"]
}) {
  const [observacao, setObservacao] = useState(lead.observacao)
  const whatsapp = linkWhatsApp(lead.telefone)
  const estilo = STATUS_LEAD.find((s) => s.id === lead.status)

  return (
    <article className="flex flex-col gap-4 rounded-3xl border border-line bg-panel p-5">
      <header className="flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-semibold leading-snug text-balance">{lead.nome}</h3>
          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[0.7rem] font-semibold ${estilo?.classe}`}>
            {estilo?.rotulo}
          </span>
        </div>
        <p className="text-xs text-muted">
          {lead.nicho} · {lead.cidade} · contatado em {formatarData(lead.contatadoEm)}
        </p>
      </header>

      <div className="flex flex-col gap-3 text-sm">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <Icone tipo="telefone" />
          {lead.telefone ? (
            <>
              <span className="font-mono tabular-nums">{lead.telefone}</span>
              {whatsapp && (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md border border-ok/40 bg-ok/10 px-2 py-0.5 font-mono text-[0.68rem] font-medium text-ok hover:bg-ok/20"
                >
                  WhatsApp ↗
                </a>
              )}
            </>
          ) : (
            <span className="text-dim">Telefone não informado</span>
          )}
        </div>
        {lead.endereco && (
          <div className="flex items-start gap-3">
            <Icone tipo="endereco" />
            <span className="leading-relaxed text-muted">{lead.endereco}</span>
          </div>
        )}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-dim">Status</span>
        <select
          value={lead.status}
          onChange={(e) => onAtualizar(lead.id, { status: e.target.value as StatusLead })}
          className="h-10 rounded-xl border border-line bg-panel-2 px-3 text-sm outline-none focus:border-accent"
        >
          {STATUS_LEAD.map((s) => (
            <option key={s.id} value={s.id}>
              {s.rotulo}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-dim">Anotações</span>
        <textarea
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          onBlur={() => observacao !== lead.observacao && onAtualizar(lead.id, { observacao })}
          rows={2}
          placeholder="Ex.: falei com a Ana, pediu orçamento para segunda"
          className="resize-y rounded-xl border border-line bg-panel-2 px-3 py-2 text-sm outline-none placeholder:text-dim focus:border-accent"
        />
      </label>

      <footer className="mt-auto grid grid-cols-3 gap-2 border-t border-line pt-4">
        <button
          type="button"
          onClick={() => onCopy(textoEmpresa(lead), "Dados copiados!")}
          className="rounded-xl bg-accent px-2 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
        >
          Copiar
        </button>
        {lead.linkMaps ? (
          <a
            href={lead.linkMaps}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-line bg-panel-2 px-2 py-2.5 text-center text-sm font-semibold transition hover:border-accent/50"
          >
            Maps ↗
          </a>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Remover “${lead.nome}” dos seus leads?`)) onRemover(lead.id)
          }}
          className="rounded-xl border border-line px-2 py-2.5 text-sm font-semibold text-muted transition hover:border-danger/50 hover:text-danger"
        >
          Remover
        </button>
      </footer>
    </article>
  )
}
