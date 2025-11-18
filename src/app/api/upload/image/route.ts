// Image Upload API
// POST /api/upload/image - Upload single image to Vercel Blob Storage

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { uploadImage, validateImageFile } from "@/lib/upload/image";
import { USER_ROLES } from "@/lib/types/user-role";

/**
 * POST /api/upload/image
 * Uploads a single image file to Vercel Blob Storage
 * Only STORE_OWNER and SUPER_ADMIN can upload images
 *
 * Request:
 * - Content-Type: multipart/form-data
 * - Body: FormData with 'file' field
 *
 * Response:
 * - url: Public URL of uploaded image
 * - filename: Original filename
 * - size: File size in bytes
 * - contentType: MIME type
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, tenantId } = session.user;

    if (!tenantId) {
      return NextResponse.json(
        { error: "User has no tenant assigned" },
        { status: 404 },
      );
    }

    // Check if user has permission to upload images
    if (role !== USER_ROLES.STORE_OWNER && role !== USER_ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        {
          error:
            "Forbidden - Only STORE_OWNER or SUPER_ADMIN can upload images",
        },
        { status: 403 },
      );
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Upload to storage
    const uploadResult = await uploadImage(file, {
      tenantId,
      userId: session.user.id,
      folder: "products",
    });

    console.log(
      `[UPLOAD] User ${session.user.id} uploaded image: ${uploadResult.url}`,
    );

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      filename: file.name,
      size: file.size,
      contentType: file.type,
      width: uploadResult.width,
      height: uploadResult.height,
    });
  } catch (error) {
    console.error("[UPLOAD] Image upload error:", error);

    if (error instanceof Error) {
      if (error.message.includes("File too large")) {
        return NextResponse.json({ error: error.message }, { status: 413 });
      }
      if (error.message.includes("Invalid file type")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 },
    );
  }
}

// Note: In Next.js 14+ App Router, body size limits are handled differently
// The maxDuration export can be used for timeout configuration if needed
// File size validation is done in the validateImageFile function
