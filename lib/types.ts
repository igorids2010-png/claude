export type Fonte = "google" | "osm"

export type Empresa = {
  id: string
  nome: string
  nicho: string
  telefone: string | null
  endereco: string
  avaliacao: number | null
  totalAvaliacoes: number | null
  linkMaps: string | null
  redeSocial: string | null
}

export type PedidoBusca = {
  cidade: string
  nichos: string[]
  quantidade: number
  // ids de empresas que já estão em "Meus leads" e não devem contar de novo
  excluir: string[]
}

export type SearchEvent =
  | {
      type: "progress"
      percent: number
      message: string
      // leads novos sem site encontrados até agora
      encontradas: number
      analisadas: number
      regioesProntas: number
      regioesTotal: number
    }
  | {
      type: "result"
      fonte: Fonte
      cidade: string
      nichos: string[]
      quantidade: number
      analisadas: number
      empresas: Empresa[]
      // regiões do mapa que não responderam a tempo (lista pode estar incompleta)
      regioesSemResposta: number
    }
  | { type: "error"; message: string }

export type Emit = (event: SearchEvent) => void

// Erro com mensagem pronta para mostrar ao usuário.
export class SearchError extends Error {}

export const GRID_SIZE = 3
export const QUANTIDADES = [10, 25, 50, 100, 200] as const
export const MAX_NICHOS = 5

export const SOCIAL_HOSTS = [
  "instagram.com",
  "facebook.com",
  "fb.com",
  "linktr.ee",
  "wa.me",
  "whatsapp.com",
  "tiktok.com",
  "ifood.com.br",
  "goo.gl",
  "g.page",
  "business.site",
  "linkin.bio",
]

export function socialOnlyLink(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase()
    return SOCIAL_HOSTS.some((h) => host === h || host.endsWith(`.${h}`)) ? url : null
  } catch {
    return null
  }
}

// Junta os leads sem site da busca. A meta só conta como atingida quando cada nicho
// tem sua parte (meta ÷ nichos), para um nicho muito comum não encerrar a busca sozinho.
export class ColetaLeads {
  readonly empresas = new Map<string, Empresa>()
  private readonly porNicho = new Map<string, number>()
  private readonly cota: number

  constructor(
    private readonly nichos: string[],
    private readonly quantidade: number,
    private readonly excluir: Set<string>,
  ) {
    this.cota = Math.ceil(quantidade / nichos.length)
  }

  adicionar(empresa: Empresa | null) {
    if (!empresa || this.excluir.has(empresa.id) || this.empresas.has(empresa.id)) return
    this.empresas.set(empresa.id, empresa)
    this.porNicho.set(empresa.nicho, (this.porNicho.get(empresa.nicho) ?? 0) + 1)
  }

  metaAtingida() {
    return this.nichos.every((n) => (this.porNicho.get(n) ?? 0) >= this.cota)
  }

  // quantos leads vão aparecer no resultado se a busca parar agora
  get encontradas() {
    return Math.min(this.empresas.size, this.quantidade)
  }
}

// Divide a meta entre os nichos: pega um de cada nicho por vez (na ordem de `comparar`),
// para que um nicho com muitos resultados não ocupe a lista inteira.
export function equilibrarPorNicho(
  empresas: Empresa[],
  nichos: string[],
  quantidade: number,
  comparar: (a: Empresa, b: Empresa) => number,
): Empresa[] {
  const filas = nichos.map((n) => empresas.filter((e) => e.nicho === n).sort(comparar))
  const resultado: Empresa[] = []
  for (let rodada = 0; resultado.length < quantidade && filas.some((f) => rodada < f.length); rodada++) {
    for (const fila of filas) {
      if (rodada < fila.length && resultado.length < quantidade) resultado.push(fila[rodada])
    }
  }
  return resultado.sort(comparar)
}

// Percentual que considera tanto as regiões varridas quanto a meta de leads.
export function calcularPercent(regioesProntas: number, regioesTotal: number, encontradas: number, quantidade: number) {
  const fracao = Math.max(regioesProntas / regioesTotal, Math.min(1, encontradas / quantidade))
  return Math.min(95, Math.round(8 + fracao * 87))
}
