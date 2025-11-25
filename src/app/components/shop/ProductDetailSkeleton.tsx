export function ProductDetailSkeleton() {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8">
          {/* Image Gallery Skeleton */}
          <div className="animate-pulse">
            <div className="h-96 w-full rounded-lg bg-gray-200 lg:h-[32rem]"></div>
            <div className="mt-4 grid grid-cols-4 gap-2">
              <div className="h-20 w-full rounded-lg bg-gray-200"></div>
              <div className="h-20 w-full rounded-lg bg-gray-200"></div>
              <div className="h-20 w-full rounded-lg bg-gray-200"></div>
              <div className="h-20 w-full rounded-lg bg-gray-200"></div>
            </div>
          </div>
  
          {/* Product Info Skeleton */}
          <div className="mt-8 animate-pulse lg:mt-0">
            <div className="h-10 w-3/4 rounded bg-gray-200"></div>
            <div className="mt-4 h-6 w-1/2 rounded bg-gray-200"></div>
            <div className="mt-4 h-4 w-1/4 rounded bg-gray-200"></div>
            <div className="mt-6 h-12 w-1/3 rounded bg-gray-200"></div>
            <div className="mt-6 h-6 w-full rounded bg-gray-200"></div>
            <div className="mt-2 h-6 w-5/6 rounded bg-gray-200"></div>
            <div className="mt-2 h-6 w-4/6 rounded bg-gray-200"></div>
            <div className="mt-8 flex items-center gap-4">
              <div className="h-12 w-24 rounded-lg bg-gray-200"></div>
              <div className="h-12 flex-1 rounded-lg bg-gray-200"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  