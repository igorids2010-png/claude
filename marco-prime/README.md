# Marco Prime Imóveis

Site institucional de uma imobiliária comercial **fictícia**, especializada em
imóveis comerciais de alto padrão — escritórios, salas comerciais, galpões
logísticos e prédios corporativos.

Todos os dados (imóveis, depoimentos, telefone, endereço, CRECI) são
ilustrativos e existem apenas para demonstração.

## Stack

- **Next.js 16** (App Router, React 19, TypeScript)
- **Tailwind CSS 4** — tema por CSS variables, sem arquivo de config
- **shadcn/ui** — componentes em `src/components/ui` (`components.json`
  configurado, então `npx shadcn@latest add <componente>` já sai no tema certo)
- **lucide-react** para os ícones

## Como rodar

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # build de produção
npm run lint
npm run images  # regenera as imagens placeholder em public/images
```

## Identidade visual

| Token | Valor | Uso |
| --- | --- | --- |
| `--background` | `#0a0a0a` | fundo off-black de toda a página |
| `--foreground` | `#f4f2ee` | texto principal |
| `--gold` | `#c9a961` | acentos, filetes, CTAs |
| `--muted-foreground` | `#a3a09a` | texto secundário |

Títulos em **Cormorant Garamond** (serifada editorial, peso 300); corpo em
**Inter**. Os tokens seguem a convenção do shadcn/ui e ficam em
`src/app/globals.css`.

## Estrutura

```
src/
├── app/
│   ├── layout.tsx          fontes, metadata e <html lang="pt-BR">
│   ├── page.tsx            composição das seções
│   ├── globals.css         tokens, tipografia, animações
│   └── icon.svg            favicon (monograma MP)
├── components/
│   ├── site-header.tsx     header fixo transparente → sólido ao rolar
│   ├── hero.tsx            hero full-screen + busca integrada
│   ├── property-search.tsx barra de filtros (tipo, região, metragem)
│   ├── property-filters.tsx contexto que liga a busca à grade
│   ├── stats.tsx           barra de números
│   ├── property-card.tsx   card de imóvel
│   ├── featured-properties.tsx grade filtrável + estado vazio
│   ├── differentials.tsx   por que escolher a Marco Prime
│   ├── about.tsx           seção institucional
│   ├── testimonials.tsx    grade no desktop, carrossel no mobile
│   ├── final-cta.tsx       bloco dourado de conversão
│   ├── site-footer.tsx     contato, mapa do site, CRECI
│   ├── reveal.tsx          animação de entrada ao rolar
│   └── ui/                 primitivos shadcn/ui
├── lib/
│   ├── site.ts             dados institucionais e navegação
│   ├── utils.ts            cn() e formatação de preço/área
│   └── data/               imóveis, números, diferenciais, depoimentos
└── scripts/
    └── generate-placeholder-images.mjs
```

## Trocando os dados mockados por uma API

Os imóveis vivem em `src/lib/data/properties.ts` como um array de `Property`.
Para plugar uma API real, troque o array por um fetch que devolva
`Property[]` — o tipo é a única dependência dos componentes:

```ts
// src/lib/data/properties.ts
export async function getProperties(): Promise<Property[]> {
  const res = await fetch("https://api.exemplo.com/imoveis", {
    next: { revalidate: 300 },
  });
  return res.json();
}
```

`regions` é derivado do catálogo, então os filtros continuam em sinergia com os
dados sem ajuste manual. A filtragem em si está isolada em
`filterProperties()` (`src/components/property-filters.tsx`) e pode virar uma
query de servidor sem tocar na UI.

## Imagens

`public/images` contém SVGs gerados por
`scripts/generate-placeholder-images.mjs` — skyline noturno, fachadas
envidraçadas, galpão com docas, laje corporativa, vista aérea de complexo
industrial e equipe em contraluz. São determinísticos (PRNG com semente fixa),
leves e usam a mesma paleta do site. Substitua pelos arquivos reais mantendo os
nomes e as proporções (4:3 para os imóveis, 16:9 para o hero).

## Acessibilidade

- Contraste verificado: texto secundário 7.6:1 e dourado 8.8:1 sobre o fundo;
  no bloco dourado, os textos ficam em 5.7:1 e 6.3:1 — todos acima de 4.5:1.
- Foco visível em todo elemento interativo (contorno dourado de 2px).
- Link "pular para o conteúdo" como primeiro item da ordem de tabulação.
- `alt` descritivo em todas as imagens; ícones decorativos com `aria-hidden`.
- As animações de entrada respeitam `prefers-reduced-motion`.
- Menu mobile fecha com `Esc` e expõe `aria-expanded` / `aria-controls`.
