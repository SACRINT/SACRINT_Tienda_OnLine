/**
 * Skeleton Form Component
 * Semana 9.12: Loading States y Skeleton Loaders
 *
 * Skeleton loader para formularios
 */

"use client";

interface SkeletonFormProps {
  fields?: number;
}

export function SkeletonForm({ fields = 5 }: SkeletonFormProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
      {/* Title */}
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>

      {/* Form Fields */}
      <div className="space-y-6">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i}>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-10 bg-gray-100 rounded w-full"></div>
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div className="mt-8 flex justify-end">
        <div className="h-10 bg-gray-200 rounded w-32"></div>
      </div>
    </div>
  );
}
