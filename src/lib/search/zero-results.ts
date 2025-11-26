/**
 * Zero Results Handler
 * Task 11.9: Zero Results Handling
 *
 * Maneja casos cuando una búsqueda no retorna resultados:
 * - Sugerencias de búsquedas similares
 * - Productos populares/destacados como alternativa
 * - Relajación de filtros
 * - Corrección de typos básica
 */

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

interface ZeroResultsResponse {
  message: string;
  suggestions: {
    type: "relaxed_filters" | "popular_products" | "similar_query" | "category_products";
    description: string;
    products: any[];
  }[];
  didYouMean?: string;
}

/**
 * Calcula la distancia de Levenshtein entre dos strings
 * Para corrección de typos
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Encuentra productos con nombres similares (typo correction)
 */
async function findSimilarProducts(
  tenantId: string,
  query: string,
  limit: number = 5
): Promise<string | null> {
  if (!query || query.length < 3) return null;

  const products = await db.product.findMany({
    where: {
      tenantId,
      published: true,
    },
    select: {
      name: true,
    },
    take: 100, // Buscar en los primeros 100 productos
  });

  const queryLower = query.toLowerCase();
  let bestMatch: string | null = null;
  let bestDistance = Infinity;

  for (const product of products) {
    const productNameLower = product.name.toLowerCase();
    const distance = levenshteinDistance(queryLower, productNameLower);

    // Si la distancia es pequeña y mejor que el match anterior
    if (distance < bestDistance && distance <= 3 && distance > 0) {
      bestDistance = distance;
      bestMatch = product.name;
    }
  }

  return bestMatch;
}

/**
 * Obtiene productos populares como alternativa
 */
async function getPopularProducts(tenantId: string, limit: number = 8) {
  return await db.product.findMany({
    where: {
      tenantId,
      published: true,
      featured: true, // Priorizar featured
    },
    include: {
      category: {
        select: { id: true, name: true, slug: true },
      },
      images: {
        take: 1,
        orderBy: { order: "asc" },
      },
    },
    orderBy: [
      { featured: "desc" },
      { createdAt: "desc" },
    ],
    take: limit,
  });
}

/**
 * Intenta relajar los filtros para obtener resultados
 */
async function getRelaxedResults(
  tenantId: string,
  originalWhere: Prisma.ProductWhereInput,
  limit: number = 8
) {
  // Crear una copia sin los filtros más restrictivos
  const relaxedWhere: Prisma.ProductWhereInput = {
    tenantId,
    published: true,
  };

  // Mantener solo la búsqueda de texto si existe
  if (originalWhere.OR) {
    relaxedWhere.OR = originalWhere.OR;
  }

  // Mantener categoría si existe
  if (originalWhere.categoryId) {
    relaxedWhere.categoryId = originalWhere.categoryId;
  }

  const products = await db.product.findMany({
    where: relaxedWhere,
    include: {
      category: {
        select: { id: true, name: true, slug: true },
      },
      images: {
        take: 1,
        orderBy: { order: "asc" },
      },
    },
    orderBy: [
      { featured: "desc" },
      { createdAt: "desc" },
    ],
    take: limit,
  });

  return products;
}

/**
 * Obtiene productos de la misma categoría si se especificó
 */
async function getCategoryProducts(
  tenantId: string,
  categoryId: string,
  limit: number = 8
) {
  return await db.product.findMany({
    where: {
      tenantId,
      categoryId,
      published: true,
    },
    include: {
      category: {
        select: { id: true, name: true, slug: true },
      },
      images: {
        take: 1,
        orderBy: { order: "asc" },
      },
    },
    orderBy: [
      { featured: "desc" },
      { createdAt: "desc" },
    ],
    take: limit,
  });
}

/**
 * Maneja el caso de cero resultados y genera sugerencias
 */
export async function handleZeroResults(
  tenantId: string,
  query: string,
  originalWhere: Prisma.ProductWhereInput
): Promise<ZeroResultsResponse> {
  const suggestions: ZeroResultsResponse["suggestions"] = [];

  // 1. Intentar corrección de typos
  const didYouMean = await findSimilarProducts(tenantId, query);

  // 2. Intentar relajar filtros
  const relaxedProducts = await getRelaxedResults(tenantId, originalWhere, 8);
  if (relaxedProducts.length > 0) {
    suggestions.push({
      type: "relaxed_filters",
      description: "Prueba relajando algunos filtros para ver más resultados",
      products: relaxedProducts,
    });
  }

  // 3. Si hay categoría, mostrar otros productos de la categoría
  if (originalWhere.categoryId && typeof originalWhere.categoryId === "string") {
    const categoryProducts = await getCategoryProducts(
      tenantId,
      originalWhere.categoryId,
      8
    );

    if (categoryProducts.length > 0) {
      suggestions.push({
        type: "category_products",
        description: `Otros productos en ${categoryProducts[0]?.category?.name || "esta categoría"}`,
        products: categoryProducts,
      });
    }
  }

  // 4. Mostrar productos populares como último recurso
  const popularProducts = await getPopularProducts(tenantId, 8);
  if (popularProducts.length > 0 && suggestions.length === 0) {
    suggestions.push({
      type: "popular_products",
      description: "Productos destacados que podrían interesarte",
      products: popularProducts,
    });
  }

  return {
    message: query
      ? `No encontramos resultados para "${query}"`
      : "No encontramos resultados con los filtros aplicados",
    suggestions,
    didYouMean: didYouMean || undefined,
  };
}

/**
 * Función auxiliar para formatear productos en respuesta
 */
export function formatProductsForZeroResults(products: any[]) {
  return products.map(product => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    basePrice: Number(product.basePrice),
    salePrice: product.salePrice ? Number(product.salePrice) : null,
    image: product.images?.[0]?.url || null,
    category: product.category,
    featured: product.featured,
    inStock: product.stock > 0,
  }));
}
