// Dados mockados do site. Para usar dados reais, basta trocar estes arrays
// (ou carregá-los de uma API/CMS mantendo os mesmos tipos).

import { images, type ImageAsset } from "./images"

/* ------------------------------------------------------------------ */
/* Contato                                                             */
/* ------------------------------------------------------------------ */

export const contact = {
  // Número fictício: troque pelo WhatsApp real (formato internacional, só dígitos).
  whatsapp: "5511900000000",
  whatsappDisplay: "(11) 90000-0000",
  phone: "(11) 3000-0000",
  phoneHref: "tel:+551130000000",
  email: "contato@jardimaurora.com.br",
  address: "Rua das Magnólias, 214 — Vila Madalena",
  city: "São Paulo – SP",
  hours: [
    { days: "Segunda a sexta", time: "8h às 20h" },
    { days: "Sábado", time: "8h às 18h" },
    { days: "Domingo", time: "9h às 13h" },
  ],
  deliveryArea:
    "Zona Oeste, Centro e Zona Sul de São Paulo. Pedidos até as 16h são entregues no mesmo dia.",
  social: {
    instagram: "https://www.instagram.com/",
    facebook: "https://www.facebook.com/",
  },
  whatsappMessage: "Olá, Jardim Aurora! Gostaria de encomendar um buquê.",
  customArrangementMessage:
    "Olá, Jardim Aurora! Quero montar um arranjo personalizado. Pode me ajudar?",
} as const

export const navLinks = [
  { label: "Início", href: "#inicio" },
  { label: "Buquês", href: "#buques" },
  { label: "Arranjos", href: "#arranjos" },
  { label: "Sobre", href: "#sobre" },
  { label: "Contato", href: "#contato" },
] as const

/* ------------------------------------------------------------------ */
/* Buquês                                                              */
/* ------------------------------------------------------------------ */

export type BouquetFilter = "todos" | "rosas" | "campo" | "premium"

export type Bouquet = {
  id: string
  name: string
  flowers: string
  price: number
  badge?: "Mais vendido" | "Novo"
  category: Exclude<BouquetFilter, "todos">
  image: ImageAsset
}

export const bouquetFilters: { value: BouquetFilter; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "rosas", label: "Rosas" },
  { value: "campo", label: "Campo" },
  { value: "premium", label: "Premium" },
]

export const bouquets: Bouquet[] = [
  {
    id: "buque-aurora",
    name: "Buquê Aurora",
    flowers: "Peônias rosadas, eucalipto e lisianthus",
    price: 289.9,
    badge: "Mais vendido",
    category: "premium",
    image: images.peonias,
  },
  {
    id: "rosas-classicas",
    name: "Rosas Clássicas",
    flowers: "12 rosas cor-de-rosa e folhagens nobres",
    price: 189.9,
    badge: "Mais vendido",
    category: "rosas",
    image: images.rosasRosa,
  },
  {
    id: "campo-dourado",
    name: "Campo Dourado",
    flowers: "Tulipas, narcisos e ranúnculos",
    price: 159.9,
    badge: "Novo",
    category: "campo",
    image: images.tulipas,
  },
  {
    id: "kraft-silvestre",
    name: "Kraft Silvestre",
    flowers: "Flores do campo e folhagens em papel kraft",
    price: 129.9,
    category: "campo",
    image: images.kraft,
  },
  {
    id: "branco-sereno",
    name: "Branco Sereno",
    flowers: "Rosas brancas e champanhe com folhagens",
    price: 219.9,
    category: "rosas",
    image: images.rosasBrancas,
  },
  {
    id: "por-do-sol",
    name: "Pôr do Sol Tropical",
    flowers: "Flores tropicais em tons de laranja e coral",
    price: 249.9,
    badge: "Novo",
    category: "premium",
    image: images.tropical,
  },
]

/* ------------------------------------------------------------------ */
/* Categorias                                                          */
/* ------------------------------------------------------------------ */

export type Category = {
  id: string
  name: string
  description: string
  image: ImageAsset
  /** Ao clicar, aplica este filtro na vitrine de buquês. */
  filter?: Exclude<BouquetFilter, "todos">
  href: string
}

