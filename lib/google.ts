import {
  GRID_SIZE,
  SearchError,
  ColetaLeads,
  calcularPercent,
  equilibrarPorNicho,
  socialOnlyLink,
  type Emit,
  type Empresa,
  type PedidoBusca,
} from "@/lib/types"

const SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"

const CITY_FIELDS = ["places.id", "places.formattedAddress", "places.viewport"].join(",")
const BUSINESS_FIELDS = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "places.googleMapsUri",
  "places.businessStatus",
  "nextPageToken",
].join(",")

const MAX_PAGES_PER_CELL = 3 // a Places API devolve no máximo 60 resultados (3 páginas de 20) por consulta
const CELL_CONCURRENCY = 3
// A função na Vercel é encerrada em 60s; depois disso não começa nenhuma consulta nova.
const PRAZO_TOTAL_MS = 45_000

type LatLng = { latitude: number; longitude: number }
type Viewport = { low: LatLng; high: LatLng }

type GooglePlace = {
  id: string
  displayName?: { text: string }
  formattedAddress?: string
  nationalPhoneNumber?: string
  websiteUri?: string
  rating?: number
  userRatingCount?: number
  googleMapsUri?: string
  businessStatus?: string
  viewport?: Viewport
}

// Chave inválida, faturamento inativo ou API desativada: dá para cair na fonte gratuita.
export class GoogleIndisponivelError extends SearchError {}

async function searchText(
  apiKey: string,
  fieldMask: string,
  body: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<{ places?: GooglePlace[]; nextPageToken?: string }> {
  const response = await fetch(SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify({ languageCode: "pt-BR", regionCode: "BR", ...body }),
    signal,
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = data?.error?.message || `Google Maps respondeu com erro ${response.status}`
    if (response.status === 400 || response.status === 401 || response.status === 403) {
      throw new GoogleIndisponivelError(message)
    }
    throw new SearchError(message)
  }
  return data
}

function splitViewport(viewport: Viewport, size: number): Viewport[] {
  const { low, high } = viewport
  const latStep = (high.latitude - low.latitude) / size
  const lngStep = (high.longitude - low.longitude) / size
  const cells: Viewport[] = []

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      cells.push({
        low: { latitude: low.latitude + latStep * row, longitude: low.longitude + lngStep * col },
        high: { latitude: low.latitude + latStep * (row + 1), longitude: low.longitude + lngStep * (col + 1) },
      })
    }
  }
  return cells
}

function toEmpresa(place: GooglePlace, nicho: string): Empresa | null {
  if (place.businessStatus && place.businessStatus !== "OPERATIONAL") return null

  let redeSocial: string | null = null
  if (place.websiteUri) {
    redeSocial = socialOnlyLink(place.websiteUri)
    if (!redeSocial) return null
  }

  return {
    id: `google:${place.id}`,
    nome: place.displayName?.text ?? "Sem nome",
    nicho,
    telefone: place.nationalPhoneNumber ?? null,
    endereco: place.formattedAddress ?? "",
    avaliacao: place.rating ?? null,
    totalAvaliacoes: place.userRatingCount ?? null,
    linkMaps: place.googleMapsUri ?? null,
    redeSocial,
  }
}

export async function searchGoogle(apiKey: string, pedido: PedidoBusca, emit: Emit, signal?: AbortSignal) {
  const { cidade, nichos, quantidade } = pedido
  const prazoFinal = Date.now() + PRAZO_TOTAL_MS
  const regioesTotal = GRID_SIZE * GRID_SIZE

  emit({
    type: "progress",
    percent: 2,
    message: `Localizando ${cidade} no mapa…`,
    encontradas: 0,
    analisadas: 0,
    regioesProntas: 0,
    regioesTotal,
  })

  const cityData = await searchText(apiKey, CITY_FIELDS, { textQuery: `${cidade}, Brasil`, pageSize: 1 }, signal)
  const city = cityData.places?.[0]
  if (!city?.viewport) {
    throw new SearchError(`Não encontrei a cidade "${cidade}" no Google Maps. Confira o nome e tente de novo.`)
  }

  const cells = splitViewport(city.viewport, GRID_SIZE)
  const vistos = new Set<string>()
  const coleta = new ColetaLeads(nichos, quantidade, new Set(pedido.excluir))
  let prontas = 0
  let incompletas = 0
  let esgotouPrazo = false
  const metaAtingida = () => coleta.metaAtingida()

  const reportar = () =>
    emit({
      type: "progress",
      percent: calcularPercent(prontas, regioesTotal, coleta.encontradas, quantidade),
      message: metaAtingida()
        ? `Meta atingida: ${quantidade} leads sem site!`
        : `Varrendo o mapa: ${prontas} de ${regioesTotal} regiões prontas…`,
      encontradas: coleta.encontradas,
      analisadas: vistos.size,
      regioesProntas: prontas,
      regioesTotal,
    })

  reportar()

  // Cada região passa por todos os nichos (até 3 páginas de 20 por nicho).
  const scanCell = async (cell: Viewport) => {
    for (const nicho of nichos) {
      let pageToken: string | undefined
      for (let page = 0; page < MAX_PAGES_PER_CELL; page++) {
        if (metaAtingida()) return
        if (Date.now() > prazoFinal) {
          esgotouPrazo = true
          incompletas++
          return
        }
        const data = await searchText(
          apiKey,
          BUSINESS_FIELDS,
          { textQuery: nicho, pageSize: 20, locationRestriction: { rectangle: cell }, ...(pageToken && { pageToken }) },
          signal,
        )
        for (const place of data.places ?? []) {
          if (vistos.has(place.id)) continue
          vistos.add(place.id)
          coleta.adicionar(toEmpresa(place, nicho))
        }
        reportar()
        pageToken = data.nextPageToken
        if (!pageToken) break
      }
    }
  }

  const queue = [...cells]
  await Promise.all(
    Array.from({ length: CELL_CONCURRENCY }, async () => {
      while (queue.length > 0 && !metaAtingida() && !esgotouPrazo) {
        await scanCell(queue.shift()!)
        prontas++
        reportar()
      }
    }),
  )
  // regiões cortadas pelo prazo ou que nem chegaram a começar
  if (esgotouPrazo && !metaAtingida()) incompletas += queue.length

  const empresas = equilibrarPorNicho(
    [...coleta.empresas.values()],
    nichos,
    quantidade,
    (a, b) => (b.totalAvaliacoes ?? 0) - (a.totalAvaliacoes ?? 0),
  )

  emit({
    type: "progress",
    percent: 100,
    message: "Pronto!",
    encontradas: empresas.length,
    analisadas: vistos.size,
    regioesProntas: prontas,
    regioesTotal,
  })
  emit({
    type: "result",
    fonte: "google",
    cidade: city.formattedAddress ?? cidade,
    nichos,
    quantidade,
    analisadas: vistos.size,
    empresas,
    regioesSemResposta: metaAtingida() ? 0 : incompletas,
  })
}
