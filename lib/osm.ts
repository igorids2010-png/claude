import { GRID_SIZE, SearchError, socialOnlyLink, type Emit, type Empresa } from "@/lib/types"
import { normalizar } from "@/lib/format"

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
const OVERPASS_URL = "https://overpass-api.de/api/interpreter"
// As APIs públicas do OpenStreetMap pedem um User-Agent que identifique o app.
const USER_AGENT = "RadarSemSite/2.0 (+https://github.com/igorids2010-png/claude)"

type Bbox = { s: number; w: number; n: number; e: number }

type OsmElement = {
  type: "node" | "way" | "relation"
  id: number
  tags?: Record<string, string>
}

// Cada nicho vira um ou mais filtros de tags do OpenStreetMap. A ordem importa:
// os mais específicos (pizzaria, clínica veterinária) vêm antes dos genéricos.
const NICHOS_OSM: { palavras: string[]; filtros: string[] }[] = [
  { palavras: ["pizza"], filtros: ['["amenity"~"^(restaurant|fast_food)$"]["cuisine"~"pizza"]'] },
  { palavras: ["hamburg", "burger"], filtros: ['["amenity"~"^(restaurant|fast_food)$"]["cuisine"~"burger"]'] },
  { palavras: ["lanchonete", "lanche", "fast food", "pastel"], filtros: ['["amenity"="fast_food"]', '["amenity"="cafe"]'] },
  { palavras: ["restaurante"], filtros: ['["amenity"="restaurant"]'] },
  { palavras: ["barbear", "barber"], filtros: ['["shop"="hairdresser"]["hairdresser"="barber"]', '["shop"="hairdresser"]["name"~"barb",i]'] },
  { palavras: ["bar", "boteco", "pub"], filtros: ['["amenity"~"^(bar|pub|biergarten)$"]'] },
  { palavras: ["padaria", "panificadora"], filtros: ['["shop"~"^(bakery|pastry|confectionery)$"]'] },
  { palavras: ["acougue"], filtros: ['["shop"="butcher"]'] },
  { palavras: ["mercado", "mercearia", "hortifruti", "sacolao"], filtros: ['["shop"~"^(supermarket|convenience|greengrocer|general)$"]'] },
  { palavras: ["odonto", "dentist"], filtros: ['["amenity"="dentist"]', '["healthcare"="dentist"]'] },
  { palavras: ["veterinari"], filtros: ['["amenity"="veterinary"]'] },
  { palavras: ["clinica", "medic", "consultorio"], filtros: ['["amenity"~"^(clinic|doctors)$"]', '["healthcare"~"^(clinic|doctor)$"]'] },
  { palavras: ["petshop", "pet shop", "pet"], filtros: ['["shop"="pet"]', '["shop"="pet_grooming"]'] },
  { palavras: ["salao", "saloes", "cabeleire", "cabelo"], filtros: ['["shop"~"^(hairdresser|beauty)$"]'] },
  { palavras: ["estetica", "manicure", "unha", "sobrancelha"], filtros: ['["shop"~"^(beauty|cosmetics)$"]'] },
  { palavras: ["academia", "crossfit", "pilates"], filtros: ['["leisure"~"^(fitness_centre|sports_centre)$"]'] },
  { palavras: ["lava-rapido", "lava rapido", "lava jato", "lava-jato", "lavagem"], filtros: ['["amenity"="car_wash"]'] },
  { palavras: ["oficina", "mecanic", "funilaria"], filtros: ['["shop"~"^(car_repair|tyres)$"]'] },
  { palavras: ["autopec", "auto pec"], filtros: ['["shop"="car_parts"]'] },
  { palavras: ["farmacia", "drogaria"], filtros: ['["amenity"="pharmacy"]', '["shop"="chemist"]'] },
  { palavras: ["otica"], filtros: ['["shop"="optician"]'] },
  { palavras: ["roupa", "moda", "boutique", "vestuario"], filtros: ['["shop"~"^(clothes|boutique|fashion)$"]'] },
  { palavras: ["construcao", "ferragem", "ferragens"], filtros: ['["shop"~"^(hardware|doityourself|building_materials|trade)$"]'] },
  { palavras: ["imobiliaria", "imoveis"], filtros: ['["office"="estate_agent"]', '["shop"="estate_agent"]'] },
  { palavras: ["contab", "contador"], filtros: ['["office"~"^(accountant|tax_advisor)$"]'] },
  { palavras: ["advoca", "advogad"], filtros: ['["office"="lawyer"]'] },
  { palavras: ["idioma", "ingles", "espanhol"], filtros: ['["amenity"="language_school"]'] },
  { palavras: ["florista", "floricultura", "flores"], filtros: ['["shop"="florist"]'] },
  { palavras: ["celular", "assistencia tecnica", "eletronic"], filtros: ['["shop"~"^(mobile_phone|electronics|computer)$"]', '["craft"="electronics_repair"]'] },
]

