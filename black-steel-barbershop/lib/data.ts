// Dados mockados do site. Troque aqui pelos dados reais (ou por uma API/CMS)
// sem precisar mexer nos componentes.

export type Service = {
  id: string
  name: string
  description: string
  price: number
  duration: string
  image: string
  featured?: boolean
}

export type GalleryItem = {
  src: string
  alt: string
  caption: string
  /** Ocupa duas linhas no grid (desktop). */
  tall?: boolean
  /** Ocupa duas colunas no grid (desktop). */
  wide?: boolean
}

export type Testimonial = {
  name: string
  role: string
  rating: number
  text: string
}

const unsplash = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`

export const site = {
  name: "Black Steel",
  fullName: "Black Steel Barbershop",
  tagline: "Barbearia clássica. Atitude moderna.",
  whatsapp: "5511999999999",
  whatsappMessage: "Olá! Gostaria de agendar um horário na Black Steel.",
  phone: "(11) 99999-9999",
  email: "contato@blacksteel.com.br",
  address: {
    street: "Rua Augusta, 1500",
    district: "Consolação",
    city: "São Paulo - SP",
    zip: "01304-001",
  },
  hours: [
    { days: "Terça a sexta", time: "09h às 20h" },
    { days: "Sábado", time: "08h às 18h" },
    { days: "Domingo e segunda", time: "Fechado" },
  ],
  social: {
    instagram: "https://instagram.com/",
    facebook: "https://facebook.com/",
    tiktok: "https://tiktok.com/",
  },
}

export const whatsappUrl = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(site.whatsappMessage)}`

export const navLinks = [
  { label: "Início", href: "#inicio" },
  { label: "Serviços", href: "#servicos" },
  { label: "Galeria", href: "#galeria" },
  { label: "Sobre", href: "#sobre" },
  { label: "Contato", href: "#contato" },
]

export const images = {
  hero: unsplash("photo-1503951914875-452162b0f3f1", 2000),
  about: unsplash("photo-1585747860715-2ba37e788b70", 1400),
}

export const stats = [
  { value: 8, prefix: "+", suffix: "", label: "Anos de tradição" },
  { value: 10000, prefix: "+", suffix: "", label: "Cortes realizados" },
  { value: 5, prefix: "", suffix: ".0", label: "Avaliação dos clientes", stars: true },
]

export const services: Service[] = [
  {
    id: "corte-classico",
    name: "Corte Clássico",
    description: "Tesoura e máquina, acabamento na navalha e finalização com pomada.",
    price: 70,
    duration: "45 min",
    image: unsplash("photo-1621605815971-fbc98d665033", 900),
  },
  {
    id: "barba-completa",
    name: "Barba Completa",
    description: "Toalha quente, óleo pré-barba, navalha e hidratação pós-barba.",
    price: 55,
    duration: "35 min",
    image: unsplash("photo-1599351431202-1e0f0137899a", 900),
  },
  {
    id: "combo",
    name: "Combo Corte + Barba",
    description: "A experiência completa Black Steel, com drink de cortesia.",
    price: 110,
    duration: "1h 20min",
    image: unsplash("photo-1622286342621-4bd786c2447c", 900),
    featured: true,
  },
  {
    id: "tratamento-capilar",
    name: "Tratamento Capilar",
    description: "Esfoliação do couro cabeludo, máscara nutritiva e massagem relaxante.",
    price: 90,
    duration: "40 min",
    image: unsplash("photo-1605497788044-5a32c7078486", 900),
  },
  {
    id: "sobrancelha",
    name: "Sobrancelha",
    description: "Alinhamento na navalha ou pinça, mantendo o traço natural.",
    price: 30,
    duration: "15 min",
    image: unsplash("photo-1512690459411-b9245aed614b", 900),
  },
]

export const gallery: GalleryItem[] = [
  {
    src: unsplash("photo-1585747860715-2ba37e788b70"),
    alt: "Salão da barbearia com cadeiras de couro e espelhos",
    caption: "O espaço",
    tall: true,
  },
  {
    src: unsplash("photo-1503951914875-452162b0f3f1"),
    alt: "Barbeiro finalizando um corte com máquina",
    caption: "Precisão no detalhe",
    wide: true,
  },
  {
    src: unsplash("photo-1599351431202-1e0f0137899a"),
    alt: "Barba sendo aparada com navalha",
    caption: "Barba na navalha",
  },
  {
    src: unsplash("photo-1621605815971-fbc98d665033"),
    alt: "Cliente de perfil após um corte degradê",
    caption: "Degradê clássico",
  },
  {
    src: unsplash("photo-1622286342621-4bd786c2447c"),
    alt: "Barbeiro atendendo um cliente na cadeira",
    caption: "Bastidores",
    wide: true,
  },
  {
    src: unsplash("photo-1596728325488-58c87691e9af"),
    alt: "Ferramentas de barbeiro organizadas sobre a bancada",
    caption: "Ferramentas do ofício",
  },
]

export const features = [
  {
    icon: "scissors",
    title: "Barbeiros experientes",
    text: "Profissionais com anos de cadeira e formação contínua em técnicas clássicas e atuais.",
  },
  {
    icon: "droplet",
    title: "Produtos premium",
    text: "Pomadas, óleos e loções de marcas selecionadas, escolhidas para cada tipo de fio e pele.",
  },
  {
    icon: "armchair",
    title: "Ambiente exclusivo",
    text: "Estética industrial, música boa, café e cerveja gelada. Um lugar feito para você ficar.",
  },
  {
    icon: "calendar",
    title: "Agendamento facilitado",
    text: "Marque pelo WhatsApp em poucos segundos e seja atendido sem espera.",
  },
] as const

export const testimonials: Testimonial[] = [
  {
    name: "Rafael Monteiro",
    role: "Cliente desde 2019",
    rating: 5,
    text: "Melhor barbearia que já frequentei. Atendimento no horário, corte impecável e um ambiente que dá vontade de ficar.",
  },
  {
    name: "Lucas Andrade",
    role: "Cliente desde 2021",
    rating: 5,
    text: "A barba na toalha quente é outro nível. Saio de lá renovado toda vez. Vale cada centavo.",
  },
  {
    name: "Eduardo Pires",
    role: "Cliente desde 2018",
    rating: 5,
    text: "Os barbeiros entendem exatamente o que você quer. Profissionalismo do começo ao fim.",
  },
]
