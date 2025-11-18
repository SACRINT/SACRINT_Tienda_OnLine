// Review Detail API
// PATCH /api/reviews/[id] - Update a review
// DELETE /api/reviews/[id] - Delete a review

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getReviewById, updateReview, deleteReview } from "@/lib/db/reviews";
import { UpdateReviewSchema } from "@/lib/security/schemas/review-schemas";

/**
 * PATCH /api/reviews/[id]
 * Updates an existing review
 * Requires authentication and user must be the review author
 *
 * Body:
 * - rating: number 1-5 (optional)
 * - title: string (3-100 chars, optional)
 * - comment: string (10-500 chars, optional)
 * At least one field must be provided
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - You must be logged in to update a review" },
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

    const reviewId = params.id;

    // Check if review exists
    const existingReview = await getReviewById(tenantId, reviewId);

    if (!existingReview) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Verify user is the author
    if (existingReview.userId !== session.user.id) {
      return NextResponse.json(
        {
          error: "Forbidden - You can only update your own reviews",
          message: "This review belongs to another user",
        },
        { status: 403 },
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = UpdateReviewSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          issues: validation.error.issues,
        },
        { status: 400 },
      );
    }

    const { rating, title, comment } = validation.data;

    // Update the review
    const updatedReview = await updateReview(
      tenantId,
      reviewId,
      session.user.id,
      {
        rating,
        title,
        comment,
      },
    );

    console.log(
      `[REVIEWS] Updated review ${reviewId} by user ${session.user.id}`,
    );

    return NextResponse.json({
      message: "Review updated successfully",
      review: {
        id: updatedReview.id,
        rating: updatedReview.rating,
        title: updatedReview.title,
        content: updatedReview.content,
        user: {
          id: updatedReview.user.id,
          name: updatedReview.user.name,
          image: updatedReview.user.image,
        },
        createdAt: updatedReview.createdAt,
        updatedAt: updatedReview.updatedAt,
      },
    });
  } catch (error) {
    console.error("[REVIEWS] PATCH error:", error);

    // Handle known errors
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes("only edit your own")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (error.message.includes("Rating must be")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/reviews/[id]
 * Deletes a review
 * Requires authentication and user must be the review author
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - You must be logged in to delete a review" },
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

    const reviewId = params.id;

    // Check if review exists
    const existingReview = await getReviewById(tenantId, reviewId);

    if (!existingReview) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Verify user is the author
    if (existingReview.userId !== session.user.id) {
      return NextResponse.json(
        {
          error: "Forbidden - You can only delete your own reviews",
          message: "This review belongs to another user",
        },
        { status: 403 },
      );
    }

    // Delete the review
    await deleteReview(tenantId, reviewId, session.user.id);

    console.log(
      `[REVIEWS] Deleted review ${reviewId} by user ${session.user.id}`,
    );

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("[REVIEWS] DELETE error:", error);

    // Handle known errors
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes("only delete your own")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
