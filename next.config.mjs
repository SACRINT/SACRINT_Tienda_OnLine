/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Optimización de imágenes
  images: {
    domains: [
      'lh3.googleusercontent.com',
      'res.cloudinary.com',
      'images.unsplash.com', // Mock images
    ],
    formats: ['image/avif', 'image/webp'], // Formatos modernos
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840], // Breakpoints
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // Tamaños de iconos
    minimumCacheTTL: 60 * 60 * 24 * 30, // Cache por 30 días
  },

  // Compression y optimizaciones
  compress: true, // Habilitar compresión gzip
  swcMinify: true, // Usar SWC para minificar (más rápido que Terser)

  // PWA y Service Worker
  // El service worker se registra manualmente en ServiceWorkerRegistration.tsx

  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Optimistic Client Cache
    optimisticClientCache: true,
  },

  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      // Cache para assets estáticos
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ]
  },
}

export default nextConfig
