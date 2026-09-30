# Jardim Aurora · Floricultura

Site institucional (one-page) de uma floricultura fictícia especializada em buquês e arranjos para o dia a dia: flores frescas, buquês prontos, arranjos personalizados e entrega no mesmo dia.

**Estilo:** botânico sofisticado. Verde-escuro `#1f3a2e`, dourado suave `#c9a961` e creme `#f5f0e6`; títulos em serifa editorial (Playfair Display), corpo em Inter e assinatura em Great Vibes; ornamentos botânicos em traço dourado fino.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 (tema em `app/globals.css`)
- shadcn/ui (Button, Badge, Sheet, ToggleGroup, Sonner) sobre Radix UI
- Motion (`motion/react`) para as animações
- lucide-react para ícones

## Seções

1. **Header** fixo: transparente sobre o hero, fica sólido (creme com blur) ao rolar, destaca a seção atual, mostra a sacola com contador animado e o CTA "Encomendar agora". No mobile vira um menu lateral.
2. **Hero** em tela cheia: foto com efeito Ken Burns e parallax, overlay verde, título que entra palavra por palavra, folhas douradas flutuando, selo giratório "Entrega no mesmo dia" e indicador de scroll.
3. **Números**: contadores que animam ao entrar na tela, seguidos de uma faixa marquee com nomes de flores.
4. **Buquês em destaque**: vitrine com filtros (Todos, Rosas, Campo, Premium) e transição animada do grid. O botão "Encomendar" põe o buquê na sacola.
5. **Categorias** em bento grid. Rosas, Flores do campo e Orquídeas também aplicam o filtro correspondente na vitrine.
6. **Como funciona**: 3 passos ligados por uma linha pontilhada dourada que se desenha ao rolar.
7. **Diferenciais**: 4 colunas sobre fundo verde.
8. **Sobre**: foto revelada com clip-path, moldura dourada deslocada e assinatura da fundadora.
9. **Depoimentos**: 3 cards com estrelas.
10. **CTA final** com botão de WhatsApp.
11. **Footer** com endereço, telefone, horários, área de entrega, redes sociais e links rápidos.

Extras: botão flutuante de WhatsApp com pulso e tooltip, e uma sacola (gaveta lateral) que monta a mensagem do pedido e abre o WhatsApp.

## Rodando localmente

```bash
cd jardim-aurora
npm install
npm run dev
```

Acesse `http://localhost:3000`. Para checar tipos: `npm run typecheck`. Build de produção: `npm run build && npm start`.

## Onde trocar o conteúdo

| O quê | Arquivo |
| --- | --- |
| Buquês, categorias, depoimentos, passos, diferenciais, números, contato, WhatsApp e horários | `lib/data.ts` |
| Fotos (URL, texto alternativo e prévia borrada) | `lib/images.ts` |
| Cores, fontes e animações | `app/globals.css` e `app/layout.tsx` |

- **WhatsApp e telefones** usam números fictícios (`5511900000000`). Troque em `contact` no `lib/data.ts` antes de publicar.
- **Fotos:** são placeholders do Unsplash (licença Unsplash, uso livre inclusive comercial), carregados de `images.unsplash.com`. Para usar fotos próprias, coloque os arquivos em `public/` e troque o `src` em `lib/images.ts` (ex.: `"/fotos/hero.jpg"`). O `blurDataURL` é opcional. Se todas as fotos passarem a ser locais, dá para remover o `remotePatterns` do `next.config.ts`.

## Acessibilidade

- Link "Pular para o conteúdo", HTML semântico com landmarks e títulos em ordem.
- Texto alternativo descritivo em todas as fotos; imagens decorativas com `alt=""`/`aria-hidden`.
- Foco visível com anel dourado; botões só com ícone têm `aria-label`.
- Contraste AA: o dourado usado em texto sobre creme é o `gold-700` (`#7a5e22`).
- `prefers-reduced-motion` respeitado: animações de entrada viram instantâneas e as contínuas (marquee, Ken Burns, selo, folhas) param.
- Auditoria com axe-core (WCAG 2.1 A/AA + boas práticas): 0 violações em 1440px e 390px.

## Deploy na Vercel

Este site está na pasta `jardim-aurora/` do repositório. Ao importar o projeto na Vercel, defina **Root Directory = `jardim-aurora`**. Nenhuma variável de ambiente é necessária.

## Créditos das fotos (Unsplash)

Alisa Anton, Artsy Vibes, Zoe Richardson, Liubov Ilchuk, Caroline Attwood, Devon Divine, Alina Karpenko, Kelsey Curtis, Alessio Soggetti, Cole Keister, Uljana Borodina e Ellie Ellien. O link de cada foto está em `lib/images.ts`.
