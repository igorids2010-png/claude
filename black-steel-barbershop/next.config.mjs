/** @type {import('next').NextConfig} */
const nextConfig = {
  // o repositório tem outro app na raiz; fixa a raiz deste projeto
  turbopack: { root: import.meta.dirname },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
}

export default nextConfig
