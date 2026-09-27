import type { Empresa } from "@/lib/types"

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

export function textoEmpresa(e: Empresa, nicho: string) {
  return [
    `Empresa: ${e.nome}`,
    `Nicho: ${nicho}`,
    `Telefone: ${e.telefone ?? "Não informado"}`,
    `Endereço: ${e.endereco || "Não informado"}`,
    e.avaliacao != null ? `Avaliação: ${textoAvaliacao(e)}` : null,
    e.redeSocial ? `Rede social: ${e.redeSocial}` : null,
    `Google Maps: ${e.linkMaps ?? "—"}`,
  ]
    .filter(Boolean)
    .join("\n")
}

export function textoTodas(empresas: Empresa[], nicho: string) {
  return empresas.map((e) => textoEmpresa(e, nicho)).join("\n\n---\n\n")
}

function celulaCsv(valor: string | number | null) {
  const texto = valor == null ? "" : String(valor)
  return /[";\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

// Separador ";" abre direto nas colunas certas no Excel em português.
export function gerarCsv(empresas: Empresa[], nicho: string) {
  const cabecalho = ["Empresa", "Nicho", "Telefone", "WhatsApp", "Endereço", "Nota", "Avaliações", "Rede social", "Google Maps"]
  const linhas = empresas.map((e) =>
    [e.nome, nicho, e.telefone, linkWhatsApp(e.telefone), e.endereco, e.avaliacao, e.totalAvaliacoes, e.redeSocial, e.linkMaps]
      .map(celulaCsv)
      .join(";"),
  )
  return "﻿" + [cabecalho.join(";"), ...linhas].join("\n")
}

export function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim()
}
