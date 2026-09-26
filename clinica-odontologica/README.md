# Clínica Odontológica Premium — site demonstrativo

Landing page premium de clínica odontológica criada como **peça de portfólio**.
A clínica, os profissionais, os depoimentos e os contatos são **fictícios/placeholders**
(nome demonstrativo "Lumen Odontologia", CNPJ/CRO/endereço entre colchetes).

## Stack

- **Next.js 15** (App Router) + **React 19** + TypeScript
- **Tailwind CSS v4** (tokens de cor e fontes em `app/globals.css`)
- **shadcn/ui** (Button, Badge, Input, Carousel — em `components/ui`)
- **Framer Motion** (entrada do hero, reveal ao rolar, parallax, contadores, menu mobile)
- **Embla Carousel** (carrossel de depoimentos com autoplay)
- Fontes auto-hospedadas via Fontsource: **Playfair Display** (títulos) + **Manrope** (texto)

## Rodando

```bash
cd clinica-odontologica
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

Para publicar na Vercel, defina **Root Directory = `clinica-odontologica`** no projeto.

## Estrutura

```
app/
  layout.tsx          # fontes, metadados, MotionConfig (respeita "reduzir movimento")
  page.tsx            # ordem das seções
  globals.css         # paleta (branco/preto/turquesa), utilitários, keyframes
components/
  sections/           # Header, Hero, Stats, Treatments, Marquee, About,
                      # Differentials, Gallery, Testimonials, FinalCta, Footer
  ui/                 # componentes shadcn/ui
  reveal.tsx          # Reveal / Stagger — animações de scroll reutilizáveis
  before-after-slider.tsx
  smart-image.tsx     # next/image com fallback em gradiente se a imagem falhar
data/
  site.ts             # TODOS os textos, imagens, números e contatos
```

## Personalizando para um cliente

Tudo o que muda de cliente para cliente está em **`data/site.ts`**:

- `clinic` — nome, telefone, WhatsApp, e-mail, endereço, horários, CNPJ, responsável técnico/CRO
- `hero`, `stats`, `treatments`, `about`, `differentials`, `gallery`, `testimonials`, `finalCta`, `socials`

As imagens usam URLs do Unsplash (`images.unsplash.com`, liberado em `next.config.mjs`).
Troque pelas fotos reais da clínica (ex.: coloque em `public/` e use `/foto.jpg`).
A galeria antes/depois simula o "antes" com um filtro CSS — com fotos reais, basta
adicionar um campo `before` e usá-lo na camada "antes" de `gallery.tsx`/`before-after-slider.tsx`.

O formulário de agendamento (`FinalCta`) é apenas visual: conecte-o ao WhatsApp, e-mail ou CRM em `onSubmit`.

## Destaques de interação

- Header transparente → vidro fosco ao rolar, com pílula animada no link ativo e barra de progresso de leitura
- Hero com zoom lento + parallax, título revelado palavra a palavra, sublinhado desenhado em SVG, selos flutuantes
- Contadores animados na faixa de estatísticas
- Cards de tratamento com zoom, overlay turquesa e descrição expansível
- Faixa "marquee" infinita, selo giratório controlado pelo scroll
- Cards de diferenciais com efeito spotlight que segue o cursor
- Comparador antes/depois arrastável (mouse, toque e teclado) + cards com revelação no hover/toque
- Carrossel de depoimentos com autoplay e card ativo em destaque
- Menu mobile em tela cheia com transição circular
