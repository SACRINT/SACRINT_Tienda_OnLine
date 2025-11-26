/**
 * API de Búsquedas Guardadas (Saved Searches)
 * Task 11.6: Saved Searches
 *
 * Permite a los usuarios guardar sus búsquedas favoritas y recibir notificaciones
 * cuando hay nuevos resultados
 *
 * Endpoints:
 * - GET /api/saved-searches - Listar búsquedas guardadas del usuario
 * - POST /api/saved-searches - Crear nueva búsqueda guardada
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import { z } from "zod";

// ============ VALIDACIÓN ============

const createSavedSearchSchema = z.object({
  name: z.string().min(1).max(100),
  query: z.string().min(0).max(200),
  filters: z.object({
    categoryId: z.string().cuid().optional(),
    minPrice: z.number().positive().optional(),
    maxPrice: z.number().positive().optional(),
    minRating: z.number().min(1).max(5).optional(),
    inStock: z.boolean().optional(),
    featured: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
  notifyOnNewResults: z.boolean().default(false),
});

// ============ GET - Listar búsquedas guardadas ============

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const { tenantId } = session.user;

    if (!tenantId) {
      return NextResponse.json(
        { error: "Usuario sin tenant asignado" },
        { status: 400 }
      );
    }

    // Obtener búsquedas guardadas del usuario
    const savedSearches = await db.savedSearch.findMany({
      where: {
        userId: session.user.id,
        tenantId,
      },
      orderBy: {
        createdAt: "desc",
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

    return NextResponse.json({
      success: true,
      savedSearches,
      count: savedSearches.length,
    });
  } catch (error) {
    console.error("Error fetching saved searches:", error);
    return NextResponse.json(
      { error: "Error al obtener búsquedas guardadas" },
      { status: 500 }
    );
  }
}

// ============ POST - Crear búsqueda guardada ============

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const { tenantId } = session.user;

    if (!tenantId) {
      return NextResponse.json(
        { error: "Usuario sin tenant asignado" },
        { status: 400 }
      );
    }

    // Validar datos
    const body = await req.json();
    const validatedData = createSavedSearchSchema.parse(body);

    // Verificar límite de búsquedas guardadas (máximo 20 por usuario)
    const existingCount = await db.savedSearch.count({
      where: {
        userId: session.user.id,
        tenantId,
      },
    });

    if (existingCount >= 20) {
      return NextResponse.json(
        {
          error: "Límite alcanzado",
          message: "Puedes tener máximo 20 búsquedas guardadas. Elimina alguna para crear una nueva.",
        },
        { status: 400 }
      );
    }

    // Crear búsqueda guardada
    const savedSearch = await db.savedSearch.create({
      data: {
        userId: session.user.id,
        tenantId,
        name: validatedData.name,
        query: validatedData.query,
        filters: validatedData.filters || {},
        notifyOnNewResults: validatedData.notifyOnNewResults,
      },
      select: {
        id: true,
        name: true,
        query: true,
        filters: true,
        notifyOnNewResults: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      savedSearch,
      message: "Búsqueda guardada exitosamente",
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating saved search:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al crear búsqueda guardada" },
      { status: 500 }
    );
  }
}
