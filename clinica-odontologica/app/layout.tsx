import type { Metadata, Viewport } from "next";
import { MotionProvider } from "@/components/motion-provider";
// Fontes auto-hospedadas (sem dependência de rede no build)
import "@fontsource/playfair-display/latin-400.css";
import "@fontsource/playfair-display/latin-500.css";
import "@fontsource/playfair-display/latin-400-italic.css";
import "@fontsource/playfair-display/latin-500-italic.css";
import "@fontsource-variable/manrope/wght.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lumen Odontologia — Odontologia estética de alto padrão",
  description:
    "Site demonstrativo de clínica odontológica premium: implantes, clareamento, lentes de contato dental e ortodontia invisível com tecnologia digital.",
};

export const viewport: Viewport = {
  themeColor: "#0a0f11",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
