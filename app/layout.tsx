import type { Metadata, Viewport } from "next"
import { Bricolage_Grotesque, IBM_Plex_Mono, Manrope } from "next/font/google"
import "./globals.css"

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--nf-display", display: "swap" })
const sans = Manrope({ subsets: ["latin"], variable: "--nf-sans", display: "swap" })
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--nf-mono", display: "swap" })

export const metadata: Metadata = {
  title: "Radar Sem Site",
  description: "Encontre empresas no Google Maps que ainda não têm site.",
}

export const viewport: Viewport = {
  themeColor: "#090d13",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
