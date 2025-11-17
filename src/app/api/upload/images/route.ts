// Multiple Images Upload API
// POST /api/upload/images - Upload multiple images to Vercel Blob Storage

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { uploadImage, validateImageFile } from '@/lib/upload/image'
import { USER_ROLES } from '@/lib/types/user-role'

/**
 * POST /api/upload/images
 * Uploads multiple image files to Vercel Blob Storage
 * Only STORE_OWNER and SUPER_ADMIN can upload images
 *
 * Request:
 * - Content-Type: multipart/form-data
 * - Body: FormData with multiple 'files' fields
 *
 * Response:
 * - uploads: Array of successful uploads
 * - errors: Array of failed uploads with reasons
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role, tenantId } = session.user

    if (!tenantId) {
      return NextResponse.json(
        { error: 'User has no tenant assigned' },
        { status: 404 }
      )
    }

    // Check if user has permission to upload images
    if (role !== USER_ROLES.STORE_OWNER && role !== USER_ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden - Only STORE_OWNER or SUPER_ADMIN can upload images' },
        { status: 403 }
      )
    }

    // Parse form data
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    // Limit number of files
    const MAX_FILES = 10
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Too many files. Maximum: ${MAX_FILES}` },
        { status: 400 }
      )
    }

    const uploads: Array<{
      url: string
      filename: string
      size: number
      contentType: string
      width: number
      height: number
    }> = []

    const errors: Array<{
      filename: string
      error: string
    }> = []

    // Upload each file
    for (const file of files) {
      try {
        // Validate file
        const validation = validateImageFile(file)
        if (!validation.valid) {
          errors.push({
            filename: file.name,
            error: validation.error || 'Invalid file',
          })
          continue
        }

        // Upload to storage
        const uploadResult = await uploadImage(file, {
          tenantId,
          userId: session.user.id,
          folder: 'products',
        })

        uploads.push({
          url: uploadResult.url,
          filename: file.name,
          size: file.size,
          contentType: file.type,
          width: uploadResult.width,
          height: uploadResult.height,
        })
      } catch (error) {
        console.error(`[UPLOAD] Failed to upload ${file.name}:`, error)
        errors.push({
          filename: file.name,
          error: error instanceof Error ? error.message : 'Upload failed',
        })
      }
    }

    console.log(
      `[UPLOAD] User ${session.user.id} uploaded ${uploads.length} images, ${errors.length} failed`
    )

    return NextResponse.json({
      success: uploads.length > 0,
      uploads,
      errors,
      summary: {
        total: files.length,
        successful: uploads.length,
        failed: errors.length,
      },
    })
  } catch (error) {
    console.error('[UPLOAD] Multiple images upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload images' },
      { status: 500 }
    )
  }
}

// Configure route segment
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
