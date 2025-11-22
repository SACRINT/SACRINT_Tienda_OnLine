/**
 * Image Optimizer
 * Optimización de imágenes y assets
 */

import { logger } from "../monitoring/logger";

export interface ImageOptimizationConfig {
  quality?: number;
  format?: "webp" | "avif" | "jpeg" | "png";
  width?: number;
  height?: number;
  fit?: "cover" | "contain" | "fill" | "inside" | "outside";
  position?: "center" | "top" | "bottom" | "left" | "right";
}

export interface ResponsiveImageConfig {
  src: string;
  alt: string;
  sizes: number[];
  quality?: number;
}

/**
 * Generar URL optimizada de imagen
 */
export function getOptimizedImageURL(src: string, config: ImageOptimizationConfig = {}): string {
  // Si es desarrollo local, retornar URL original
  if (process.env.NODE_ENV === "development" && !process.env.NEXT_PUBLIC_CDN_URL) {
    return src;
  }

  const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL || "";
  const params = new URLSearchParams();

  if (config.quality) params.set("q", config.quality.toString());
  if (config.format) params.set("f", config.format);
  if (config.width) params.set("w", config.width.toString());
  if (config.height) params.set("h", config.height.toString());
  if (config.fit) params.set("fit", config.fit);
  if (config.position) params.set("pos", config.position);

  const queryString = params.toString();
  const separator = src.includes("?") ? "&" : "?";

  return `${cdnUrl}${src}${queryString ? separator + queryString : ""}`;
}

/**
 * Generar srcset para imágenes responsive
 */
export function generateSrcSet(src: string, sizes: number[], quality: number = 80): string {
  return sizes
    .map((size) => {
      const url = getOptimizedImageURL(src, { width: size, quality });
      return `${url} ${size}w`;
    })
    .join(", ");
}

/**
 * Generar sizes attribute
 */
export function generateSizesAttribute(
  breakpoints: Array<{ maxWidth: string; size: string }>,
): string {
  return breakpoints.map((bp) => `(max-width: ${bp.maxWidth}) ${bp.size}`).join(", ");
}

/**
 * Props para Next.js Image component
 */
export function getResponsiveImageProps(config: ResponsiveImageConfig) {
  const { src, alt, sizes, quality = 80 } = config;

  return {
    src,
    alt,
    srcSet: generateSrcSet(src, sizes, quality),
    sizes: generateSizesAttribute([
      { maxWidth: "640px", size: "100vw" },
      { maxWidth: "1024px", size: "50vw" },
      { maxWidth: "1536px", size: "33vw" },
    ]),
    loading: "lazy" as const,
    decoding: "async" as const,
  };
}

/**
 * Detectar soporte de formato de imagen
 */
export function getBestImageFormat(): "avif" | "webp" | "jpeg" {
  if (typeof window === "undefined") return "webp";

  // Check AVIF support
  const avifCanvas = document.createElement("canvas");
  if (avifCanvas.toDataURL("image/avif").indexOf("data:image/avif") === 0) {
    return "avif";
  }

  // Check WebP support
  const webpCanvas = document.createElement("canvas");
  if (webpCanvas.toDataURL("image/webp").indexOf("data:image/webp") === 0) {
    return "webp";
  }

  return "jpeg";
}

/**
 * Calcular dimensiones manteniendo aspect ratio
 */
export function calculateAspectRatioDimensions(
  originalWidth: number,
  originalHeight: number,
  targetWidth?: number,
  targetHeight?: number,
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;

  if (targetWidth && !targetHeight) {
    return {
      width: targetWidth,
      height: Math.round(targetWidth / aspectRatio),
    };
  }

  if (targetHeight && !targetWidth) {
    return {
      width: Math.round(targetHeight * aspectRatio),
      height: targetHeight,
    };
  }

  if (targetWidth && targetHeight) {
    return { width: targetWidth, height: targetHeight };
  }

  return { width: originalWidth, height: originalHeight };
}

/**
 * Generar blur placeholder data URL
 */
export function generateBlurDataURL(width: number = 10, height: number = 10): string {
  const canvas = typeof document !== "undefined" ? document.createElement("canvas") : null;

  if (!canvas) {
    // Server-side fallback
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'%3E%3Cfilter id='b' color-interpolation-filters='sRGB'%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3C/filter%3E%3Crect width='${width}' height='${height}' fill='%23ddd' filter='url(%23b)'/%3E%3C/svg%3E`;
  }

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Crear gradiente simple
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#f0f0f0");
  gradient.addColorStop(1, "#e0e0e0");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  return canvas.toDataURL();
}

/**
 * Validar tipo de archivo de imagen
 */
export function isValidImageType(filename: string): boolean {
  const validExtensions = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif", ".svg"];
  const ext = filename.toLowerCase().substring(filename.lastIndexOf("."));
  return validExtensions.includes(ext);
}

/**
 * Obtener MIME type de imagen
 */
export function getImageMimeType(filename: string): string | null {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf("."));
  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
  };

  return mimeTypes[ext] || null;
}

/**
 * Logging de optimización
 */
export function logImageOptimization(data: {
  originalSize: number;
  optimizedSize: number;
  format: string;
  width?: number;
  height?: number;
}): void {
  const savingsPercent = Math.round(
    ((data.originalSize - data.optimizedSize) / data.originalSize) * 100,
  );

  logger.info(
    {
      type: "image_optimized",
      originalSize: data.originalSize,
      optimizedSize: data.optimizedSize,
      savings: savingsPercent,
      format: data.format,
      dimensions: data.width && data.height ? `${data.width}x${data.height}` : undefined,
    },
    `Image optimized: ${savingsPercent}% size reduction`,
  );
}

export default {
  getOptimizedImageURL,
  generateSrcSet,
  generateSizesAttribute,
  getResponsiveImageProps,
  getBestImageFormat,
  calculateAspectRatioDimensions,
  generateBlurDataURL,
  isValidImageType,
  getImageMimeType,
  logImageOptimization,
};
