import { Gavel, Handshake, LifeBuoy, Sparkles, type LucideIcon } from "lucide-react";

export type Differential = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const differentials: Differential[] = [
  {
    icon: Sparkles,
    title: "Curadoria de imóveis",
    description:
      "Cada ativo passa por análise técnica, documental e de vizinhança antes de entrar no portfólio.",
  },
  {
    icon: Gavel,
    title: "Consultoria jurídica",
    description:
      "Equipe própria de due diligence para contratos, garantias e conformidade regulatória.",
  },
  {
    icon: Handshake,
    title: "Negociação especializada",
    description:
      "Estratégia de proposta baseada em dados de mercado, vacância e histórico de cada torre.",
  },
  {
    icon: LifeBuoy,
    title: "Suporte pós-venda",
    description:
      "Acompanhamento de mudança, projeto de layout e gestão do contrato durante toda a ocupação.",
  },
];
