// STATIC_EXPORT=1 gera um site estático em out/ (para Netlify, hospedagem comum etc.)
const staticExport = process.env.STATIC_EXPORT === "1"

/** @type {import('next').NextConfig} */
const nextConfig = {
  // o repositório tem outro app na raiz; fixa a raiz deste projeto
  turbopack: { root: import.meta.dirname },
  ...(staticExport && { output: "export" }),
  images: {
    // no export estático não há servidor para otimizar as imagens
    unoptimized: staticExport,
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
}

export default nextConfig
