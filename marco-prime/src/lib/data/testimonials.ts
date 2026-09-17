export type Testimonial = {
  id: string;
  quote: string;
  name: string;
  role: string;
  company: string;
  initials: string;
};

export const testimonials: Testimonial[] = [
  {
    id: "t-01",
    quote:
      "Precisávamos de mil metros quadrados na Faria Lima em noventa dias. A Marco Prime apresentou três opções reais na primeira semana e conduziu a negociação até a assinatura.",
    name: "Helena Vasconcelos",
    role: "Diretora de Operações",
    company: "Nortis Capital",
    initials: "HV",
  },
  {
    id: "t-02",
    quote:
      "A análise documental do galpão evitou um passivo ambiental que ninguém tinha visto. Foi a consultoria mais técnica com que já trabalhamos.",
    name: "Rafael Tanaka",
    role: "Head de Supply Chain",
    company: "Velora Logística",
    initials: "RT",
  },
  {
    id: "t-03",
    quote:
      "Mudamos a sede sem um único dia de operação parada. O acompanhamento pós-contrato faz toda a diferença nesse tipo de projeto.",
    name: "Beatriz Almeida",
    role: "CFO",
    company: "Grupo Atlante",
    initials: "BA",
  },
];
