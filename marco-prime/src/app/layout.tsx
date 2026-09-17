import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Marco Prime Imóveis — Imóveis comerciais de alto padrão",
    template: "%s | Marco Prime Imóveis",
  },
  description:
    "Curadoria de escritórios, lajes corporativas, salas comerciais e galpões logísticos de alto padrão. Consultoria imobiliária corporativa com 15 anos de mercado.",
  keywords: [
    "imóveis comerciais",
    "escritório corporativo",
    "laje corporativa",
    "galpão logístico",
    "sala comercial",
    "locação corporativa",
  ],
  openGraph: {
    title: "Marco Prime Imóveis — Imóveis comerciais de alto padrão",
    description:
      "O endereço certo para o seu negócio crescer. Escritórios, salas comerciais, galpões logísticos e prédios corporativos.",
    locale: "pt_BR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${cormorant.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
