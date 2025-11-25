export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="animate-pulse rounded-lg border bg-white p-4 shadow-sm">
            <div className="h-48 rounded bg-gray-200"></div>
            <div className="mt-4 h-6 w-3/4 rounded bg-gray-200"></div>
            <div className="mt-2 h-4 w-1/4 rounded bg-gray-200"></div>
            <div className="mt-4 flex justify-between">
              <div className="h-8 w-1/3 rounded bg-gray-200"></div>
              <div className="h-8 w-1/4 rounded-lg bg-gray-200"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  