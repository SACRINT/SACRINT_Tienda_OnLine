// Coupons API
// GET /api/coupons - List all coupons (STORE_OWNER only)
// POST /api/coupons - Create new coupon (STORE_OWNER only)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getCouponsByTenant, createCoupon } from "@/lib/db/coupons";
import {
  CreateCouponSchema,
  CouponFilterSchema,
} from "@/lib/security/schemas/coupon-schemas";
import { USER_ROLES } from "@/lib/types/user-role";

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

/**
 * GET /api/coupons
 * Returns all coupons for the tenant
 * Only STORE_OWNER or SUPER_ADMIN can access
 */
export async function GET(req: NextRequest) {
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

    // Check if user has permission to view coupons
    if (role !== USER_ROLES.STORE_OWNER && role !== USER_ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        {
          error: "Forbidden - Only STORE_OWNER or SUPER_ADMIN can view coupons",
        },
        { status: 403 },
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const filters = {
      status: searchParams.get("status"),
      type: searchParams.get("type"),
      includeExpired: searchParams.get("includeExpired"),
    };

    const validation = CouponFilterSchema.safeParse(filters);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid filters",
          issues: validation.error.issues,
        },
        { status: 400 },
      );
    }

    const coupons = await getCouponsByTenant(tenantId, validation.data);

    return NextResponse.json({
      coupons: coupons.map((coupon: any) => ({
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        discount: coupon.discount,
        maxDiscount: coupon.maxDiscount,
        minPurchase: coupon.minPurchase,
        maxUses: coupon.maxUses,
        usedCount: coupon.usedCount,
        isActive: coupon.isActive,
        expiresAt: coupon.expiresAt,
        description: coupon.description,
        createdAt: coupon.createdAt,
        updatedAt: coupon.updatedAt,
      })),
      total: coupons.length,
    });
  } catch (error) {
    console.error("[COUPONS] GET error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/coupons
 * Creates a new coupon
 * Only STORE_OWNER or SUPER_ADMIN can create coupons
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

    // Check if user has permission to create coupons
    if (role !== USER_ROLES.STORE_OWNER && role !== USER_ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        {
          error:
            "Forbidden - Only STORE_OWNER or SUPER_ADMIN can create coupons",
        },
        { status: 403 },
      );
    }

    const body = await req.json();
    const validation = CreateCouponSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid data",
          issues: validation.error.issues,
        },
        { status: 400 },
      );
    }

    // Cast type to match CouponType enum from Prisma
    const couponData = {
      ...validation.data,
      type: validation.data.type as "PERCENTAGE" | "FIXED",
    };

    const coupon = await createCoupon(tenantId, couponData);

    console.log(
      "[COUPONS] Created new coupon:",
      coupon.id,
      "by user:",
      session.user.id,
    );

    return NextResponse.json(
      {
        message: "Coupon created successfully",
        coupon: {
          id: coupon.id,
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          maxDiscount: coupon.maxDiscount,
          minPurchase: coupon.minPurchase,
          maxUses: coupon.maxUses,
          expiresAt: coupon.expiresAt,
          description: coupon.description,
          createdAt: coupon.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[COUPONS] POST error:", error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes("already exists")) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
