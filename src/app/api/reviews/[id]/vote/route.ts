// API: Review Helpful Votes
// POST: Vote helpful or not helpful

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const voteSchema = z.object({
  vote: z.enum(["HELPFUL", "NOT_HELPFUL"]),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (\!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = voteSchema.parse(body);
    const reviewId = params.id;

    // Check if review exists
    const review = await db.review.findUnique({ where: { id: reviewId } });
    if (\!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Check if user already voted
    const existing = await db.reviewHelpfulVote.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId: session.user.id,
        },
      },
    });

    if (existing) {
      // Update vote if different
      if (existing.vote \!== data.vote) {
        await db.reviewHelpfulVote.update({
          where: { id: existing.id },
          data: { vote: data.vote },
        });

        // Update counts
        const increment = data.vote === "HELPFUL" ? 1 : -1;
        await db.review.update({
          where: { id: reviewId },
          data: {
            helpfulCount: { increment },
            notHelpfulCount: { increment: -increment },
          },
        });
      }
    } else {
      // Create new vote
      await db.reviewHelpfulVote.create({
        data: {
          reviewId,
          userId: session.user.id,
          vote: data.vote,
        },
      });

      // Update counts
      await db.review.update({
        where: { id: reviewId },
        data: {
          helpfulCount: { increment: data.vote === "HELPFUL" ? 1 : 0 },
          notHelpfulCount: { increment: data.vote === "NOT_HELPFUL" ? 1 : 0 },
        },
      });
    }

    // Return updated review
    const updated = await db.review.findUnique({
      where: { id: reviewId },
      select: { helpfulCount: true, notHelpfulCount: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
  }
}
