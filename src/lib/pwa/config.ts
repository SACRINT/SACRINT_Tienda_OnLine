// PWA Configuration

export const PWA_CONFIG = {
  name: "SACRINT Tienda",
  shortName: "SACRINT",
  description: "Tu tienda online favorita",
  themeColor: "#000000",
  backgroundColor: "#ffffff",
  display: "standalone" as const,
  orientation: "portrait" as const,
  scope: "/",
  startUrl: "/",
  icons: [
    {
      src: "/icons/icon-72x72.png",
      sizes: "72x72",
      type: "image/png",
    },
    {
      src: "/icons/icon-96x96.png",
      sizes: "96x96",
      type: "image/png",
    },
    {
      src: "/icons/icon-128x128.png",
      sizes: "128x128",
      type: "image/png",
    },
    {
      src: "/icons/icon-144x144.png",
      sizes: "144x144",
      type: "image/png",
    },
    {
      src: "/icons/icon-152x152.png",
      sizes: "152x152",
      type: "image/png",
    },
    {
      src: "/icons/icon-192x192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any maskable",
    },
    {
      src: "/icons/icon-384x384.png",
      sizes: "384x384",
      type: "image/png",
    },
    {
      src: "/icons/icon-512x512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any maskable",
    },
  ],
};

// Cache configuration
export const CACHE_CONFIG = {
  version: "v1",
  staticCacheName: "sacrint-static-v1",
  dynamicCacheName: "sacrint-dynamic-v1",
  imageCacheName: "sacrint-images-v1",
  apiCacheName: "sacrint-api-v1",
  maxAgeSeconds: {
    static: 31536000, // 1 year
    dynamic: 86400, // 1 day
    images: 604800, // 1 week
    api: 300, // 5 minutes
  },
  maxEntries: {
    dynamic: 50,
    images: 100,
    api: 30,
  },
};

// Routes to precache
export const PRECACHE_ROUTES = ["/", "/offline", "/manifest.json"];

// Routes to cache on first visit
export const RUNTIME_CACHE_ROUTES = [
  /^\/shop/,
  /^\/productos/,
  /^\/categorias/,
];

// Routes to always fetch from network
export const NETWORK_ONLY_ROUTES = [
  /^\/api\/auth/,
  /^\/api\/checkout/,
  /^\/api\/webhook/,
];

// Push notification config
export const PUSH_CONFIG = {
  vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  defaultIcon: "/icons/notification-icon.png",
  defaultBadge: "/icons/notification-badge.png",
};
