/**
 * API de Búsquedas Guardadas - Operaciones individuales
 * Task 11.6: Saved Searches
 *
 * Endpoints:
 * - GET /api/saved-searches/[id] - Obtener una búsqueda guardada
 * - PATCH /api/saved-searches/[id] - Actualizar búsqueda guardada
 * - DELETE /api/saved-searches/[id] - Eliminar búsqueda guardada
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import { z } from "zod";

// ============ VALIDACIÓN ============

const updateSavedSearchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  notifyOnNewResults: z.boolean().optional(),
});

// ============ GET - Obtener búsqueda guardada ============

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const savedSearch = await db.savedSearch.findUnique({
      where: {
        id: params.id,
        userId: session.user.id, // Verificar ownership
      },
      select: {
        id: true,
        name: true,
        query: true,
        filters: true,
        notifyOnNewResults: true,
        lastNotifiedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!savedSearch) {
      return NextResponse.json({ error: "Búsqueda guardada no encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      savedSearch,
    });
  } catch (error) {
    console.error("Error fetching saved search:", error);
    return NextResponse.json({ error: "Error al obtener búsqueda guardada" }, { status: 500 });
  }
}

// ============ PATCH - Actualizar búsqueda guardada ============

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Verificar que existe y pertenece al usuario
    const existing = await db.savedSearch.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Búsqueda guardada no encontrada" }, { status: 404 });
    }

    // Validar datos
    const body = await req.json();
    const validatedData = updateSavedSearchSchema.parse(body);

    // Actualizar
    const updatedSearch = await db.savedSearch.update({
      where: {
        id: params.id,
      },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        query: true,
        filters: true,
        notifyOnNewResults: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      savedSearch: updatedSearch,
      message: "Búsqueda actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error updating saved search:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: error.issues,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Error al actualizar búsqueda guardada" }, { status: 500 });
  }
}

// ============ DELETE - Eliminar búsqueda guardada ============

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Verificar que existe y pertenece al usuario
    const existing = await db.savedSearch.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Búsqueda guardada no encontrada" }, { status: 404 });
    }

    // Eliminar
    await db.savedSearch.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Búsqueda eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error deleting saved search:", error);
    return NextResponse.json({ error: "Error al eliminar búsqueda guardada" }, { status: 500 });
  }
}
