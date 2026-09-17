/**
 * Dados institucionais da Marco Prime. Empresa fictícia — todos os dados de
 * contato, CRECI e endereço são ilustrativos.
 */
export const site = {
  name: "Marco Prime",
  fullName: "Marco Prime Imóveis",
  tagline: "Imóveis comerciais de alto padrão",
  creci: "CRECI-SP 00.000-J",
  phone: "+55 11 4000-0000",
  phoneHref: "tel:+551140000000",
  whatsapp: "+55 11 99000-0000",
  whatsappHref: "https://wa.me/5511990000000",
  email: "contato@marcoprime.com.br",
  emailHref: "mailto:contato@marcoprime.com.br",
  address: {
    street: "Av. Brigadeiro Faria Lima, 3.900 — 18º andar",
    district: "Itaim Bibi",
    city: "São Paulo",
    state: "SP",
    zip: "04538-132",
  },
  hours: "Segunda a sexta, das 9h às 19h",
} as const;

export type NavItem = { label: string; href: string };

export const navigation: NavItem[] = [
  { label: "Início", href: "#inicio" },
  { label: "Imóveis", href: "#imoveis" },
  { label: "Sobre", href: "#sobre" },
  { label: "Diferenciais", href: "#diferenciais" },
  { label: "Contato", href: "#contato" },
];

export const socials: NavItem[] = [
  { label: "LinkedIn", href: "https://www.linkedin.com/" },
  { label: "Instagram", href: "https://www.instagram.com/" },
  { label: "YouTube", href: "https://www.youtube.com/" },
];
