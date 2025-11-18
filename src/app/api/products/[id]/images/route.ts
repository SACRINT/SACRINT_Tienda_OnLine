// Product Images API
// POST /api/products/[id]/images - Add image to product
// DELETE /api/products/[id]/images - Remove image from product

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import {
  addProductImage,
  removeProductImage,
  reorderProductImages,
} from "@/lib/db/products";
import { USER_ROLES } from "@/lib/types/user-role";
import { z } from "zod";

const AddImageSchema = z.object({
  url: z.string().url("Invalid image URL"),
  alt: z.string().max(255).optional(),
  order: z.number().int().min(0).optional(),
});

const RemoveImageSchema = z.object({
  imageId: z.string().uuid("Invalid image ID"),
});

const ReorderImagesSchema = z.object({
  imageOrders: z.array(
    z.object({
      imageId: z.string().uuid(),
      order: z.number().int().min(0),
    }),
  ),
});

/**
 * POST /api/products/[id]/images
 * Adds an image to a product
 * Only STORE_OWNER or SUPER_ADMIN can add images
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
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

    // Check permissions
    if (role !== USER_ROLES.STORE_OWNER && role !== USER_ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        { error: "Forbidden - Only STORE_OWNER or SUPER_ADMIN can add images" },
        { status: 403 },
      );
    }

    const productId = params.id;

    const body = await req.json();
    const validation = AddImageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid data",
          issues: validation.error.issues,
        },
        { status: 400 },
      );
    }

    const { url, alt, order } = validation.data;

    const image = await addProductImage(tenantId, productId, {
      url,
      alt: alt || "",
      order: order ?? 0,
    });

    console.log(`[PRODUCTS] Added image ${image.id} to product ${productId}`);

    return NextResponse.json({
      success: true,
      message: "Image added to product successfully",
      image: {
        id: image.id,
        url: image.url,
        alt: image.alt,
        order: image.order,
      },
    });
  } catch (error) {
    console.error("[PRODUCTS] Add image error:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to add image to product" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/products/[id]/images
 * Removes an image from a product
 * Only STORE_OWNER or SUPER_ADMIN can remove images
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
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

    // Check permissions
    if (role !== USER_ROLES.STORE_OWNER && role !== USER_ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        {
          error:
            "Forbidden - Only STORE_OWNER or SUPER_ADMIN can remove images",
        },
        { status: 403 },
      );
    }

    const productId = params.id;

    const body = await req.json();
    const validation = RemoveImageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid data",
          issues: validation.error.issues,
        },
        { status: 400 },
      );
    }

    const { imageId } = validation.data;

    await removeProductImage(tenantId, productId, imageId);

    console.log(
      `[PRODUCTS] Removed image ${imageId} from product ${productId}`,
    );

    return NextResponse.json({
      success: true,
      message: "Image removed from product successfully",
    });
  } catch (error) {
    console.error("[PRODUCTS] Remove image error:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to remove image from product" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/products/[id]/images
 * Reorders product images
 * Only STORE_OWNER or SUPER_ADMIN can reorder images
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
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

    // Check permissions
    if (role !== USER_ROLES.STORE_OWNER && role !== USER_ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        {
          error:
            "Forbidden - Only STORE_OWNER or SUPER_ADMIN can reorder images",
        },
        { status: 403 },
      );
    }

    const productId = params.id;

    const body = await req.json();
    const validation = ReorderImagesSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid data",
          issues: validation.error.issues,
        },
        { status: 400 },
      );
    }

    const { imageOrders } = validation.data;

    await reorderProductImages(tenantId, productId, imageOrders);

    console.log(`[PRODUCTS] Reordered images for product ${productId}`);

    return NextResponse.json({
      success: true,
      message: "Images reordered successfully",
    });
  } catch (error) {
    console.error("[PRODUCTS] Reorder images error:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to reorder images" },
      { status: 500 },
    );
  }
}
