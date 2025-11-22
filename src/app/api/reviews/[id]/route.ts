// API: Review by ID - Update/Delete operations
// PATCH: Update review status or seller response
// DELETE: Delete review

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateReviewSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  sellerResponse: z.string().max(1000).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (\!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = updateReviewSchema.parse(body);
    const reviewId = params.id;

    const review = await db.review.findUnique({
      where: { id: reviewId },
      include: { product: { select: { tenantId: true } } },
    });

    if (\!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { tenantId: true, role: true },
    });

    const isStoreOwner = user?.role === "STORE_OWNER" && user.tenantId === review.product.tenantId;
    const isAdmin = user?.role === "SUPER_ADMIN";

    if (\!isStoreOwner && \!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.sellerResponse \!== undefined) {
      updateData.sellerResponse = data.sellerResponse;
      updateData.sellerResponseAt = new Date();
    }

    const updated = await db.review.update({
      where: { id: reviewId },
      data: updateData,
      include: { user: { select: { id: true, name: true, image: true } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update review error:", error);
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (\!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const review = await db.review.findUnique({
      where: { id: params.id },
      include: { product: { select: { tenantId: true } } },
    });

    if (\!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { tenantId: true, role: true },
    });

    const isOwner = review.userId === session.user.id;
    const isStoreOwner = user?.role === "STORE_OWNER" && user.tenantId === review.product.tenantId;
    const isAdmin = user?.role === "SUPER_ADMIN";

    if (\!isOwner && \!isStoreOwner && \!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.review.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete review error:", error);
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}
