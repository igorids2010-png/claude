import type { Metadata, Viewport } from "next"
import { Great_Vibes, Inter, Playfair_Display } from "next/font/google"
import { MotionConfig } from "motion/react"

import { Toaster } from "@/components/ui/sonner"
import { ShopProvider } from "@/components/shop-provider"
import "./globals.css"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const signature = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-signature",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Jardim Aurora · Floricultura | Buquês e arranjos com entrega no mesmo dia",
  description:
    "Flores frescas para tornar qualquer dia especial. Buquês montados à mão todos os dias, arranjos personalizados e entrega rápida no mesmo dia.",
  keywords: ["floricultura", "buquê", "flores", "arranjos florais", "entrega de flores", "São Paulo"],
  openGraph: {
    title: "Jardim Aurora · Floricultura",
    description: "Buquês montados à mão todos os dias, entregues no mesmo dia.",
    locale: "pt_BR",
    type: "website",
  },
}

export const viewport: Viewport = {
  themeColor: "#1f3a2e",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${playfair.variable} ${inter.variable} ${signature.variable}`}>
      <body>
        <a
          href="#conteudo"
          className="sr-only rounded-full bg-gold-500 px-5 py-2.5 text-sm font-semibold text-forest-900 shadow-lg focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100]"
        >
          Pular para o conteúdo
        </a>
        <MotionConfig reducedMotion="user">
          <ShopProvider>
            {children}
            <Toaster position="bottom-center" />
          </ShopProvider>
        </MotionConfig>
      </body>
    </html>
  )
}
