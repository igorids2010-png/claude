/**
 * Todos os textos, imagens e contatos do site ficam aqui.
 * Para adaptar a um cliente real, basta trocar os valores deste arquivo.
 * (Site demonstrativo: nome, contatos e registros são fictícios/placeholders.)
 */

const unsplash = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const clinic = {
  name: "Lumen",
  suffix: "Odontologia",
  tagline: "Odontologia estética & reabilitação oral",
  phone: "(00) 0000-0000",
  whatsapp: "(00) 00000-0000",
  whatsappLink: "#contato",
  email: "contato@suaclinica.com.br",
  address: "[Endereço da clínica], [Número] — [Bairro]",
  city: "[Cidade] — [UF]",
  hours: [
    { days: "Segunda a sexta", time: "08h às 20h" },
    { days: "Sábado", time: "08h às 13h" },
  ],
  technicalManager: "Responsável técnico: [Nome do(a) Dentista] — CRO-[UF] [número]",
  legalId: "CNPJ: [00.000.000/0000-00]",
};

export const navLinks = [
  { label: "Início", href: "#inicio" },
  { label: "Tratamentos", href: "#tratamentos" },
  { label: "Sobre", href: "#sobre" },
  { label: "Diferenciais", href: "#diferenciais" },
  { label: "Depoimentos", href: "#depoimentos" },
  { label: "Contato", href: "#contato" },
];

export const hero = {
  eyebrow: "Odontologia de alto padrão",
  titleStart: "Transforme seu",
  titleHighlight: "sorriso",
  titleEnd: "transforme sua confiança.",
  subtitle:
    "Tecnologia digital de última geração, planejamento 3D do sorriso e uma equipe de especialistas dedicada a resultados naturais — em um ambiente pensado para o seu conforto.",
  primaryCta: { label: "Agende sua avaliação", href: "#contato" },
  secondaryCta: { label: "Conheça os tratamentos", href: "#tratamentos" },
  image: unsplash("photo-1606811971618-4486d14f3f99", 2400),
  rating: "4,9",
  patients: "+12.000",
  avatars: [
    unsplash("photo-1494790108377-be9c29b29330", 120),
    unsplash("photo-1500648767791-00dcc994a43e", 120),
    unsplash("photo-1438761681033-6461ffad8d80", 120),
    unsplash("photo-1506794778202-cad84cf45f1d", 120),
  ],
};

export const stats = [
  { value: 15, suffix: "+", label: "Anos de experiência", description: "Excelência clínica comprovada" },
  { value: 12000, suffix: "+", label: "Pacientes atendidos", description: "Sorrisos transformados" },
  { value: 4.9, suffix: "/5", decimals: 1, label: "Avaliação média", description: "Mais de 1.800 avaliações" },
  { value: 98, suffix: "%", label: "Indicam a clínica", description: "Satisfação dos pacientes" },
];

export type Treatment = {
  slug: string;
  icon: "smile" | "sparkles" | "gem" | "scan";
  title: string;
  description: string;
  image: string;
  tag: string;
};

export const treatments: Treatment[] = [
  {
    slug: "ortodontia",
    icon: "scan",
    title: "Ortodontia Invisível",
    description:
      "Alinhadores transparentes planejados digitalmente, discretos e confortáveis, para alinhar seu sorriso sem aparelho metálico.",
    image: unsplash("photo-1588776814546-1ffcf47267a5", 900),
    tag: "Alinhadores",
  },
  {
    slug: "clareamento",
    icon: "sparkles",
    title: "Clareamento Dental",
    description:
      "Protocolos combinados de consultório e caseiro que deixam os dentes até 8 tons mais claros, com segurança e sensibilidade mínima.",
    image: unsplash("photo-1580489944761-15a19d654956", 900),
    tag: "Estética",
  },
  {
    slug: "implantes",
    icon: "gem",
    title: "Implantes Dentários",
    description:
      "Cirurgia guiada por tomografia 3D, com implantes de titânio de alta durabilidade e recuperação rápida e previsível.",
    image: unsplash("photo-1629909613654-28e377c37b09", 900),
    tag: "Reabilitação",
  },
  {
    slug: "estetica",
    icon: "smile",
    title: "Lentes & Facetas",
    description:
      "Lentes de contato dental em porcelana ultrafina, desenhadas no Digital Smile Design para um sorriso harmônico e natural.",
    image: unsplash("photo-1531123897727-8f129e1688ce", 900),
    tag: "Design do Sorriso",
  },
];

export type Differential = {
  icon: "cpu" | "shield" | "armchair" | "award" | "heart" | "calendar";
  title: string;
  description: string;
};

export const about = {
  eyebrow: "Sobre a clínica",
  title: "Onde ciência, arte e acolhimento se encontram.",
  text: "Há mais de 15 anos, reunimos especialistas em cada área da odontologia sob o mesmo teto. Cada tratamento começa com uma escuta atenta e um planejamento digital completo — para que você saiba exatamente o resultado antes mesmo de começar.",
  image: unsplash("photo-1629909615184-74f495363b67", 1200),
  secondaryImage: unsplash("photo-1598256989800-fe5f95da9787", 800),
  highlights: ["Especialistas com pós-graduação", "Planejamento 100% digital", "Materiais importados certificados"],
};

