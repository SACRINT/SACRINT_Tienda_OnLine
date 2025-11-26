/**
 * Skeleton Table Component
 * Semana 9.12: Loading States y Skeleton Loaders
 *
 * Skeleton loader para tablas
 */

"use client";

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export function SkeletonTable({ rows = 5, columns = 5 }: SkeletonTableProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 animate-pulse">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="h-5 bg-gray-200 rounded w-1/4"></div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Table Header */}
          <thead className="bg-gray-50">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-6 py-3">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-gray-200">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4">
                    <div
                      className="h-4 bg-gray-200 rounded"
                      style={{
                        width: `${Math.random() * 30 + 60}%`,
                      }}
                    ></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
