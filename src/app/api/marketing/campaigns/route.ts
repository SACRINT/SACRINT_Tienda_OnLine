import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema de validación
const campaignSchema = z.object({
  name: z.string().min(1, "Name is required"),
  subject: z.string().min(1, "Subject is required"),
  previewText: z.string().optional(),
  fromName: z.string().min(1, "From name is required"),
  fromEmail: z.string().email("Invalid email"),
  replyTo: z.string().email("Invalid reply-to email").optional(),
  htmlContent: z.string().min(1, "HTML content is required"),
  textContent: z.string().optional(),
  scheduledFor: z.string().datetime().optional(),
  segmentRules: z.record(z.string(), z.any()).optional(),
  subjectVariants: z.array(z.string()).optional(),
});

// GET /api/marketing/campaigns - List campaigns
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { tenantId: true },
    });

    if (!user?.tenantId) {
      return NextResponse.json({ error: "User has no tenant" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: any = {
      tenantId: user.tenantId,
    };

    if (status) {
      where.status = status;
    }

    const [campaigns, total] = await Promise.all([
      db.emailCampaign.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip: offset,
        include: {
          _count: {
            select: {
              sends: true,
            },
          },
        },
      }),
      db.emailCampaign.count({ where }),
    ]);

    return NextResponse.json({
      campaigns,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/marketing/campaigns - Create campaign
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { tenantId: true, role: true },
    });

    if (!user?.tenantId) {
      return NextResponse.json({ error: "User has no tenant" }, { status: 400 });
    }

    // Only STORE_OWNER and SUPER_ADMIN can create campaigns
    if (user.role !== "STORE_OWNER" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = campaignSchema.parse(body);

    const campaign = await db.emailCampaign.create({
      data: {
        ...validatedData,
        tenantId: user.tenantId,
        scheduledFor: validatedData.scheduledFor ? new Date(validatedData.scheduledFor) : null,
        segmentRules: validatedData.segmentRules || {},
        subjectVariants: validatedData.subjectVariants || [],
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Error creating campaign:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