export const differentials: Differential[] = [
  {
    icon: "cpu",
    title: "Tecnologia digital",
    description: "Scanner intraoral, tomografia 3D e fresagem em consultório para tratamentos precisos e mais rápidos.",
  },
  {
    icon: "award",
    title: "Especialistas renomados",
    description: "Corpo clínico com mestres e especialistas em cada área, em constante atualização.",
  },
  {
    icon: "armchair",
    title: "Conforto absoluto",
    description: "Ambiente acolhedor, sedação consciente e protocolos para quem tem medo de dentista.",
  },
  {
    icon: "shield",
    title: "Biossegurança rigorosa",
    description: "Esterilização com rastreabilidade e padrões hospitalares em todos os procedimentos.",
  },
  {
    icon: "heart",
    title: "Atendimento humanizado",
    description: "Tempo dedicado a cada paciente, com escuta ativa e plano de tratamento transparente.",
  },
  {
    icon: "calendar",
    title: "Agenda flexível",
    description: "Horários estendidos e aos sábados, com lembretes automáticos e pontualidade.",
  },
];

export type Transformation = {
  title: string;
  treatment: string;
  duration: string;
  image: string;
};

export const gallery = {
  eyebrow: "Antes & depois",
  title: "Transformações que falam por si.",
  featured: {
    title: "Clareamento + lentes de contato",
    duration: "4 semanas",
    image: unsplash("photo-1573496359142-b8d87734a5a2", 1600),
  },
  items: [
    { title: "Clareamento a laser", treatment: "Estética", duration: "2 sessões", image: unsplash("photo-1494790108377-be9c29b29330", 900) },
    { title: "Alinhadores invisíveis", treatment: "Ortodontia", duration: "10 meses", image: unsplash("photo-1500648767791-00dcc994a43e", 900) },
    { title: "Facetas em porcelana", treatment: "Design do Sorriso", duration: "3 semanas", image: unsplash("photo-1544005313-94ddf0286df2", 900) },
    { title: "Reabilitação com implantes", treatment: "Implantodontia", duration: "4 meses", image: unsplash("photo-1472099645785-5658abf4ff4e", 900) },
  ] satisfies Transformation[],
  disclaimer: "Imagens meramente ilustrativas. Resultados variam de acordo com cada caso clínico.",
};

export type Testimonial = {
  name: string;
  role: string;
  treatment: string;
  rating: number;
  text: string;
  avatar: string;
};

export const testimonials: Testimonial[] = [
  {
    name: "Mariana A.",
    role: "Arquiteta",
    treatment: "Lentes de contato dental",
    rating: 5,
    text: "Eu escondia o sorriso nas fotos há anos. O planejamento digital me mostrou o resultado antes de começar — e ficou exatamente como eu sonhava. Natural e lindo.",
    avatar: unsplash("photo-1438761681033-6461ffad8d80", 200),
  },
  {
    name: "Rafael M.",
    role: "Empresário",
    treatment: "Implantes dentários",
    rating: 5,
    text: "Atendimento impecável do início ao fim. A cirurgia foi rápida, sem dor, e a equipe me acompanhou em cada etapa. Recomendo de olhos fechados.",
    avatar: unsplash("photo-1506794778202-cad84cf45f1d", 200),
  },
  {
    name: "Juliana S.",
    role: "Advogada",
    treatment: "Alinhadores invisíveis",
    rating: 5,
    text: "Ninguém percebia que eu estava usando aparelho. Em menos de um ano meu sorriso mudou completamente. A clínica é linda e super acolhedora.",
    avatar: unsplash("photo-1534528741775-53994a69daeb", 200),
  },
  {
    name: "Carlos E.",
    role: "Médico",
    treatment: "Clareamento dental",
    rating: 5,
    text: "Como profissional da saúde, sou exigente com biossegurança. Fiquei impressionado com o nível de cuidado e com o resultado do clareamento.",
    avatar: unsplash("photo-1500648767791-00dcc994a43e", 200),
  },
  {
    name: "Beatriz L.",
    role: "Designer",
    treatment: "Design do sorriso",
    rating: 5,
    text: "Tinha muito medo de dentista e aqui foi a primeira vez que me senti totalmente tranquila. Hoje sorrio sem pensar duas vezes.",
    avatar: unsplash("photo-1544005313-94ddf0286df2", 200),
  },
];

export const finalCta = {
  eyebrow: "Sua primeira consulta",
  title: "Seu novo sorriso começa com uma conversa.",
  text: "Agende uma avaliação completa com escaneamento digital e simulação do seu novo sorriso. Sem compromisso.",
  treatmentsOptions: ["Avaliação geral", "Ortodontia invisível", "Clareamento", "Implantes", "Lentes & facetas"],
};

export const socials = [
  { label: "Instagram", href: "#", icon: "instagram" },
  { label: "Facebook", href: "#", icon: "facebook" },
  { label: "YouTube", href: "#", icon: "youtube" },
  { label: "WhatsApp", href: "#contato", icon: "whatsapp" },
] as const;
