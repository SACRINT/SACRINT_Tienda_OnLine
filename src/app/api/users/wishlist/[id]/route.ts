// Wishlist Item API
// DELETE /api/users/wishlist/[id] - Remove item from wishlist

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { z } from "zod";

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic";

/**
 * DELETE /api/users/wishlist/[id]
 * Removes a specific item from the user's wishlist
 * Requires authentication
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - You must be logged in" },
        { status: 401 },
      );
    }

    const wishlistItemId = params.id;

    // Validate ID is UUID
    const uuidSchema = z.string().uuid("Invalid wishlist item ID");
    const validation = uuidSchema.safeParse(wishlistItemId);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid wishlist item ID",
          issues: validation.error.issues,
        },
        { status: 400 },
      );
    }

    // TODO: Replace with actual database operation
    // Verify the wishlist item belongs to the current user
    // const wishlistItem = await db.wishlist.findFirst({
    //   where: {
    //     id: wishlistItemId,
    //     userId: session.user.id,
    //   },
    // })

    // if (!wishlistItem) {
    //   return NextResponse.json(
    //     { error: 'Wishlist item not found or does not belong to you' },
    //     { status: 404 }
    //   )
    // }

    // Delete the wishlist item
    // await db.wishlist.delete({
    //   where: { id: wishlistItemId },
    // })

    console.log(
      `[WISHLIST] Removed item ${wishlistItemId} from wishlist for user ${session.user.id}`,
    );

    return NextResponse.json({
      message: "Item removed from wishlist",
      itemId: wishlistItemId,
    });
  } catch (error) {
    console.error("[WISHLIST] DELETE error:", error);

    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return NextResponse.json(
          { error: "Wishlist item not found" },
          { status: 404 },
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