// Caracteres especiais viram "." (qualquer caractere) para não quebrar a consulta.
function termoDeBusca(texto: string) {
  return texto.trim().replace(/[\\^$.*+?()[\]{}|"']/g, ".")
}

// Nicho fora da lista: procura estabelecimentos cujo nome contenha o texto digitado.
function filtrosDoNicho(nicho: string): string[] {
  const alvo = normalizar(nicho)
  const conhecido = NICHOS_OSM.find((n) => n.palavras.some((p) => alvo.includes(p)))
  if (conhecido) return conhecido.filtros

  const termo = termoDeBusca(nicho)
  return ["shop", "amenity", "office", "craft", "leisure"].map((chave) => `["${chave}"]["name"~"${termo}",i]`)
}

async function localizarCidade(cidade: string, signal?: AbortSignal) {
  const url = new URL(NOMINATIM_URL)
  url.searchParams.set("q", `${cidade}, Brasil`)
  url.searchParams.set("format", "jsonv2")
  url.searchParams.set("limit", "1")
  url.searchParams.set("countrycodes", "br")
  url.searchParams.set("addressdetails", "1")
  url.searchParams.set("accept-language", "pt-BR")

  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT }, signal })
  if (!response.ok) throw new SearchError("Não consegui acessar o mapa agora. Tente de novo em instantes.")

  const [lugar] = (await response.json()) as {
    osm_type: string
    osm_id: number
    name?: string
    boundingbox: [string, string, string, string]
    address?: { state?: string }
  }[]
  if (!lugar) throw new SearchError(`Não encontrei a cidade "${cidade}" no mapa. Confira o nome e tente de novo.`)

  const [s, n, w, e] = lugar.boundingbox.map(Number)
  const areaId =
    lugar.osm_type === "relation" ? 3600000000 + lugar.osm_id : lugar.osm_type === "way" ? 2400000000 + lugar.osm_id : null
  const nome = [lugar.name, lugar.address?.state].filter(Boolean).join(", ") || cidade

  return { bbox: { s, w, n, e }, areaId, nome }
}

function dividirBbox({ s, w, n, e }: Bbox, tamanho: number): Bbox[] {
  const passoLat = (n - s) / tamanho
  const passoLon = (e - w) / tamanho
  const regioes: Bbox[] = []
  for (let linha = 0; linha < tamanho; linha++) {
    for (let coluna = 0; coluna < tamanho; coluna++) {
      regioes.push({
        s: s + passoLat * linha,
        n: s + passoLat * (linha + 1),
        w: w + passoLon * coluna,
        e: w + passoLon * (coluna + 1),
      })
    }
  }
  return regioes
}

async function consultarOverpass(query: string, signal?: AbortSignal): Promise<OsmElement[]> {
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const response = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": USER_AGENT },
      body: new URLSearchParams({ data: query }),
      signal,
    })
    if (response.ok) return ((await response.json()) as { elements: OsmElement[] }).elements
    // 429/504: servidor público ocupado; espera um pouco e tenta de novo
    if (response.status !== 429 && response.status !== 504) break
    await new Promise((r) => setTimeout(r, 2500 * (tentativa + 1)))
  }
  throw new SearchError("O servidor do mapa está ocupado agora. Espere um minuto e tente de novo.")
}

function montarQuery(filtros: string[], regiao: Bbox, areaId: number | null) {
  const caixa = `(${regiao.s},${regiao.w},${regiao.n},${regiao.e})`
  const area = areaId ? "(area.a)" : ""
  const seletores = filtros.map((f) => `nwr${f}["name"]${area}${caixa};`).join("")
  return `[out:json][timeout:25];${areaId ? `area(id:${areaId})->.a;` : ""}(${seletores});out tags;`
}