export const categories: Category[] = [
  {
    id: "rosas",
    name: "Rosas",
    description: "O clássico que nunca sai de moda, em todas as cores.",
    image: images.catRosas,
    filter: "rosas",
    href: "#buques",
  },
  {
    id: "flores-do-campo",
    name: "Flores do campo",
    description: "Leveza e cor, colhidas pela manhã.",
    image: images.catCampo,
    filter: "campo",
    href: "#buques",
  },
  {
    id: "orquideas",
    name: "Orquídeas",
    description: "Elegância que dura semanas.",
    image: images.catOrquideas,
    filter: "premium",
    href: "#buques",
  },
  {
    id: "arranjos-de-mesa",
    name: "Arranjos de mesa",
    description: "Para jantares, eventos e a sala de casa.",
    image: images.catMesa,
    href: "#buques",
  },
  {
    id: "presentes",
    name: "Presentes",
    description: "Flores em caixa, cartões e mimos.",
    image: images.catPresentes,
    href: "#buques",
  },
]

/* ------------------------------------------------------------------ */
/* Números, passos, diferenciais e depoimentos                          */
/* ------------------------------------------------------------------ */

export type Stat = {
  value: number
  decimals?: number
  prefix?: string
  suffix?: string
  label: string
}

export const stats: Stat[] = [
  { value: 15000, prefix: "+", label: "buquês entregues" },
  { value: 100, suffix: "%", label: "flores colhidas diariamente" },
  { value: 5, decimals: 1, suffix: "★", label: "avaliação dos clientes" },
  { value: 2, suffix: "h", label: "tempo médio de entrega" },
]

export const marqueeFlowers = [
  "Rosas",
  "Peônias",
  "Tulipas",
  "Orquídeas",
  "Girassóis",
  "Lírios",
  "Hortênsias",
  "Flores do campo",
]

export type StepIcon = "flower" | "card" | "delivery"

export const steps: { icon: StepIcon; title: string; description: string }[] = [
  {
    icon: "flower",
    title: "Escolha seu buquê",
    description: "Navegue pela vitrine ou peça um arranjo sob medida para a ocasião.",
  },
  {
    icon: "card",
    title: "Personalize com cartão",
    description: "Escreva sua mensagem. Imprimimos em papel texturizado e selamos com carinho.",
  },
  {
    icon: "delivery",
    title: "Receba no mesmo dia",
    description: "Pedidos até as 16h chegam no mesmo dia, com flores frescas e hidratadas.",
  },
]

export type FeatureIcon = "fresh" | "handmade" | "fast" | "eco"

export const features: { icon: FeatureIcon; title: string; description: string }[] = [
  {
    icon: "fresh",
    title: "Flores sempre frescas",
    description: "Recebemos flores de produtores locais todas as manhãs. Nada fica mais de dois dias na vitrine.",
  },
  {
    icon: "handmade",
    title: "Montagem artesanal",
    description: "Cada buquê é montado à mão pelas nossas floristas, com atenção à cor, à textura e ao perfume.",
  },
  {
    icon: "fast",
    title: "Entrega rápida",
    description: "Entregamos em cerca de 2 horas na região, com o buquê protegido e hidratado no caminho.",
  },
  {
    icon: "eco",
    title: "Embalagem sustentável",
    description: "Papel reciclado, fitas de algodão e nenhum plástico descartável.",
  },
]

export type Testimonial = {
  name: string
  occasion: string
  rating: number
  text: string
}

export const testimonials: Testimonial[] = [
  {
    name: "Mariana Costa",
    occasion: "Aniversário de casamento",
    rating: 5,
    text: "Encomendei às 11h e às 15h o buquê já estava com a minha esposa. As peônias duraram mais de uma semana, lindas do primeiro ao último dia.",
  },
  {
    name: "Rafael Mendes",
    occasion: "Dia das Mães",
    rating: 5,
    text: "Pedi algo delicado e a florista montou um arranjo que parecia feito para a minha mãe. O cartão escrito à mão foi o detalhe que a fez chorar.",
  },
  {
    name: "Juliana Ferraz",
    occasion: "Jantar em casa",
    rating: 5,
    text: "Os arranjos de mesa deixaram o jantar com cara de restaurante. Atendimento atencioso pelo WhatsApp e entrega pontual.",
  },
]
