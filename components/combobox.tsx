"use client"

import { useId, useMemo, useRef, useState } from "react"
import { normalizar } from "@/lib/format"

type Grupo = { titulo: string; itens: string[] }

type Props = {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  grupos: Grupo[]
  icon: React.ReactNode
}

type Opcao = { valor: string; rotulo: string; grupo: string }

const MAX_POR_GRUPO = 60

export function Combobox({ label, placeholder, value, onChange, grupos, icon }: Props) {
  const id = useId()
  const listId = `${id}-lista`
  const inputRef = useRef<HTMLInputElement>(null)
  const [aberto, setAberto] = useState(false)
  const [ativo, setAtivo] = useState(0)

  const opcoes = useMemo<Opcao[]>(() => {
    const busca = normalizar(value)
    const lista: Opcao[] = []
    const todos = grupos.flatMap((g) => g.itens)
    const exato = todos.some((item) => normalizar(item) === busca)

    for (const grupo of grupos) {
      const filtrados = grupo.itens.filter((item) => !busca || normalizar(item).includes(busca)).slice(0, MAX_POR_GRUPO)
      for (const item of filtrados) lista.push({ valor: item, rotulo: item, grupo: grupo.titulo })
    }
    // Com sugestões, o Enter escolhe a melhor sugestão; o texto livre fica como última opção.
    if (busca && !exato) {
      const livre = { valor: value.trim(), rotulo: `Usar “${value.trim()}”`, grupo: "" }
      if (lista.length > 0) lista.push(livre)
      else lista.unshift(livre)
    }
    return lista
  }, [grupos, value])

  const escolher = (opcao: Opcao) => {
    onChange(opcao.valor)
    setAberto(false)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setAberto(true)
      setAtivo((i) => Math.min(i + 1, opcoes.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setAtivo((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter" && aberto && opcoes[ativo]) {
      e.preventDefault()
      escolher(opcoes[ativo])
    } else if (e.key === "Escape") {
      setAberto(false)
    }
  }

  return (
    <div className="relative flex flex-col gap-2">
      <label htmlFor={id} className="font-mono text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted">
        {label}
      </label>
      <div className="group flex items-center gap-3 rounded-2xl border border-line bg-panel-2 px-4 transition focus-within:border-signal-soft focus-within:shadow-[0_0_0_4px_rgb(255_122_69/0.14)]">
        <span className="text-dim transition group-focus-within:text-signal" aria-hidden>
          {icon}
        </span>
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={aberto}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={aberto && opcoes[ativo] ? `${listId}-${ativo}` : undefined}
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setAtivo(0)
            setAberto(true)
          }}
          onFocus={() => setAberto(true)}
          onBlur={() => setAberto(false)}
          onKeyDown={onKeyDown}
          className="h-14 w-full min-w-0 bg-transparent text-base text-fg outline-none placeholder:text-dim focus-visible:outline-none"
        />
        {value && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onChange("")
              inputRef.current?.focus()
            }}
            className="rounded-md px-1 text-lg leading-none text-dim hover:text-fg"
            aria-label={`Limpar ${label.toLowerCase()}`}
          >
            ×
          </button>
        )}
      </div>

      {aberto && opcoes.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-full z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-line bg-panel p-1.5 shadow-2xl shadow-black/50"
        >
          {opcoes.map((opcao, i) => {
            const novoGrupo = opcao.grupo && opcao.grupo !== opcoes[i - 1]?.grupo
            return (
              <li key={`${opcao.grupo}-${opcao.valor}-${i}`} role="presentation">
                {novoGrupo && (
                  <div className="px-3 pb-1 pt-3 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-dim">
                    {opcao.grupo}
                  </div>
                )}
                <div
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === ativo}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setAtivo(i)}
                  onClick={() => escolher(opcao)}
                  className={`cursor-pointer rounded-xl px-3 py-2.5 text-sm transition ${
                    i === ativo ? "bg-signal/12 text-fg" : "text-muted"
                  } ${opcao.grupo === "" ? "font-semibold text-signal" : ""}`}
                >
                  {opcao.rotulo}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
