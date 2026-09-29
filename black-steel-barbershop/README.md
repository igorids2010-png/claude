# Black Steel Barbershop

Site institucional (one-page) de uma barbearia premium fictícia. Visual minimalista escuro, fotos em preto e branco, tipografia condensada e animações sutis.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4
- shadcn/ui (`Button`, `Sheet`), com Radix e `class-variance-authority`
- framer-motion para as animações (entrada escalonada, parallax no hero, fade/slide ao rolar, contador animado)
- lucide-react para os ícones

## Rodando

```bash
cd black-steel-barbershop
npm install
npm run dev      # http://localhost:3000
npm run build    # build de produção
```

Na Vercel, configure **Root Directory = `black-steel-barbershop`**. Publicado em https://black-steel-barbershop.vercel.app (projeto `black-steel-barbershop`, sem deploy automático: o repositório tem outro app na raiz).

## Estrutura

```
app/
  layout.tsx        fontes (Oswald + Inter), metadados, skip link
  page.tsx          monta as seções
  globals.css       tokens de cor, fontes, foco visível, reduced-motion
components/
  header.tsx        fixo; transparente no topo e sólido ao rolar; menu mobile em Sheet
  hero.tsx          salão vazio em P&B, zoom lento, luz que segue o mouse, headline animada, CTAs, barra de informações
  shutter.tsx       porta de aço que sobe ao carregar a página (só CSS)
  marquee.tsx       faixa branca com os serviços passando
  stats.tsx         números com contador animado
  services.tsx      grid de serviços
  service-card.tsx  card com zoom na imagem e borda que acende no hover
  gallery.tsx       grid bento com legenda no hover
  features.tsx      diferenciais
  about.tsx         história + foto
  testimonials.tsx  depoimentos com estrelas
  final-cta.tsx     bloco invertido (branco) com botão de WhatsApp
  footer.tsx        endereço, telefone, horários, redes, links rápidos
  whatsapp-button.tsx  botão flutuante
  reveal.tsx        wrapper de animação ao rolar
  ui/               componentes shadcn/ui
lib/
  data.ts           TODOS os dados do site (serviços, galeria, depoimentos, contato)
```

## Trocando pelos dados reais

Tudo fica em `lib/data.ts`:

- `site`: nome, WhatsApp (formato `55DDDNUMERO`), telefone, endereço, horários e redes sociais
- `services`: nome, descrição, preço, duração e imagem de cada serviço
- `gallery`, `testimonials`, `stats`, `features`

As fotos são placeholders do Unsplash, com o filtro P&B aplicado via CSS (`grayscale`). Para usar fotos próprias, coloque os arquivos em `public/` e troque as URLs por caminhos como `/fotos/corte.jpg`.

## Acessibilidade

- Link "Pular para o conteúdo", foco visível em todos os elementos interativos
- `alt` descritivo nas imagens, `aria-label` nos botões só com ícone e nas estrelas
- Contraste AA (texto secundário `#a3a3a3` sobre `#0a0a0a`)
- Animações desligadas quando o sistema pede `prefers-reduced-motion`
