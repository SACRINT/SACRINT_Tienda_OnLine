// Wishlist API
// GET /api/users/wishlist - Get user's wishlist
// POST /api/users/wishlist - Add item to wishlist

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { z } from "zod";

// Validation schema for adding to wishlist
const AddToWishlistSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
});

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic";

/**
 * GET /api/users/wishlist
 * Returns all wishlist items for the current user
 * Requires authentication
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - You must be logged in" },
        { status: 401 },
      );
    }

    const { tenantId } = session.user;

    if (!tenantId) {
      return NextResponse.json(
        { error: "User has no tenant assigned" },
        { status: 404 },
      );
    }

    // TODO: Replace with actual database query when Wishlist model is added
    // const wishlistItems = await db.wishlist.findMany({
    //   where: {
    //     userId: session.user.id,
    //     product: {
    //       tenantId,
    //     },
    //   },
    //   include: {
    //     product: {
    //       include: {
    //         images: { take: 1 },
    //         _count: { select: { reviews: true } },
    //       },
    //     },
    //   },
    //   orderBy: { createdAt: 'desc' },
    // })

    // Mock data for development
    const wishlistItems = [
      {
        id: "1",
        userId: session.user.id,
        productId: "1",
        product: {
          id: "1",
          name: "Premium Wireless Headphones",
          slug: "premium-wireless-headphones",
          basePrice: 299.99,
          salePrice: 249.99,
          stock: 45,
          images: [
            {
              url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
              alt: "Headphones",
            },
          ],
          _count: { reviews: 128 },
        },
        createdAt: new Date(2024, 10, 10).toISOString(),
      },
    ];

    return NextResponse.json({
      wishlistItems: wishlistItems.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        productSlug: item.product.slug,
        productImage: item.product.images[0]?.url,
        price: item.product.basePrice,
        salePrice: item.product.salePrice,
        inStock: item.product.stock > 0,
        reviewCount: item.product._count.reviews,
        addedAt: item.createdAt,
      })),
      total: wishlistItems.length,
    });
  } catch (error) {
    console.error("[WISHLIST] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/users/wishlist
 * Adds a product to the user's wishlist
 * Requires authentication
 *
 * Body:
 * - productId: UUID
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - You must be logged in" },
        { status: 401 },
      );
    }

    const { tenantId } = session.user;

    if (!tenantId) {
      return NextResponse.json(
        { error: "User has no tenant assigned" },
        { status: 404 },
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = AddToWishlistSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          issues: validation.error.issues,
        },
        { status: 400 },
      );
    }

    const { productId } = validation.data;

    // TODO: Replace with actual database operations
    // Check if product exists and belongs to tenant
    // const product = await db.product.findFirst({
    //   where: {
    //     id: productId,
    //     tenantId,
    //     published: true,
    //   },
    // })

    // if (!product) {
    //   return NextResponse.json(
    //     { error: 'Product not found or not available' },
    //     { status: 404 }
    //   )
    // }

    // Check if already in wishlist
    // const existing = await db.wishlist.findFirst({
    //   where: {
    //     userId: session.user.id,
    //     productId,
    //   },
    // })

    // if (existing) {
    //   return NextResponse.json(
    //     { error: 'Product already in wishlist' },
    //     { status: 409 }
    //   )
    // }

    // Add to wishlist
    // const wishlistItem = await db.wishlist.create({
    //   data: {
    //     userId: session.user.id,
    //     productId,
    //   },
    //   include: {
    //     product: {
    //       include: {
    //         images: { take: 1 },
    //       },
    //     },
    //   },
    // })

    // Mock response
    const wishlistItem = {
      id: `wishlist-${Date.now()}`,
      userId: session.user.id,
      productId,
      createdAt: new Date().toISOString(),
    };

    console.log(
      `[WISHLIST] Added product ${productId} to wishlist for user ${session.user.id}`,
    );

    return NextResponse.json(
      {
        message: "Product added to wishlist",
        wishlistItem: {
          id: wishlistItem.id,
          productId: wishlistItem.productId,
          addedAt: wishlistItem.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[WISHLIST] POST error:", error);

    if (error instanceof Error) {
      if (error.message.includes("already in wishlist")) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
