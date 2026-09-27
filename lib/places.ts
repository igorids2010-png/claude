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

const GRID_SIZE = 3
const MAX_PAGES_PER_CELL = 3 // a Places API devolve no máximo 60 resultados (3 páginas de 20) por consulta
const CELL_CONCURRENCY = 3

// Links que contam como "não tem site próprio": só redes sociais, agregadores ou WhatsApp.
const SOCIAL_HOSTS = [
  "instagram.com",
  "facebook.com",
  "fb.com",
  "linktr.ee",
  "wa.me",
  "whatsapp.com",
  "api.whatsapp.com",
  "tiktok.com",
  "ifood.com.br",
  "goo.gl",
  "g.page",
  "business.site",
  "linkin.bio",
]

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
  | { type: "result"; cidade: string; nicho: string; analisadas: number; empresas: Empresa[] }
  | { type: "error"; message: string }

export class PlacesError extends Error {}

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
    throw new PlacesError(message)
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

function socialOnlyLink(websiteUri: string): string | null {
  try {
    const host = new URL(websiteUri).hostname.replace(/^www\./, "").toLowerCase()
    return SOCIAL_HOSTS.some((h) => host === h || host.endsWith(`.${h}`)) ? websiteUri : null
  } catch {
    return null
  }
}

function toEmpresa(place: GooglePlace): Empresa | null {
  if (place.businessStatus && place.businessStatus !== "OPERATIONAL") return null

  let redeSocial: string | null = null
  if (place.websiteUri) {
    redeSocial = socialOnlyLink(place.websiteUri)
    if (!redeSocial) return null
  }

  return {
    id: place.id,
    nome: place.displayName?.text ?? "Sem nome",
    telefone: place.nationalPhoneNumber ?? null,
    endereco: place.formattedAddress ?? "",
    avaliacao: place.rating ?? null,
    totalAvaliacoes: place.userRatingCount ?? null,
    linkMaps: place.googleMapsUri ?? null,
    redeSocial,
  }
}

export async function searchSemSite(
  apiKey: string,
  { cidade, nicho }: { cidade: string; nicho: string },
  emit: (event: SearchEvent) => void,
  signal?: AbortSignal,
) {
  emit({ type: "progress", percent: 2, message: `Localizando ${cidade} no mapa…`, encontradas: 0 })

  const cityData = await searchText(apiKey, CITY_FIELDS, { textQuery: `${cidade}, Brasil`, pageSize: 1 }, signal)
  const city = cityData.places?.[0]
  if (!city?.viewport) {
    throw new PlacesError(`Não encontrei a cidade "${cidade}" no Google Maps. Confira o nome e tente de novo.`)
  }

  const cells = splitViewport(city.viewport, GRID_SIZE)
  const totalSteps = cells.length * MAX_PAGES_PER_CELL
  let stepsDone = 0
  let cellsDone = 0
  const encontrados = new Map<string, GooglePlace>()

  const reportProgress = () => {
    const percent = Math.min(95, Math.round(8 + (stepsDone / totalSteps) * 87))
    emit({
      type: "progress",
      percent,
      message: `Varrendo região ${Math.min(cellsDone + 1, cells.length)} de ${cells.length}…`,
      encontradas: encontrados.size,
    })
  }

  emit({ type: "progress", percent: 8, message: `Dividindo ${cidade} em ${cells.length} regiões…`, encontradas: 0 })

  const scanCell = async (cell: Viewport) => {
    let pageToken: string | undefined
    let page = 0

    for (; page < MAX_PAGES_PER_CELL; page++) {
      const data = await searchText(
        apiKey,
        BUSINESS_FIELDS,
        { textQuery: nicho, pageSize: 20, locationRestriction: { rectangle: cell }, ...(pageToken && { pageToken }) },
        signal,
      )
      for (const place of data.places ?? []) encontrados.set(place.id, place)
      stepsDone++
      reportProgress()

      pageToken = data.nextPageToken
      if (!pageToken) break
    }

    // páginas que não precisaram ser buscadas contam como concluídas
    stepsDone += MAX_PAGES_PER_CELL - Math.min(page + 1, MAX_PAGES_PER_CELL)
    cellsDone++
    reportProgress()
  }

  const queue = [...cells]
  const workers = Array.from({ length: CELL_CONCURRENCY }, async () => {
    while (queue.length > 0) {
      const cell = queue.shift()!
      await scanCell(cell)
    }
  })
  await Promise.all(workers)

  emit({ type: "progress", percent: 97, message: "Separando quem não tem site…", encontradas: encontrados.size })

  const empresas = [...encontrados.values()]
    .map(toEmpresa)
    .filter((e): e is Empresa => e !== null)
    .sort((a, b) => (b.totalAvaliacoes ?? 0) - (a.totalAvaliacoes ?? 0))

  emit({ type: "progress", percent: 100, message: "Pronto!", encontradas: encontrados.size })
  emit({
    type: "result",
    cidade: city.formattedAddress ?? cidade,
    nicho,
    analisadas: encontrados.size,
    empresas,
  })
}