function formatarTelefone(bruto: string): string {
  const primeiro = bruto.split(/[;,/]/)[0].trim()
  let digitos = primeiro.replace(/\D/g, "")
  if (digitos.startsWith("55") && (digitos.length === 12 || digitos.length === 13)) digitos = digitos.slice(2)
  if (digitos.startsWith("0") && (digitos.length === 11 || digitos.length === 12)) digitos = digitos.slice(1)
  if (digitos.length === 11) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`
  if (digitos.length === 10) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`
  return primeiro
}

// Aceita URL completa, domínio sem "https://" ou só o @usuário.
function linkRede(valor: string, base: string) {
  const v = valor.trim()
  if (/^https?:\/\//i.test(v)) return v
  if (/^[\w-]+(\.[\w-]+)+\//.test(v)) return `https://${v}`
  return `${base}${v.replace(/^@/, "").replace(/^\/+/, "")}`
}

function toEmpresa(el: OsmElement, cidade: string): Empresa | null {
  const t = el.tags ?? {}
  if (!t.name) return null
  if (t.disused === "yes" || t["disused:shop"] || t["abandoned"] === "yes") return null

  const site = t.website ?? t["contact:website"] ?? t.url
  let redeSocial: string | null = null
  if (site) {
    redeSocial = socialOnlyLink(linkRede(site, "https://"))
    if (!redeSocial) return null
  }
  const instagram = t["contact:instagram"] ?? t.instagram
  const facebook = t["contact:facebook"] ?? t.facebook
  redeSocial ??= instagram
    ? linkRede(instagram, "https://instagram.com/")
    : facebook
      ? linkRede(facebook, "https://facebook.com/")
      : null

  const telefone = t.phone ?? t["contact:phone"] ?? t["contact:mobile"] ?? t.mobile ?? t["contact:whatsapp"]
  const rua = [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(", ")
  const endereco = [rua, t["addr:suburb"] ?? t["addr:neighbourhood"], t["addr:city"]].filter(Boolean).join(" - ")

  return {
    id: `${el.type}/${el.id}`,
    nome: t.name,
    telefone: telefone ? formatarTelefone(telefone) : null,
    endereco,
    avaliacao: null,
    totalAvaliacoes: null,
    linkMaps: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${t.name}, ${cidade}`)}`,
    redeSocial,
  }
}

export async function searchOsm({ cidade, nicho }: { cidade: string; nicho: string }, emit: Emit, signal?: AbortSignal) {
  emit({ type: "progress", percent: 3, message: `Localizando ${cidade} no mapa…`, encontradas: 0 })
  const lugar = await localizarCidade(cidade, signal)

  const filtros = filtrosDoNicho(nicho)
  const regioes = dividirBbox(lugar.bbox, GRID_SIZE)
  const encontrados = new Map<string, OsmElement>()

  emit({ type: "progress", percent: 8, message: `Dividindo ${lugar.nome} em ${regioes.length} regiões…`, encontradas: 0 })

  // Uma região por vez: o servidor público do OpenStreetMap limita consultas simultâneas.
  for (const [i, regiao] of regioes.entries()) {
    emit({
      type: "progress",
      percent: Math.round(8 + (i / regioes.length) * 87),
      message: `Varrendo região ${i + 1} de ${regioes.length}…`,
      encontradas: encontrados.size,
    })
    const elementos = await consultarOverpass(montarQuery(filtros, regiao, lugar.areaId), signal)
    for (const el of elementos) encontrados.set(`${el.type}/${el.id}`, el)
  }

  emit({ type: "progress", percent: 97, message: "Separando quem não tem site…", encontradas: encontrados.size })

  const empresas = [...encontrados.values()]
    .map((el) => toEmpresa(el, lugar.nome))
    .filter((e): e is Empresa => e !== null)
    // quem tem telefone primeiro: dá para entrar em contato na hora
    .sort((a, b) => Number(!!b.telefone) - Number(!!a.telefone) || a.nome.localeCompare(b.nome, "pt-BR"))

  emit({ type: "progress", percent: 100, message: "Pronto!", encontradas: encontrados.size })
  emit({ type: "result", fonte: "osm", cidade: lugar.nome, nicho, analisadas: encontrados.size, empresas })
}
