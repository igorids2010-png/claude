import path from "node:path"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // O repositório tem outro app na raiz; fixa a raiz do Turbopack nesta pasta.
  turbopack: { root: path.resolve(__dirname) },
  images: {
    formats: ["image/avif", "image/webp"],
    // Fotos de placeholder vêm do Unsplash. Ao trocar por fotos próprias em /public,
    // esta entrada pode ser removida.
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
}

export default nextConfig
