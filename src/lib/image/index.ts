// Image optimization utilities

// Generate responsive image sizes
export function generateImageSizes(
  breakpoints: { width: number; size: string }[]
): string {
  return breakpoints
    .map((bp) => `(max-width: ${bp.width}px) ${bp.size}`)
    .concat(["100vw"])
    .join(", ")
}

// Common responsive sizes
export const imageSizes = {
  // Product card (grid of 4)
  productCard: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw",
  // Product detail (large)
  productDetail: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px",
  // Thumbnail
  thumbnail: "80px",
  // Full width
  fullWidth: "100vw",
  // Banner
  banner: "(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px",
  // Avatar
  avatar: "48px",
}

// Generate blur data URL
export function generateBlurDataUrl(width = 10, height = 10): string {
  const shimmer = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
    </svg>
  `
  return `data:image/svg+xml;base64,${Buffer.from(shimmer).toString("base64")}`
}

// Shimmer blur placeholder
export const shimmerBlurDataUrl = generateBlurDataUrl()

// Get optimized image URL with transformations
export function getOptimizedImageUrl(
  src: string,
  options?: {
    width?: number
    height?: number
    quality?: number
    format?: "webp" | "avif" | "jpeg" | "png"
  }
): string {
  // If using a CDN like Cloudinary, Imgix, etc.
  // This would transform the URL accordingly
  // For now, return the original source
  return src
}

// Calculate aspect ratio
export function calculateAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
  const divisor = gcd(width, height)
  return `${width / divisor}/${height / divisor}`
}

// Common aspect ratios
export const aspectRatios = {
  square: "1/1",
  portrait: "3/4",
  landscape: "4/3",
  video: "16/9",
  wide: "2/1",
  ultrawide: "21/9",
}

// Preload image
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

// Check if image format is supported
export function supportsWebP(): boolean {
  if (typeof window === "undefined") return false

  const canvas = document.createElement("canvas")
  return canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0
}

export function supportsAvif(): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.src =
      "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI="
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
  })
}

// Get placeholder for loading state
export function getPlaceholder(type: "blur" | "empty" | "color" = "blur"): string {
  switch (type) {
    case "blur":
      return shimmerBlurDataUrl
    case "empty":
      return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
    case "color":
      return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+F9PQAJpAN4pokyXwAAAABJRU5ErkJggg=="
    default:
      return shimmerBlurDataUrl
  }
}

// Generate srcset for responsive images
export function generateSrcSet(
  src: string,
  widths: number[] = [320, 640, 960, 1280, 1920]
): string {
  // This would work with a CDN that supports width parameters
  // For now, just return the src at multiple widths
  return widths.map((w) => `${src} ${w}w`).join(", ")
}
