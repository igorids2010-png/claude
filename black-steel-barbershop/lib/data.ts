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
  tagline: "Classic barbershop. Modern attitude.",
  whatsapp: "5511999999999",
  whatsappMessage: "Hi! I'd like to book an appointment at Black Steel.",
  phone: "(11) 99999-9999",
  email: "hello@blacksteel.com.br",
  address: {
    street: "Rua Augusta, 1500",
    district: "Consolação",
    city: "São Paulo - SP",
    zip: "01304-001",
  },
  hours: [
    { days: "Tuesday to Friday", time: "9am – 8pm" },
    { days: "Saturday", time: "8am – 6pm" },
    { days: "Sunday & Monday", time: "Closed" },
  ],
  social: {
    instagram: "https://instagram.com/",
    facebook: "https://facebook.com/",
    tiktok: "https://tiktok.com/",
  },
}

export const whatsappUrl = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(site.whatsappMessage)}`

export const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Services", href: "#services" },
  { label: "Gallery", href: "#gallery" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
]

export const images = {
  // `position` é o ponto focal da foto (object-position), útil para o corte no celular.
  // Salão vazio: parede de tijolos, espelhos e cadeiras pretas do lado direito da foto.
  hero: { src: unsplash("photo-1585747860715-2ba37e788b70", 2400), position: "68% 50%" },
  about: unsplash("photo-1633681926022-84c23e8cb2d6", 1400),
}

export const marqueeItems = [
  "Classic cut",
  "Straight-razor shave",
  "Hot towel",
  "Hair treatment",
  "Brow grooming",
  "Cut + beard combo",
]

export const stats = [
  { value: 8, prefix: "+", suffix: "", label: "Years of tradition" },
  { value: 10000, prefix: "+", suffix: "", label: "Haircuts delivered" },
  { value: 5, prefix: "", suffix: ".0", label: "Client rating", stars: true },
]

export const services: Service[] = [
  {
    id: "classic-cut",
    name: "Classic Cut",
    description: "Scissors and clippers, a straight-razor finish and styled with pomade.",
    price: 45,
    duration: "45 min",
    image: unsplash("photo-1512864084360-7c0c4d0a0845", 900),
  },
  {
    id: "full-beard",
    name: "Full Beard",
    description: "Hot towel, pre-shave oil, straight razor and post-shave hydration.",
    price: 35,
    duration: "35 min",
    image: unsplash("photo-1532710093739-9470acff878f", 900),
  },
  {
    id: "combo",
    name: "Cut + Beard Combo",
    description: "The complete Black Steel experience, with a complimentary drink.",
    price: 70,
    duration: "1h 20 min",
    image: unsplash("photo-1503951914875-452162b0f3f1", 900),
    featured: true,
  },
  {
    id: "hair-treatment",
    name: "Hair Treatment",
    description: "Scalp exfoliation, a nourishing mask and a relaxing massage.",
    price: 55,
    duration: "40 min",
    image: unsplash("photo-1590540179852-2110a54f813a", 900),
  },
  {
    id: "brow-grooming",
    name: "Brow Grooming",
    description: "Shaped with a razor or tweezers, keeping a natural line.",
    price: 20,
    duration: "15 min",
    image: unsplash("photo-1654097800183-574ba7368f74", 900),
  },
]

export const gallery: GalleryItem[] = [
  {
    src: unsplash("photo-1621645582931-d1d3e6564943"),
    alt: "Barber chair facing the mirror in the empty shop",
    caption: "The chair",
    tall: true,
  },
  {
    src: unsplash("photo-1633681926035-ec1ac984418a"),
    alt: "Shop floor with black leather chairs, mirrors and a chandelier",
    caption: "The shop",
    wide: true,
  },
  {
    src: unsplash("photo-1596728325488-58c87691e9af"),
    alt: "Barber giving a client a straight-razor shave",
    caption: "Straight-razor shave",
  },
  {
    src: unsplash("photo-1635273051839-003bf06a8751"),
    alt: "Clipper cut, close-up of the fade",
    caption: "Clipper fade",
  },
  {
    src: unsplash("photo-1593702288056-7927b442d0fa"),
    alt: "Barber working on a client in the chair",
    caption: "Behind the scenes",
  },
  {
    src: unsplash("photo-1587909209111-5097ee578ec3"),
    alt: "Comb and a jar of shaving cream on the wooden counter",
    caption: "Tools of the trade",
  },
]

export const features = [
  {
    icon: "scissors",
    title: "Experienced barbers",
    text: "Professionals with years behind the chair and ongoing training in classic and modern techniques.",
  },
  {
    icon: "droplet",
    title: "Premium products",
    text: "Pomades, oils and lotions from hand-picked brands, chosen for every hair and skin type.",
  },
  {
    icon: "armchair",
    title: "Exclusive space",
    text: "Industrial look, good music, coffee and cold beer. A place made for you to stay a while.",
  },
  {
    icon: "calendar",
    title: "Easy booking",
    text: "Book on WhatsApp in seconds and get served with no wait.",
  },
] as const

export const testimonials: Testimonial[] = [
  {
    name: "Rafael Monteiro",
    role: "Client since 2019",
    rating: 5,
    text: "Best barbershop I've ever been to. Always on time, a flawless cut and a place that makes you want to stay.",
  },
  {
    name: "Lucas Andrade",
    role: "Client since 2021",
    rating: 5,
    text: "The hot-towel shave is on another level. I walk out feeling brand new every time. Worth every penny.",
  },
  {
    name: "Eduardo Pires",
    role: "Client since 2018",
    rating: 5,
    text: "The barbers get exactly what you want. Professional from start to finish.",
  },
]
