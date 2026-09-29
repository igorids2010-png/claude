"use client"

import { CAPITAIS, CIDADES_GRANDES } from "@/lib/sugestoes"
import { QUANTIDADES } from "@/lib/types"
import { Combobox } from "@/components/combobox"
import { NichePicker } from "@/components/niche-picker"

const GRUPOS_CIDADES = [
  { titulo: "Capitais", itens: CAPITAIS },
  { titulo: "Outras cidades grandes", itens: CIDADES_GRANDES },
]

type Props = {
  cidade: string
  nichos: string[]
  quantidade: number
  onCidade: (v: string) => void
  onNichos: (v: string[]) => void
  onQuantidade: (v: number) => void
  onSubmit: () => void
}

function Etapa({ numero, titulo, children }: { numero: number; titulo: string; children: React.ReactNode }) {
  return (
    <section className="relative flex flex-col gap-5 rounded-[26px] border border-line bg-panel/85 p-5 backdrop-blur focus-within:z-30 sm:p-7">
      <header className="flex flex-col gap-1">
        <span className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-accent-soft">
          Etapa {numero}
        </span>
        <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">{titulo}</h2>
      </header>
      {children}
    </section>
  )
}

export function SearchForm({ cidade, nichos, quantidade, onCidade, onNichos, onQuantidade, onSubmit }: Props) {
  const pronto = cidade.trim() !== "" && nichos.length > 0

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (pronto) onSubmit()
      }}
      className="flex flex-col gap-4"
    >
      <Etapa numero={1} titulo="Em qual cidade?">
        <Combobox
          label="Cidade"
          ocultarLabel
          placeholder="Digite ou escolha a cidade"
          value={cidade}
          onChange={onCidade}
          grupos={GRUPOS_CIDADES}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          }
        />
      </Etapa>

      <Etapa numero={2} titulo="O que você procura?">
        <NichePicker selecionados={nichos} onChange={onNichos} />
      </Etapa>

      <Etapa numero={3} titulo="Quantos leads sem site?">
        <div role="radiogroup" aria-label="Quantidade de leads" className="grid grid-cols-5 gap-2">
          {QUANTIDADES.map((q) => {
            const ativo = q === quantidade
            return (
              <button
                key={q}
                type="button"
                role="radio"
                aria-checked={ativo}
                onClick={() => onQuantidade(q)}
                className={`flex h-16 flex-col items-center justify-center rounded-2xl border transition ${
                  ativo
                    ? "border-accent bg-accent/15 text-fg shadow-[0_0_24px_-8px_rgb(47_124_255/0.9)]"
                    : "border-line bg-panel-2 text-muted hover:border-accent/50 hover:text-fg"
                }`}
              >
                <span className={`font-display text-xl font-bold tabular-nums ${ativo ? "text-accent-soft" : ""}`}>{q}</span>
                <span className="font-mono text-[0.6rem] uppercase tracking-widest">leads</span>
              </button>
            )
          })}
        </div>
        <p className="text-xs leading-relaxed text-muted">
          A busca para assim que achar essa quantidade de empresas sem site. Quem já está em “Meus leads” não entra na
          conta, então você sempre recebe leads novos.
        </p>
      </Etapa>

      <button
        type="submit"
        disabled={!pronto}
        className="sticky bottom-4 z-20 mt-2 h-14 rounded-2xl bg-accent text-base font-bold text-white shadow-[0_12px_40px_-10px_rgb(47_124_255/0.9)] transition hover:brightness-110 active:translate-y-px disabled:cursor-not-allowed disabled:bg-panel-2 disabled:text-dim disabled:shadow-none"
      >
        {pronto
          ? `Buscar ${quantidade} leads sem site`
          : !cidade.trim()
            ? "Escolha a cidade para continuar"
            : "Escolha pelo menos um nicho"}
      </button>
    </form>
  )
}
