/**
 * Skeleton Chart Component
 * Semana 9.12: Loading States y Skeleton Loaders
 *
 * Skeleton loader para gráficos
 */

"use client";

export function SkeletonChart({ height = 300 }: { height?: number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-1/3 mb-6"></div>
      <div
        className="bg-gray-100 rounded flex items-end justify-around gap-2"
        style={{ height: `${height}px` }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-gray-200 rounded-t w-full"
            style={{
              height: `${Math.random() * 60 + 30}%`,
            }}
          ></div>
        ))}
      </div>
    </div>
  );
}
