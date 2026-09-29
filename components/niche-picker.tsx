"use client"

import { useMemo, useState } from "react"
import { GRUPOS_NICHOS } from "@/lib/nichos"
import { normalizar } from "@/lib/format"
import { MAX_NICHOS } from "@/lib/types"

type Props = {
  selecionados: string[]
  onChange: (nichos: string[]) => void
}

const TODOS_NOMES = GRUPOS_NICHOS.flatMap((g) => g.nichos.map((n) => n.nome))

export function NichePicker({ selecionados, onChange }: Props) {
  const [filtro, setFiltro] = useState("")
  const cheio = selecionados.length >= MAX_NICHOS

  const grupos = useMemo(() => {
    const busca = normalizar(filtro)
    if (!busca) return GRUPOS_NICHOS
    return GRUPOS_NICHOS.map((g) => ({
      ...g,
      nichos: g.nichos.filter((n) => normalizar(n.nome).includes(busca) || normalizar(g.titulo).includes(busca)),
    })).filter((g) => g.nichos.length > 0)
  }, [filtro])

  const textoLivre = filtro.trim()
  const podeAdicionarLivre =
    textoLivre.length >= 3 &&
    !TODOS_NOMES.some((nome) => normalizar(nome) === normalizar(textoLivre)) &&
    !selecionados.some((s) => normalizar(s) === normalizar(textoLivre))

  const alternar = (nome: string) => {
    if (selecionados.includes(nome)) onChange(selecionados.filter((s) => s !== nome))
    else if (!cheio) onChange([...selecionados, nome])
  }

  const adicionarLivre = () => {
    if (!podeAdicionarLivre || cheio) return
    onChange([...selecionados, textoLivre])
    setFiltro("")
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="filtro-nichos" className="text-sm font-semibold text-fg">
          Filtrar nichos
        </label>
        <input
          id="filtro-nichos"
          type="search"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              if (podeAdicionarLivre) adicionarLivre()
            }
          }}
          placeholder="Ex.: dentista, academia, oficina"
          autoComplete="off"
          className="h-12 w-full rounded-xl border border-line bg-panel-2 px-4 text-[0.95rem] outline-none transition placeholder:text-dim focus:border-accent focus:shadow-[0_0_0_4px_rgb(47_124_255/0.18)] focus-visible:outline-none"
        />
        <p className="text-xs text-muted">
          Selecione até {MAX_NICHOS} nichos. A quantidade de leads vale para a busca inteira.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2" aria-live="polite">
        <span className="font-mono text-xs tabular-nums text-muted">
          {selecionados.length}/{MAX_NICHOS} selecionados
        </span>
        {selecionados.map((nome) => (
          <button
            key={nome}
            type="button"
            onClick={() => alternar(nome)}
            className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white shadow-[0_0_16px_-4px_rgb(47_124_255/0.8)] transition hover:brightness-110"
            aria-label={`Remover ${nome}`}
          >
            {nome}
            <span aria-hidden className="text-white/70">
              ×
            </span>
          </button>
        ))}
      </div>

      {podeAdicionarLivre && (
        <button
          type="button"
          onClick={adicionarLivre}
          disabled={cheio}
          className="self-start rounded-xl border border-dashed border-accent/50 px-4 py-2 text-sm font-semibold text-accent-soft transition hover:bg-accent/10 disabled:opacity-40"
        >
          + Adicionar “{textoLivre}” como nicho
        </button>
      )}

      <div className="flex flex-col gap-5 rounded-2xl sm:max-h-[26rem] sm:overflow-y-auto border border-line bg-ink/60 p-4 sm:p-5">
        {grupos.length === 0 && (
          <p className="py-6 text-center text-sm text-muted">
            Nenhum nicho da lista com “{textoLivre}”. Use o botão acima para buscar esse nicho mesmo assim.
          </p>
        )}
        {grupos.map((grupo) => (
          <fieldset key={grupo.titulo} className="flex flex-col gap-3">
            <legend className="mb-3 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted">
              {grupo.titulo}
            </legend>
            <div className="flex flex-wrap gap-2">
              {grupo.nichos.map((nicho) => {
                const ativo = selecionados.includes(nicho.nome)
                return (
                  <button
                    key={nicho.nome}
                    type="button"
                    aria-pressed={ativo}
                    disabled={!ativo && cheio}
                    onClick={() => alternar(nicho.nome)}
                    className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                      ativo
                        ? "border-accent bg-accent text-white shadow-[0_0_18px_-4px_rgb(47_124_255/0.9)]"
                        : "border-line bg-panel-2 text-fg/85 hover:border-accent/60 hover:text-fg disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-line"
                    }`}
                  >
                    {nicho.nome}
                  </button>
                )
              })}
            </div>
          </fieldset>
        ))}
      </div>
    </div>
  )
}
