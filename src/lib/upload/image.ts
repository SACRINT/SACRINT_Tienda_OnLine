// Image Upload Utilities
// Handles image upload to Vercel Blob Storage with validation and optimization

import { put } from '@vercel/blob'
import sharp from 'sharp'

// Allowed image MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

// Image optimization settings
const IMAGE_QUALITY = 85
const MAX_WIDTH = 2000
const MAX_HEIGHT = 2000

/**
 * Validates an image file
 * Checks file type and size
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file exists
  if (!file || file.size === 0) {
    return { valid: false, error: 'File is empty or missing' }
  }

  // Check file type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
    }
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    }
  }

  return { valid: true }
}

/**
 * Uploads an image to Vercel Blob Storage
 * Optimizes the image before upload (resize, compress)
 *
 * @param file - Image file to upload
 * @param options - Upload options
 * @returns Upload result with URL and metadata
 */
export async function uploadImage(
  file: File,
  options: {
    tenantId: string
    userId: string
    folder?: string
  }
): Promise<{
  url: string
  pathname: string
  width: number
  height: number
}> {
  const { tenantId, userId, folder = 'products' } = options

  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Get image metadata
  const metadata = await sharp(buffer).metadata()
  const originalWidth = metadata.width || 0
  const originalHeight = metadata.height || 0

  // Optimize image
  let optimizedBuffer = buffer

  // Resize if image is too large
  if (originalWidth > MAX_WIDTH || originalHeight > MAX_HEIGHT) {
    optimizedBuffer = await sharp(buffer)
      .resize(MAX_WIDTH, MAX_HEIGHT, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: IMAGE_QUALITY })
      .toBuffer()
  } else {
    // Just compress
    optimizedBuffer = await sharp(buffer)
      .jpeg({ quality: IMAGE_QUALITY })
      .toBuffer()
  }

  // Get final dimensions
  const finalMetadata = await sharp(optimizedBuffer).metadata()
  const finalWidth = finalMetadata.width || 0
  const finalHeight = finalMetadata.height || 0

  // Generate unique filename
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 8)
  const extension = file.name.split('.').pop() || 'jpg'
  const filename = `${folder}/${tenantId}/${timestamp}-${randomString}.${extension}`

  // Upload to Vercel Blob
  // Note: In development, this will use local storage
  // In production, set BLOB_READ_WRITE_TOKEN environment variable
  const blob = await put(filename, optimizedBuffer, {
    access: 'public',
    contentType: 'image/jpeg',
  })

  console.log(
    `[UPLOAD] Uploaded image: ${filename} (${originalWidth}x${originalHeight} → ${finalWidth}x${finalHeight})`
  )

  return {
    url: blob.url,
    pathname: blob.pathname,
    width: finalWidth,
    height: finalHeight,
  }
}

/**
 * Deletes an image from Vercel Blob Storage
 * @param url - URL or pathname of the image to delete
 */
export async function deleteImage(url: string): Promise<void> {
  try {
    // Extract pathname from URL
    const pathname = url.includes('blob.vercel-storage.com')
      ? new URL(url).pathname
      : url

    // Delete from Vercel Blob
    const { del } = await import('@vercel/blob')
    await del(pathname)

    console.log(`[UPLOAD] Deleted image: ${pathname}`)
  } catch (error) {
    console.error('[UPLOAD] Failed to delete image:', error)
    throw new Error('Failed to delete image')
  }
}

/**
 * Generates a thumbnail from an image
 * @param file - Original image file
 * @param size - Thumbnail size (width/height)
 * @returns Thumbnail buffer
 */
export async function generateThumbnail(
  file: File,
  size: number = 200
): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const thumbnail = await sharp(buffer)
    .resize(size, size, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality: 80 })
    .toBuffer()

  return thumbnail
}

/**
 * Validates image dimensions
 * @param file - Image file
 * @param minWidth - Minimum width
 * @param minHeight - Minimum height
 * @returns Validation result
 */
export async function validateImageDimensions(
  file: File,
  minWidth: number = 400,
  minHeight: number = 400
): Promise<{ valid: boolean; error?: string; width?: number; height?: number }> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const metadata = await sharp(buffer).metadata()
    const width = metadata.width || 0
    const height = metadata.height || 0

    if (width < minWidth || height < minHeight) {
      return {
        valid: false,
        error: `Image dimensions too small. Minimum: ${minWidth}x${minHeight}px, got: ${width}x${height}px`,
        width,
        height,
      }
    }

    return { valid: true, width, height }
  } catch (error) {
    return { valid: false, error: 'Failed to read image metadata' }
  }
}
