// Reviews Moderation Dashboard
// Store owners can approve/reject reviews and respond to them

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { ReviewsModerationClient } from "./ReviewsModerationClient";

export const metadata: Metadata = {
  title: "Moderación de Reseñas | Dashboard",
  description: "Gestiona las reseñas de tus productos",
};

export const dynamic = "force-dynamic";

async function getReviewsData(tenantId: string, status?: string) {
  const where: any = {
    product: {
      tenantId,
    },
  };

  if (status && status !== "ALL") {
    where.status = status;
  }

  const [reviews, stats] = await Promise.all([
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
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: {
              select: {
                url: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100, // Limit for performance
    }),
    db.review.groupBy({
      by: ["status"],
      where: {
        product: {
          tenantId,
        },
      },
      _count: true,
    }),
  ]);

  const statusCounts = {
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
  };

  stats.forEach((stat: any) => {
    statusCounts[stat.status as keyof typeof statusCounts] = stat._count;
  });

  return {
    reviews,
    statusCounts,
  };
}

export default async function ReviewsModerationPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { tenantId: true, role: true },
  });

  if (!user?.tenantId || (user.role !== "STORE_OWNER" && user.role !== "SUPER_ADMIN")) {
    redirect("/dashboard");
  }

  const { reviews, statusCounts } = await getReviewsData(user.tenantId, searchParams.status);

  return (
    <ReviewsModerationClient
      initialReviews={reviews as any}
      statusCounts={statusCounts}
      initialStatus={searchParams.status || "ALL"}
    />
  );
}
