import type { Metadata, Viewport } from "next"
import { Inter, Oswald } from "next/font/google"

import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })
const oswald = Oswald({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-oswald", display: "swap" })

export const metadata: Metadata = {
  title: "Black Steel Barbershop | Premium Barbershop",
  description:
    "Men's haircuts, straight-razor shaves and hair treatments in a classic barbershop with a modern edge. Book your appointment on WhatsApp.",
  openGraph: {
    title: "Black Steel Barbershop",
    description: "Style is attitude. Care is essential.",
    locale: "en_US",
    type: "website",
  },
}

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${oswald.variable}`}>
      <body>
        <a
          href="#content"
          className="fixed top-3 left-3 z-[60] -translate-y-24 bg-white px-4 py-3 font-display text-sm uppercase tracking-[0.2em] text-black transition-transform focus:translate-y-0"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  )
}
