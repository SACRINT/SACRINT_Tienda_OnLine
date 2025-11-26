/**
 * Typo Correction Module
 * Task 11.11: Typo Correction (Bonus)
 *
 * Implementa corrección de typos usando:
 * - Levenshtein distance para strings similares
 * - Sugerencias basadas en nombres de productos existentes
 * - Sugerencias basadas en búsquedas populares
 */

import { db } from "@/lib/db";

/**
 * Calcula la distancia de Levenshtein entre dos strings
 * Mide la mínima cantidad de ediciones (inserción, eliminación, sustitución)
 * necesarias para transformar una string en otra
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  // Inicializar primera columna
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  // Inicializar primera fila
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  // Llenar matriz
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
 * Calcula similaridad entre dos strings (0-1)
 * 1 = idénticos, 0 = completamente diferentes
 */
export function stringSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1.0;

  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - distance / maxLength;
}

/**
 * Encuentra la palabra más similar de una lista
 */
export function findMostSimilar(
  query: string,
  candidates: string[],
  threshold: number = 0.6
): { word: string; similarity: number } | null {
  if (!query || candidates.length === 0) return null;

  let bestMatch: { word: string; similarity: number } | null = null;

  for (const candidate of candidates) {
    const similarity = stringSimilarity(query, candidate);

    if (similarity > threshold && (!bestMatch || similarity > bestMatch.similarity)) {
      bestMatch = { word: candidate, similarity };
    }
  }

  return bestMatch;
}

/**
 * Corrección de typos basada en nombres de productos
 */
export async function suggestProductNameCorrection(
  tenantId: string,
  query: string,
  maxSuggestions: number = 3
): Promise<string[]> {
  if (!query || query.length < 3) return [];

  // Obtener nombres de productos del tenant
  const products = await db.product.findMany({
    where: {
      tenantId,
      published: true,
    },
    select: {
      name: true,
    },
    take: 200, // Limitar para performance
  });

  const productNames = products.map(p => p.name);

  // Calcular similaridad con cada nombre
  const similarities = productNames.map(name => ({
    name,
    similarity: stringSimilarity(query, name),
    distance: levenshteinDistance(query.toLowerCase(), name.toLowerCase()),
  }));

  // Filtrar y ordenar por similaridad
  const suggestions = similarities
    .filter(s => s.similarity > 0.5 && s.distance > 0) // Excluir matches exactos
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxSuggestions)
    .map(s => s.name);

  return suggestions;
}

/**
 * Corrección de typos basada en búsquedas populares
 */
export async function suggestPopularQueryCorrection(
  tenantId: string,
  query: string,
  maxSuggestions: number = 3,
  days: number = 30
): Promise<string[]> {
  if (!query || query.length < 3) return [];

  const since = new Date();
  since.setDate(since.getDate() - days);

  // Obtener búsquedas populares
  const popularSearches = await db.searchQuery.groupBy({
    by: ["query"],
    where: {
      tenantId,
      createdAt: { gte: since },
      query: { not: "" },
      resultsCount: { gt: 0 }, // Solo búsquedas exitosas
    },
    _count: {
      query: true,
    },
    orderBy: {
      _count: {
        query: "desc",
      },
    },
    take: 50,
  });

  const popularQueries = popularSearches.map(s => s.query);

  // Calcular similaridad
  const similarities = popularQueries.map(popularQuery => ({
    query: popularQuery,
    similarity: stringSimilarity(query, popularQuery),
    distance: levenshteinDistance(query.toLowerCase(), popularQuery.toLowerCase()),
  }));

  // Filtrar y ordenar
  const suggestions = similarities
    .filter(s => s.similarity > 0.6 && s.distance > 0 && s.distance <= 3)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxSuggestions)
    .map(s => s.query);

  return suggestions;
}

/**
 * Obtiene la mejor sugerencia combinando productos y búsquedas populares
 */
export async function getBestTypoSuggestion(
  tenantId: string,
  query: string
): Promise<string | null> {
  if (!query || query.length < 3) return null;

  // Obtener sugerencias de ambas fuentes
  const [productSuggestions, popularSuggestions] = await Promise.all([
    suggestProductNameCorrection(tenantId, query, 3),
    suggestPopularQueryCorrection(tenantId, query, 3),
  ]);

  // Combinar y deduplicar
  const allSuggestions = [...new Set([...popularSuggestions, ...productSuggestions])];

  if (allSuggestions.length === 0) return null;

  // Retornar la primera (más similar)
  return allSuggestions[0];
}

/**
 * Correcciones comunes en español
 */
const COMMON_TYPOS: Record<string, string> = {
  // Letras adyacentes
  teclado: "teclado",
  tecaldo: "teclado",
  ratom: "raton",
  raton: "ratón",

  // Acentos
  laptop: "laptop",
  laptp: "laptop",
  camra: "cámara",
  camara: "cámara",

  // Duplicación
  portatil: "portátil",
  portatill: "portátil",

  // Omisión
  mobil: "móvil",
  movil: "móvil",
  celular: "celular",
  cellular: "celular",
};

/**
 * Corrección básica usando diccionario de typos comunes
 */
export function correctCommonTypos(query: string): string {
  const lowerQuery = query.toLowerCase().trim();

  // Buscar en diccionario de typos comunes
  if (COMMON_TYPOS[lowerQuery]) {
    return COMMON_TYPOS[lowerQuery];
  }

  // Dividir en palabras y corregir cada una
  const words = lowerQuery.split(/\s+/);
  const correctedWords = words.map(word => COMMON_TYPOS[word] || word);

  // Si hubo correcciones, retornar
  if (correctedWords.some((w, i) => w !== words[i])) {
    return correctedWords.join(" ");
  }

  return query;
}

/**
 * Función principal: intenta corregir un typo usando todas las estrategias
 */
export async function correctTypo(
  tenantId: string,
  query: string
): Promise<{
  original: string;
  corrected: string | null;
  method: "common_typos" | "product_names" | "popular_queries" | null;
  confidence: number; // 0-1
}> {
  const original = query;

  // 1. Intentar corrección con diccionario común
  const commonCorrection = correctCommonTypos(query);
  if (commonCorrection !== query) {
    return {
      original,
      corrected: commonCorrection,
      method: "common_typos",
      confidence: 0.9,
    };
  }

  // 2. Intentar con búsquedas populares (más confiable)
  const popularSuggestions = await suggestPopularQueryCorrection(tenantId, query, 1);
  if (popularSuggestions.length > 0) {
    const similarity = stringSimilarity(query, popularSuggestions[0]);
    if (similarity > 0.7) {
      return {
        original,
        corrected: popularSuggestions[0],
        method: "popular_queries",
        confidence: similarity,
      };
    }
  }

  // 3. Intentar con nombres de productos
  const productSuggestions = await suggestProductNameCorrection(tenantId, query, 1);
  if (productSuggestions.length > 0) {
    const similarity = stringSimilarity(query, productSuggestions[0]);
    if (similarity > 0.6) {
      return {
        original,
        corrected: productSuggestions[0],
        method: "product_names",
        confidence: similarity,
      };
    }
  }

  // No se encontró corrección
  return {
    original,
    corrected: null,
    method: null,
    confidence: 0,
  };
}
