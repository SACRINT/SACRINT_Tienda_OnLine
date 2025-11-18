// User Registration Endpoint
// POST /api/auth/signup
// Creates new user with email/password and automatically creates a tenant

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { USER_ROLES } from "@/lib/types/user-role";

// Validation schema
const SignupSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  storeName: z
    .string()
    .min(3, "Store name must be at least 3 characters")
    .max(100)
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[SIGNUP] Attempt for email:", body.email);

    // Validate input
    const validation = SignupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid data",
          issues: validation.error.issues,
        },
        { status: 400 },
      );
    }

    const { email, password, name, storeName } = validation.data;

    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate unique tenant slug
    const baseSlug = email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-");
    const tenantSlug = `${baseSlug}-${Date.now()}`;

    // Create tenant and user in a transaction
    const result = await db.$transaction(async (tx: any) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: storeName || `${name}'s Store`,
          slug: tenantSlug,
        },
      });

      // Create user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          tenantId: tenant.id,
          role: USER_ROLES.STORE_OWNER, // First user becomes STORE_OWNER
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          tenantId: true,
          createdAt: true,
        },
      });

      return { user, tenant };
    });

    console.log(
      "[SIGNUP] Success - User:",
      result.user.id,
      "Tenant:",
      result.tenant.id,
    );

    return NextResponse.json(
      {
        message: "User created successfully",
        user: result.user,
        tenant: {
          id: result.tenant.id,
          name: result.tenant.slug,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[SIGNUP] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
