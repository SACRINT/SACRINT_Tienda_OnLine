// Image Optimization Utilities
// Helpers for optimal image loading and performance

// Responsive image sizes for common use cases
export const IMAGE_SIZES = {
  // Product images
  productCard: "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  productDetail: "(max-width: 768px) 100vw, 50vw",
  productThumbnail: "80px",

  // Category/banner images
  heroBanner: "100vw",
  categoryCard: "(max-width: 768px) 100vw, 50vw",

  // Avatar/small images
  avatar: "40px",
  avatarLarge: "80px",

  // Gallery images
  galleryMain: "(max-width: 768px) 100vw, 60vw",
  galleryThumbnail: "100px",
} as const;

// Image quality settings
export const IMAGE_QUALITY = {
  thumbnail: 60,
  standard: 75,
  high: 85,
  lossless: 100,
} as const;

// Placeholder blur data URLs
export const PLACEHOLDER_BLUR = {
  // Gray placeholder
  gray: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg==",

  // Primary color placeholder
  primary: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzBhMTEyOCIvPjwvc3ZnPg==",

  // Shimmer effect
  shimmer: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZjNmNGY2O3N0b3Atb3BhY2l0eToxIi8+PHN0b3Agb2Zmc2V0PSI1MCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNlNWU3ZWI7c3RvcC1vcGFjaXR5OjEiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmM2Y0ZjY7c3RvcC1vcGFjaXR5OjEiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0idXJsKCNnKSIvPjwvc3ZnPg==",
} as const;

// Generate srcset for responsive images
export function generateSrcSet(
  baseUrl: string,
  widths: number[] = [320, 640, 1024, 1280, 1920]
): string {
  // For external URLs with width parameter support
  if (baseUrl.includes("cloudinary") || baseUrl.includes("imgix")) {
    return widths
      .map((w) => `${baseUrl.replace(/w_\d+/, `w_${w}`)} ${w}w`)
      .join(", ");
  }

  // For local images, Next.js handles this automatically
  return "";
}

// Get optimal image dimensions
export function getOptimalDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;

  let width = originalWidth;
  let height = originalHeight;

  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  };
}

// Preload critical images
export function preloadImage(src: string, priority: "high" | "low" = "high") {
  if (typeof window === "undefined") return;

  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "image";
  link.href = src;
  link.fetchPriority = priority;

  document.head.appendChild(link);
}

// Preload multiple images
export function preloadImages(sources: string[]) {
  sources.forEach((src, index) => {
    preloadImage(src, index === 0 ? "high" : "low");
  });
}

// Image loading priority helper
export function getImagePriority(
  index: number,
  isAboveFold: boolean
): boolean {
  // First image above fold should be priority
  if (index === 0 && isAboveFold) return true;

  // First 4 product images in grid
  if (index < 4 && isAboveFold) return true;

  return false;
}

// Calculate aspect ratio padding for skeleton
export function getAspectRatioPadding(
  width: number,
  height: number
): string {
  return `${(height / width) * 100}%`;
}

// Image format detection
export function supportsWebP(): boolean {
  if (typeof window === "undefined") return true;

  const canvas = document.createElement("canvas");
  if (canvas.getContext && canvas.getContext("2d")) {
    return canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;
  }
  return false;
}

// Image error fallback handler
export function getImageFallback(type: "product" | "avatar" | "category" = "product"): string {
  switch (type) {
    case "avatar":
      return "/images/placeholder-avatar.svg";
    case "category":
      return "/images/placeholder-category.svg";
    default:
      return "/images/placeholder-product.svg";
  }
}

// Lazy loading configuration
export const LAZY_LOADING_CONFIG = {
  // Distance from viewport to start loading
  rootMargin: "200px",

  // Threshold for triggering load
  threshold: 0.01,

  // Default loading attribute
  loading: "lazy" as const,
} as const;

// Image CDN URL builder (Cloudinary example)
export function buildCDNUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: "auto" | "webp" | "avif" | "jpg" | "png";
    crop?: "fill" | "fit" | "scale" | "thumb";
  } = {}
): string {
  const baseUrl = process.env.NEXT_PUBLIC_CLOUDINARY_URL || "";
  if (!baseUrl) return publicId;

  const transforms: string[] = [];

  if (options.width) transforms.push(`w_${options.width}`);
  if (options.height) transforms.push(`h_${options.height}`);
  if (options.quality) transforms.push(`q_${options.quality}`);
  if (options.format) transforms.push(`f_${options.format}`);
  if (options.crop) transforms.push(`c_${options.crop}`);

  const transformString = transforms.length > 0 ? transforms.join(",") + "/" : "";

  return `${baseUrl}/${transformString}${publicId}`;
}
