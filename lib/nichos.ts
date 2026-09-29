// Catálogo de nichos. `osm` são filtros de tags do OpenStreetMap (formato Overpass);
// no Google o próprio nome do nicho vira o texto da busca.
export type Nicho = { nome: string; osm: string[] }
export type GrupoNichos = { titulo: string; nichos: Nicho[] }

const n = (nome: string, ...osm: string[]): Nicho => ({ nome, osm })

export const GRUPOS_NICHOS: GrupoNichos[] = [
  {
    titulo: "Saúde e bem-estar",
    nichos: [
      n("Clínica odontológica", '["amenity"="dentist"]', '["healthcare"="dentist"]'),
      n("Clínica médica", '["amenity"="clinic"]', '["healthcare"="clinic"]'),
      n("Consultório médico", '["amenity"="doctors"]', '["healthcare"="doctor"]'),
      n("Fisioterapia", '["healthcare"="physiotherapist"]'),
      n("Psicólogo", '["healthcare"="psychotherapist"]', '["office"="therapist"]'),
      n("Nutricionista", '["healthcare"="nutrition_counselling"]', '["healthcare"~"."]["name"~"nutri",i]'),
      n("Fonoaudiólogo", '["healthcare"="speech_therapist"]'),
      n("Podologia", '["healthcare"="podiatrist"]', '["shop"="beauty"]["name"~"podolog",i]'),
      n("Laboratório de análises", '["healthcare"="laboratory"]'),
      n("Farmácia", '["amenity"="pharmacy"]', '["shop"="chemist"]'),
      n("Ótica", '["shop"="optician"]'),
      n("Clínica veterinária", '["amenity"="veterinary"]'),
    ],
  },
  {
    titulo: "Beleza e estética",
    nichos: [
      n("Salão de beleza", '["shop"~"^(hairdresser|beauty)$"]'),
      n("Barbearia", '["shop"="hairdresser"]["hairdresser"="barber"]', '["shop"="hairdresser"]["name"~"barb",i]'),
      n("Clínica de estética", '["shop"="beauty"]', '["amenity"="clinic"]["name"~"est(e|é)tic",i]'),
      n("Manicure e nail designer", '["shop"="beauty"]["beauty"~"nails"]', '["shop"="beauty"]["name"~"unha|nail|manicure",i]'),
      n("Design de sobrancelhas", '["shop"="beauty"]["name"~"sobrancelha|brow|c(i|í)lio|lash",i]'),
      n("Depilação", '["shop"="beauty"]["name"~"depila",i]'),
      n("Estúdio de tatuagem", '["shop"="tattoo"]'),
      n("Massagem e spa", '["shop"="massage"]', '["leisure"="spa"]'),
      n("Loja de cosméticos", '["shop"~"^(cosmetics|perfumery)$"]'),
    ],
  },
  {
    titulo: "Alimentação",
    nichos: [
      n("Lanchonete", '["amenity"="fast_food"]'),
      n("Restaurante", '["amenity"="restaurant"]'),
      n("Pizzaria", '["amenity"~"^(restaurant|fast_food)$"]["cuisine"~"pizza"]', '["amenity"~"^(restaurant|fast_food)$"]["name"~"pizz",i]'),
      n("Hamburgueria", '["amenity"~"^(restaurant|fast_food)$"]["cuisine"~"burger"]', '["amenity"~"^(restaurant|fast_food)$"]["name"~"burg",i]'),
      n("Bar e boteco", '["amenity"~"^(bar|pub|biergarten)$"]'),
      n("Cafeteria", '["amenity"="cafe"]'),
      n("Padaria e confeitaria", '["shop"~"^(bakery|pastry|confectionery)$"]'),
      n("Sorveteria e açaí", '["amenity"="ice_cream"]', '["shop"="ice_cream"]', '["amenity"~"^(cafe|fast_food)$"]["name"~"a(c|ç)a(i|í)",i]'),
      n("Açougue", '["shop"="butcher"]'),
      n("Mercado e mercearia", '["shop"~"^(supermarket|convenience|general)$"]'),
      n("Hortifruti", '["shop"="greengrocer"]'),
      n("Adega e distribuidora", '["shop"~"^(alcohol|beverages)$"]'),
    ],
  },
  {
    titulo: "Automotivo",
    nichos: [
      n("Oficina mecânica", '["shop"="car_repair"]'),
      n("Borracharia", '["shop"="tyres"]'),
      n("Lava-rápido", '["amenity"="car_wash"]'),
      n("Autopeças", '["shop"="car_parts"]'),
      n("Oficina e loja de motos", '["shop"~"^(motorcycle|motorcycle_repair)$"]'),
      n("Autoescola", '["amenity"="driving_school"]'),
    ],
  },
  {
    titulo: "Casa e construção",
    nichos: [
      n("Material de construção", '["shop"~"^(hardware|doityourself|building_materials|trade)$"]'),
      n("Loja de móveis", '["shop"="furniture"]'),
      n("Vidraçaria", '["craft"="glaziery"]', '["shop"="glaziery"]'),
      n("Serralheria", '["craft"="metal_construction"]'),
      n("Marcenaria", '["craft"~"^(carpenter|joiner)$"]'),
      n("Chaveiro", '["shop"="locksmith"]', '["craft"~"^(locksmith|key_cutter)$"]'),
      n("Eletricista e encanador", '["craft"~"^(electrician|plumber)$"]'),
      n("Floricultura", '["shop"="florist"]'),
    ],
  },
  {
    titulo: "Comércio e moda",
    nichos: [
      n("Loja de roupas", '["shop"~"^(clothes|boutique|fashion)$"]'),
      n("Loja de calçados", '["shop"="shoes"]'),
      n("Joalheria e relojoaria", '["shop"~"^(jewelry|watches)$"]'),
      n("Pet shop", '["shop"~"^(pet|pet_grooming)$"]'),
      n("Celulares e assistência técnica", '["shop"~"^(mobile_phone|electronics|computer)$"]', '["craft"="electronics_repair"]'),
      n("Papelaria", '["shop"="stationery"]'),
      n("Loja de presentes", '["shop"="gift"]'),
      n("Bicicletaria", '["shop"="bicycle"]'),
      n("Loja de variedades", '["shop"="variety_store"]'),
    ],
  },
  {
    titulo: "Serviços",
    nichos: [
      n("Advocacia", '["office"="lawyer"]'),
      n("Contabilidade", '["office"~"^(accountant|tax_advisor)$"]'),
      n("Imobiliária", '["office"="estate_agent"]', '["shop"="estate_agent"]'),
      n("Corretora de seguros", '["office"="insurance"]'),
      n("Agência de viagens", '["shop"="travel_agency"]', '["office"="travel_agent"]'),
      n("Gráfica", '["shop"="copyshop"]', '["craft"="printer"]'),
      n("Fotógrafo", '["shop"="photo"]', '["craft"="photographer"]'),
      n("Lavanderia", '["shop"~"^(laundry|dry_cleaning)$"]'),
      n("Costureira e ateliê", '["shop"="tailor"]', '["craft"~"^(dressmaker|tailor)$"]'),
    ],
  },
  {
    titulo: "Educação e lazer",
    nichos: [
      n("Academia", '["leisure"="fitness_centre"]'),
      n("Pilates e yoga", '["leisure"="fitness_centre"]["name"~"pilates|yoga",i]', '["sport"~"yoga|pilates"]'),
      n("Escola de idiomas", '["amenity"="language_school"]'),
      n("Escola de música", '["amenity"="music_school"]'),
      n("Escola infantil", '["amenity"="kindergarten"]'),
      n("Hotel e pousada", '["tourism"~"^(hotel|guest_house|hostel|motel)$"]'),
      n("Salão de festas", '["amenity"="events_venue"]'),
    ],
  },
]

const TODOS = new Map(GRUPOS_NICHOS.flatMap((g) => g.nichos.map((nicho) => [nicho.nome, nicho] as const)))

// Caracteres especiais viram "." (qualquer caractere) para não quebrar a consulta.
function termoDeBusca(texto: string) {
  return texto.trim().replace(/[\\^$.*+?()[\]{}|"']/g, ".")
}

// Nicho do catálogo, ou um nicho digitado buscado pelo nome do estabelecimento.
export function resolverNicho(nome: string): Nicho {
  const conhecido = TODOS.get(nome)
  if (conhecido) return conhecido
  const termo = termoDeBusca(nome)
  return {
    nome,
    osm: ["shop", "amenity", "office", "craft", "leisure", "healthcare"].map((k) => `["${k}"]["name"~"${termo}",i]`),
  }
}
