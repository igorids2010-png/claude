export type Fonte = "google" | "osm"

export type Empresa = {
  id: string
  nome: string
  telefone: string | null
  endereco: string
  avaliacao: number | null
  totalAvaliacoes: number | null
  linkMaps: string | null
  redeSocial: string | null
}

export type SearchEvent =
  | { type: "progress"; percent: number; message: string; encontradas: number }
  | {
      type: "result"
      fonte: Fonte
      cidade: string
      nicho: string
      analisadas: number
      empresas: Empresa[]
      // regiões do mapa que não responderam a tempo (lista pode estar incompleta)
      regioesSemResposta?: number
    }
  | { type: "error"; message: string }

export type Emit = (event: SearchEvent) => void

// Erro com mensagem pronta para mostrar ao usuário.
export class SearchError extends Error {}

// Busca e tamanho do mapa são comuns às duas fontes.
export const GRID_SIZE = 3

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
