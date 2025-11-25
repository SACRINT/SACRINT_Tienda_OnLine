/**
 * Image Optimization Configuration
 * Centralized configuration for Next.js Image component
 */

export const IMAGE_SIZES = {
  thumbnail: { width: 80, height: 80 },
  small: { width: 200, height: 200 },
  medium: { width: 400, height: 400 },
  large: { width: 800, height: 800 },
  hero: { width: 1920, height: 1080 },
};

export const IMAGE_QUALITY = {
  thumbnail: 75,
  default: 85,
  high: 95,
};

export const IMAGE_FORMATS = ["image/webp", "image/avif"];

export const IMAGE_LOADER_CONFIG = {
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  formats: ["image/webp"],
  minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
};

export function getImageUrl(src: string | null, size: keyof typeof IMAGE_SIZES = "medium"): string {
  if (!src) return "/placeholder.jpg";
  if (src.startsWith("http")) return src;
  return src;
}

export function getOptimizedImageProps(
  src: string | null,
  alt: string,
  size: keyof typeof IMAGE_SIZES = "medium",
) {
  const dimensions = IMAGE_SIZES[size];
  return {
    src: getImageUrl(src, size),
    alt,
    width: dimensions.width,
    height: dimensions.height,
    quality: IMAGE_QUALITY.default,
    loading: "lazy" as const,
    placeholder: "blur" as const,
    blurDataURL:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YwZjBmMCIvPjwvc3ZnPg==",
  };
}
