/**
 * Dashboard Authentication Helpers
 * Semana 9.1 & 9.3: Layout de Dashboard y Autenticación de Vendedor
 *
 * Middlewares para proteger rutas del dashboard y verificar ownership de tiendas
 */

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "./server";

/**
 * Error personalizado para accesos prohibidos
 */
export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Error personalizado para recursos no encontrados
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

/**
 * Requiere autenticación válida
 * Si no está autenticado, redirige a login
 */
export async function requireAuth() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/auth/login?callbackUrl=/dashboard");
  }

  return session;
}

/**
 * Requiere que el usuario sea dueño de la tienda
 * Lanza ForbiddenError si no tiene acceso
 *
 * @param storeId - ID de la tienda a verificar
 * @param userId - ID del usuario que intenta acceder
 * @returns Session del usuario autenticado
 */
export async function requireStoreOwner(storeId: string, userId: string) {
  const session = await requireAuth();

  const store = await db.tenant.findUnique({
    where: { id: storeId },
    select: {
      id: true,
      userId: true,
      name: true,
      slug: true,
    },
  });

  if (!store) {
    throw new NotFoundError("Tienda no encontrada");
  }

  if (store.userId !== userId) {
    throw new ForbiddenError("No tienes acceso a esta tienda");
  }

  return session;
}

/**
 * Obtiene la tienda o lanza error si no existe / no tiene acceso
 * Útil para layouts y páginas que necesitan los datos de la tienda
 *
 * @param storeId - ID de la tienda
 * @param userId - ID del usuario
 * @returns Tenant (store) data
 */
export async function getStoreOrThrow(storeId: string, userId: string) {
  const store = await db.tenant.findUnique({
    where: { id: storeId },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logo: true,
      userId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!store) {
    throw new NotFoundError("Tienda no encontrada");
  }

  if (store.userId !== userId) {
    throw new ForbiddenError("No tienes acceso a esta tienda");
  }

  return store;
}

/**
 * Verifica si un usuario tiene acceso a una tienda (sin lanzar error)
 *
 * @param storeId - ID de la tienda
 * @param userId - ID del usuario
 * @returns true si tiene acceso, false si no
 */
export async function hasStoreAccess(storeId: string, userId: string): Promise<boolean> {
  try {
    const store = await db.tenant.findUnique({
      where: { id: storeId },
      select: { userId: true },
    });

    return store?.userId === userId;
  } catch {
    return false;
  }
}

/**
 * Obtiene todas las tiendas del usuario
 *
 * @param userId - ID del usuario
 * @returns Lista de tiendas del usuario
 */
export async function getUserStores(userId: string) {
  return await db.tenant.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
