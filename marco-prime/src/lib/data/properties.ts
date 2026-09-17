/**
 * Dados mockados dos imóveis. A estrutura espelha o que uma API retornaria —
 * para plugar dados reais, basta substituir `properties` por um fetch que
 * devolva `Property[]`.
 */
export type PropertyType =
  | "Escritório"
  | "Sala comercial"
  | "Galpão logístico"
  | "Prédio corporativo";

export type PropertyBadge = "Novo" | "Exclusivo" | "Oportunidade";

export type Property = {
  id: string;
  slug: string;
  title: string;
  type: PropertyType;
  /** Bairro / região usada também no filtro de busca. */
  region: string;
  city: string;
  state: string;
  /** Área privativa em m². */
  area: number;
  /** Valor mensal de locação ou de venda, em reais. */
  price: number;
  transaction: "Locação" | "Venda";
  badge?: PropertyBadge;
  image: string;
  imageAlt: string;
  highlights: string[];
};

export const properties: Property[] = [
  {
    id: "mp-001",
    slug: "torre-faria-lima-conjunto-integral",
    title: "Torre Faria Lima — Conjunto Integral",
    type: "Escritório",
    region: "Itaim Bibi",
    city: "São Paulo",
    state: "SP",
    area: 1240,
    price: 285000,
    transaction: "Locação",
    badge: "Exclusivo",
    image: "/images/imovel-01.svg",
    imageAlt:
      "Fachada de torre corporativa envidraçada com linhas verticais iluminadas ao entardecer",
    highlights: ["Laje corrida", "Certificação LEED Gold", "40 vagas"],
  },
  {
    id: "mp-002",
    slug: "edificio-berrini-sala-premium",
    title: "Edifício Berrini — Sala Premium",
    type: "Sala comercial",
    region: "Brooklin",
    city: "São Paulo",
    state: "SP",
    area: 186,
    price: 24800,
    transaction: "Locação",
    badge: "Novo",
    image: "/images/imovel-02.svg",
    imageAlt:
      "Edifício comercial moderno com fachada em vidro e concreto vista de baixo para cima",
    highlights: ["Entrega mobiliada", "Piso elevado", "4 vagas"],
  },
  {
    id: "mp-003",
    slug: "centro-logistico-anhanguera",
    title: "Centro Logístico Anhanguera",
    type: "Galpão logístico",
    region: "Cajamar",
    city: "Cajamar",
    state: "SP",
    area: 9800,
    price: 268000,
    transaction: "Locação",
    image: "/images/imovel-03.svg",
    imageAlt:
      "Galpão logístico de grande porte com docas alinhadas e pátio de manobras",
    highlights: ["Pé-direito 12 m", "24 docas", "Piso 6 t/m²"],
  },
  {
    id: "mp-004",
    slug: "prédio-corporativo-vila-olimpia",
    title: "Prédio Corporativo Vila Olímpia",
    type: "Prédio corporativo",
    region: "Vila Olímpia",
    city: "São Paulo",
    state: "SP",
    area: 6400,
    price: 96000000,
    transaction: "Venda",
    badge: "Exclusivo",
    image: "/images/imovel-04.svg",
    imageAlt:
      "Prédio corporativo monolítico com brises verticais e recuo ajardinado na base",
    highlights: ["Monousuário", "Heliponto", "180 vagas"],
  },
  {
    id: "mp-005",
    slug: "conjunto-jk-financial-district",
    title: "Conjunto JK — Financial District",
    type: "Escritório",
    region: "Cidade Monções",
    city: "São Paulo",
    state: "SP",
    area: 520,
    price: 82000,
    transaction: "Locação",
    badge: "Oportunidade",
    image: "/images/imovel-05.svg",
    imageAlt:
      "Interior de andar corporativo vazio com pilares esbeltos e janelas do piso ao teto",
    highlights: ["Vista permanente", "Triple A", "18 vagas"],
  },
  {
    id: "mp-006",
    slug: "hub-industrial-campinas",
    title: "Hub Industrial Campinas",
    type: "Galpão logístico",
    region: "Campinas",
    city: "Campinas",
    state: "SP",
    area: 15600,
    price: 58000000,
    transaction: "Venda",
    badge: "Novo",
    image: "/images/imovel-06.svg",
    imageAlt:
      "Complexo industrial visto do alto, com telhado metálico e acessos pavimentados",
    highlights: ["Acesso à Anhanguera", "Energia 2 MW", "Área de expansão"],
  },
];

/** Opções derivadas dos dados — mantêm os filtros sincronizados com o catálogo. */
export const propertyTypes = [
  "Escritório",
  "Sala comercial",
  "Galpão logístico",
  "Prédio corporativo",
] as const satisfies readonly PropertyType[];

export const regions = Array.from(
  new Set(properties.map((property) => property.region)),
).sort((a, b) => a.localeCompare(b, "pt-BR"));

export type AreaRange = {
  value: string;
  label: string;
  min: number;
  max: number;
};

export const areaRanges: AreaRange[] = [
  { value: "ate-250", label: "Até 250 m²", min: 0, max: 250 },
  { value: "250-1000", label: "250 a 1.000 m²", min: 250, max: 1000 },
  { value: "1000-5000", label: "1.000 a 5.000 m²", min: 1000, max: 5000 },
  { value: "acima-5000", label: "Acima de 5.000 m²", min: 5000, max: Infinity },
];
