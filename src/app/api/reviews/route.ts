// API: Reviews - CRUD operations
// GET: List reviews, POST: Create review

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

// Validation schema
const createReviewSchema = z.object({
  productId: z.string().min(1),
  orderId: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(1).max(200),
  content: z.string().min(10).max(5000),
  images: z.array(z.string().url()).max(5).default([]),
});

// GET: List reviews for a product
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const productId = searchParams.get("productId");
    const status = searchParams.get("status") || "APPROVED";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "recent"; // recent, helpful, rating

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    // Build where clause
    const where: any = {
      productId,
      status,
    };

    // Build order by
    let orderBy: any = { createdAt: "desc" };
    if (sortBy === "helpful") {
      orderBy = { helpfulCount: "desc" };
    } else if (sortBy === "rating") {
      orderBy = { rating: "desc" };
    }

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.review.count({ where }),
    ]);

    // Get average rating and breakdown
    const stats = await db.review.groupBy({
      by: ["rating"],
      where: { productId, status: "APPROVED" },
      _count: true,
    });

    const ratingBreakdown = [1, 2, 3, 4, 5].map((rating) => {
      const stat = stats.find((s: any) => s.rating === rating);
      return {
        rating,
        count: stat?._count || 0,
      };
    });

    const totalReviews = stats.reduce((sum: number, s: any) => sum + s._count, 0);
    const avgRating =
      totalReviews > 0
        ? stats.reduce((sum: number, s: any) => sum + s.rating * s._count, 0) / totalReviews
        : 0;

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        averageRating: Number(avgRating.toFixed(1)),
        totalReviews,
        ratingBreakdown,
      },
    });
  } catch (error) {
    console.error("Get reviews error:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

// POST: Create a new review
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = createReviewSchema.parse(body);

    // Check if user already reviewed this product
    const existing = await db.review.findUnique({
      where: {
        productId_userId: {
          productId: data.productId,
          userId: session.user.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 400 },
      );
    }

    // Check if user bought this product (if orderId provided)
    let verifiedPurchase = false;
    if (data.orderId) {
      const order = await db.order.findFirst({
        where: {
          id: data.orderId,
          userId: session.user.id,
          status: { in: ["DELIVERED"] },
          items: {
            some: {
              productId: data.productId,
            },
          },
        },
      });

      verifiedPurchase = !!order;
    }

    // Create review
    const review = await db.review.create({
      data: {
        productId: data.productId,
        userId: session.user.id,
        orderId: data.orderId,
        rating: data.rating,
        title: data.title,
        content: data.content,
        images: data.images,
        verifiedPurchase,
        status: "PENDING", // Requires approval
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Create review error:", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}
