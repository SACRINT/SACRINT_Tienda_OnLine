export function FilterSkeleton() {
    return (
      <aside className="hidden lg:block lg:col-span-1">
        <div className="space-y-6 animate-pulse">
          {/* Category Skeleton */}
          <div>
            <div className="h-6 w-2/3 rounded bg-gray-200 mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 w-5/6 rounded bg-gray-200"></div>
              <div className="h-4 w-4/6 rounded bg-gray-200"></div>
              <div className="h-4 w-5/6 rounded bg-gray-200"></div>
              <div className="h-4 w-3/6 rounded bg-gray-200"></div>
            </div>
          </div>
  
          {/* Price Skeleton */}
          <div>
            <div className="h-6 w-1/3 rounded bg-gray-200 mb-4"></div>
            <div className="h-4 w-1/2 rounded bg-gray-200 mb-2"></div>
            <div className="h-2 w-full rounded bg-gray-200"></div>
          </div>
  
          {/* Rating Skeleton */}
          <div>
            <div className="h-6 w-1/2 rounded bg-gray-200 mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 w-4/6 rounded bg-gray-200"></div>
              <div className="h-4 w-4/6 rounded bg-gray-200"></div>
              <div className="h-4 w-4/6 rounded bg-gray-200"></div>
            </div>
          </div>
  
          {/* Availability Skeleton */}
          <div>
            <div className="h-6 w-1/2 rounded bg-gray-200 mb-4"></div>
            <div className="h-4 w-3/6 rounded bg-gray-200"></div>
          </div>
        </div>
      </aside>
    );
  }
  