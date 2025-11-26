/**
 * Order Notes API - Task 15.9
 * GET /api/orders/[id]/notes - List notes
 * POST /api/orders/[id]/notes - Create note
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createNoteSchema = z.object({
  content: z.string().min(1),
  isPublic: z.boolean().default(false),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notes = await db.orderNote.findMany({
    where: { orderId: params.id },
    include: { author: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ notes });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const data = createNoteSchema.parse(body);

  const note = await db.orderNote.create({
    data: {
      orderId: params.id,
      content: data.content,
      isPublic: data.isPublic,
      createdBy: session.user.id,
    },
    include: { author: { select: { id: true, name: true, role: true } } },
  });

  return NextResponse.json(note, { status: 201 });
}
