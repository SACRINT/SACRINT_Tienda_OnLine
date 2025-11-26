/**
 * Search Analytics Dashboard
 * Task 11.12: Search Admin Dashboard
 *
 * Dashboard para analizar búsquedas de los usuarios:
 * - Top búsquedas
 * - Búsquedas sin resultados (zero-result queries)
 * - Trending searches
 * - Métricas de búsqueda
 */

import { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAuth, getStoreOrThrow } from "@/lib/auth/require-auth";
import { db } from "@/lib/db";
import { Search, TrendingUp, AlertCircle, BarChart3 } from "lucide-react";

interface SearchAnalyticsPageProps {
  params: {
    storeId: string;
  };
  searchParams: {
    period?: string; // "7d" | "30d" | "90d"
  };
}

export const metadata: Metadata = {
  title: "Analytics de Búsqueda",
  description: "Analiza las búsquedas de tus clientes",
};

/**
 * Obtiene las top búsquedas
 */
async function getTopSearches(tenantId: string, limit: number = 10, days: number = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const searches = await db.searchQuery.groupBy({
    by: ["query"],
    where: {
      tenantId,
      createdAt: { gte: since },
      query: { not: "" },
    },
    _count: {
      query: true,
    },
    _avg: {
      resultsCount: true,
    },
    orderBy: {
      _count: {
        query: "desc",
      },
    },
    take: limit,
  });

  return searches.map((s) => ({
    query: s.query,
    count: s._count.query,
    avgResults: Math.round(s._avg.resultsCount || 0),
  }));
}

/**
 * Obtiene búsquedas sin resultados
 */
async function getZeroResultSearches(tenantId: string, limit: number = 10, days: number = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const searches = await db.searchQuery.groupBy({
    by: ["query"],
    where: {
      tenantId,
      resultsCount: 0,
      createdAt: { gte: since },
      query: { not: "" },
    },
    _count: {
      query: true,
    },
    orderBy: {
      _count: {
        query: "desc",
      },
    },
    take: limit,
  });

  return searches.map((s) => ({
    query: s.query,
    count: s._count.query,
  }));
}

/**
 * Calcula métricas generales
 */
async function getSearchMetrics(tenantId: string, days: number = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [totalSearches, uniqueSearches, zeroResultCount, avgResults] = await Promise.all([
    // Total de búsquedas
    db.searchQuery.count({
      where: {
        tenantId,
        createdAt: { gte: since },
      },
    }),

    // Búsquedas únicas
    db.searchQuery
      .groupBy({
        by: ["query"],
        where: {
          tenantId,
          createdAt: { gte: since },
          query: { not: "" },
        },
      })
      .then((r) => r.length),

    // Búsquedas sin resultados
    db.searchQuery.count({
      where: {
        tenantId,
        resultsCount: 0,
        createdAt: { gte: since },
      },
    }),

    // Promedio de resultados
    db.searchQuery.aggregate({
      where: {
        tenantId,
        createdAt: { gte: since },
      },
      _avg: {
        resultsCount: true,
      },
    }),
  ]);

  const zeroResultRate = totalSearches > 0 ? (zeroResultCount / totalSearches) * 100 : 0;

  return {
    totalSearches,
    uniqueSearches,
    zeroResultCount,
    zeroResultRate: Math.round(zeroResultRate * 10) / 10,
    avgResults: Math.round(avgResults._avg.resultsCount || 0),
  };
}

export default async function SearchAnalyticsPage({
  params: { storeId },
  searchParams,
}: SearchAnalyticsPageProps) {
  const session = await requireAuth();
  const store = await getStoreOrThrow(storeId, session.user.id);

  // Parse period
  const period = searchParams.period || "7d";
  const days = period === "30d" ? 30 : period === "90d" ? 90 : 7;

  // Obtener datos
  const [metrics, topSearches, zeroResultSearches] = await Promise.all([
    getSearchMetrics(storeId, days),
    getTopSearches(storeId, 15, days),
    getZeroResultSearches(storeId, 10, days),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics de Búsqueda</h1>
          <p className="mt-1 text-gray-600">
            Analiza qué buscan tus clientes y optimiza tu catálogo
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2">
          <a
            href={`/dashboard/${storeId}/analytics/search?period=7d`}
            className={`rounded-lg border px-4 py-2 ${
              period === "7d"
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            7 días
          </a>
          <a
            href={`/dashboard/${storeId}/analytics/search?period=30d`}
            className={`rounded-lg border px-4 py-2 ${
              period === "30d"
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            30 días
          </a>
          <a
            href={`/dashboard/${storeId}/analytics/search?period=90d`}
            className={`rounded-lg border px-4 py-2 ${
              period === "90d"
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            90 días
          </a>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-3">
              <Search className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Búsquedas</p>
              <p className="text-2xl font-bold">{metrics.totalSearches.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Búsquedas Únicas</p>
              <p className="text-2xl font-bold">{metrics.uniqueSearches.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-100 p-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Sin Resultados</p>
              <p className="text-2xl font-bold">
                {metrics.zeroResultCount} ({metrics.zeroResultRate}%)
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-3">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Promedio Resultados</p>
              <p className="text-2xl font-bold">{metrics.avgResults}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Searches */}
        <div className="rounded-lg border bg-white">
          <div className="border-b p-6">
            <h2 className="text-xl font-bold">Top Búsquedas</h2>
            <p className="mt-1 text-sm text-gray-600">
              Las búsquedas más frecuentes de tus clientes
            </p>
          </div>
          <div className="p-6">
            {topSearches.length === 0 ? (
              <p className="py-8 text-center text-gray-500">No hay datos de búsquedas aún</p>
            ) : (
              <div className="space-y-3">
                {topSearches.map((search, index) => (
                  <div
                    key={search.query}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-lg font-bold text-gray-400">{index + 1}</span>
                      <div>
                        <p className="font-medium">{search.query}</p>
                        <p className="text-sm text-gray-600">
                          ~{search.avgResults} resultados promedio
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                      {search.count} búsquedas
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Zero Result Searches */}
        <div className="rounded-lg border bg-white">
          <div className="border-b p-6">
            <h2 className="text-xl font-bold">Búsquedas sin Resultados</h2>
            <p className="mt-1 text-sm text-gray-600">Oportunidades para mejorar tu catálogo</p>
          </div>
          <div className="p-6">
            {zeroResultSearches.length === 0 ? (
              <div className="py-8 text-center">
                <p className="font-medium text-green-600">¡Excelente!</p>
                <p className="mt-1 text-sm text-gray-500">Todas las búsquedas tienen resultados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {zeroResultSearches.map((search, index) => (
                  <div
                    key={search.query}
                    className="flex items-center justify-between rounded-lg bg-red-50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-lg font-bold text-gray-400">{index + 1}</span>
                      <p className="font-medium text-red-900">{search.query}</p>
                    </div>
                    <span className="rounded-full bg-red-200 px-3 py-1 text-sm font-medium text-red-800">
                      {search.count} intentos
                    </span>
                  </div>
                ))}
                <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>💡 Tip:</strong> Considera agregar productos relacionados con estas
                    búsquedas para mejorar la experiencia de tus clientes.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
