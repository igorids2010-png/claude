"use client"

import { useCallback, useMemo, useSyncExternalStore } from "react"
import type { Empresa } from "@/lib/types"

export type StatusLead = "enviada" | "respondeu" | "negociando" | "fechado" | "sem-interesse"

export const STATUS_LEAD: { id: StatusLead; rotulo: string; classe: string }[] = [
  { id: "enviada", rotulo: "Mensagem enviada", classe: "border-accent/40 bg-accent/10 text-accent-soft" },
  { id: "respondeu", rotulo: "Respondeu", classe: "border-star/40 bg-star/10 text-star" },
  { id: "negociando", rotulo: "Negociando", classe: "border-violet-400/40 bg-violet-400/10 text-violet-300" },
  { id: "fechado", rotulo: "Fechado", classe: "border-ok/40 bg-ok/10 text-ok" },
  { id: "sem-interesse", rotulo: "Sem interesse", classe: "border-line bg-panel-2 text-dim" },
]

export type LeadSalvo = Empresa & {
  cidade: string
  status: StatusLead
  observacao: string
  contatadoEm: string
  atualizadoEm: string
}

const CHAVE = "radar-sem-site:meus-leads:v1"
const VAZIO: LeadSalvo[] = []

let cache: LeadSalvo[] | null = null
const ouvintes = new Set<() => void>()

function ler(): LeadSalvo[] {
  if (cache) return cache
  try {
    const bruto = window.localStorage.getItem(CHAVE)
    const lista = bruto ? (JSON.parse(bruto) as LeadSalvo[]) : []
    cache = Array.isArray(lista) ? lista : []
  } catch {
    cache = []
  }
  return cache
}

function gravar(leads: LeadSalvo[]) {
  cache = leads
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(leads))
  } catch {
    // armazenamento cheio ou bloqueado: a lista continua valendo nesta aba
  }
  ouvintes.forEach((fn) => fn())
}

function assinar(fn: () => void) {
  ouvintes.add(fn)
  // mantém várias abas abertas em sincronia
  const aoMudarEmOutraAba = (e: StorageEvent) => {
    if (e.key !== CHAVE) return
    cache = null
    fn()
  }
  window.addEventListener("storage", aoMudarEmOutraAba)
  return () => {
    ouvintes.delete(fn)
    window.removeEventListener("storage", aoMudarEmOutraAba)
  }
}

export function useMeusLeads() {
  const leads = useSyncExternalStore(assinar, ler, () => VAZIO)
  const ids = useMemo(() => new Set(leads.map((l) => l.id)), [leads])

  const adicionar = useCallback((empresa: Empresa, cidade: string) => {
    const atual = ler()
    if (atual.some((l) => l.id === empresa.id)) return
    const agora = new Date().toISOString()
    gravar([{ ...empresa, cidade, status: "enviada", observacao: "", contatadoEm: agora, atualizadoEm: agora }, ...atual])
  }, [])

  const atualizar = useCallback((id: string, mudanca: Partial<Pick<LeadSalvo, "status" | "observacao">>) => {
    const agora = new Date().toISOString()
    gravar(ler().map((l) => (l.id === id ? { ...l, ...mudanca, atualizadoEm: agora } : l)))
  }, [])

  const remover = useCallback((id: string) => {
    gravar(ler().filter((l) => l.id !== id))
  }, [])

  return { leads, ids, adicionar, atualizar, remover }
}
