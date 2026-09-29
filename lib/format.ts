import type { Empresa } from "@/lib/types"
import type { LeadSalvo } from "@/lib/leads"

export function soDigitos(telefone: string) {
  return telefone.replace(/\D/g, "")
}

// Celular brasileiro: DDD + 9 dígitos começando com 9.
export function linkWhatsApp(telefone: string | null): string | null {
  if (!telefone) return null
  let digitos = soDigitos(telefone)
  if (digitos.startsWith("55") && digitos.length === 13) digitos = digitos.slice(2)
  if (digitos.length !== 11 || digitos[2] !== "9") return null
  return `https://wa.me/55${digitos}`
}

export function textoAvaliacao(e: Empresa) {
  if (e.avaliacao == null) return "Sem avaliações"
  return `${e.avaliacao.toFixed(1).replace(".", ",")} (${e.totalAvaliacoes ?? 0} avaliações)`
}

export function textoEmpresa(e: Empresa) {
  return [
    `Empresa: ${e.nome}`,
    `Nicho: ${e.nicho}`,
    `Telefone: ${e.telefone ?? "Não informado"}`,
    `Endereço: ${e.endereco || "Não informado"}`,
    e.avaliacao != null ? `Avaliação: ${textoAvaliacao(e)}` : null,
    e.redeSocial ? `Rede social: ${e.redeSocial}` : null,
    `Google Maps: ${e.linkMaps ?? "—"}`,
  ]
    .filter(Boolean)
    .join("\n")
}

export function textoTodas(empresas: Empresa[]) {
  return empresas.map(textoEmpresa).join("\n\n---\n\n")
}

function celulaCsv(valor: string | number | null) {
  const texto = valor == null ? "" : String(valor)
  return /[";\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

// Separador ";" e BOM: abre direto nas colunas certas no Excel em português.
function montarCsv(cabecalho: string[], linhas: (string | number | null)[][]) {
  return "﻿" + [cabecalho.join(";"), ...linhas.map((l) => l.map(celulaCsv).join(";"))].join("\n")
}

export function gerarCsv(empresas: Empresa[]) {
  return montarCsv(
    ["Empresa", "Nicho", "Telefone", "WhatsApp", "Endereço", "Nota", "Avaliações", "Rede social", "Google Maps"],
    empresas.map((e) => [
      e.nome,
      e.nicho,
      e.telefone,
      linkWhatsApp(e.telefone),
      e.endereco,
      e.avaliacao,
      e.totalAvaliacoes,
      e.redeSocial,
      e.linkMaps,
    ]),
  )
}

export function gerarCsvLeads(leads: LeadSalvo[], rotuloStatus: (s: LeadSalvo["status"]) => string) {
  return montarCsv(
    ["Empresa", "Nicho", "Cidade", "Status", "Contatado em", "Observação", "Telefone", "WhatsApp", "Endereço", "Google Maps"],
    leads.map((l) => [
      l.nome,
      l.nicho,
      l.cidade,
      rotuloStatus(l.status),
      formatarData(l.contatadoEm),
      l.observacao,
      l.telefone,
      linkWhatsApp(l.telefone),
      l.endereco,
      l.linkMaps,
    ]),
  )
}

export function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export function baixarArquivo(conteudo: string, nome: string) {
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = nome
  a.click()
  URL.revokeObjectURL(url)
}

export function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim()
}

export function slug(texto: string) {
  return normalizar(texto).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}
