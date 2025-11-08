/**
 * Reusable loading skeleton components
 */

export function StatCardSkeleton() {
  return (
    <div className="stat bg-base-100 shadow rounded-lg animate-pulse">
      <div className="stat-title h-4 bg-gray-300 rounded w-24 mb-2"></div>
      <div className="stat-value h-12 bg-gray-300 rounded w-32 mb-2"></div>
      <div className="stat-desc h-3 bg-gray-300 rounded w-20"></div>
    </div>
  );
}

export function ClassCardSkeleton() {
  return (
    <div className="card bg-base-200 animate-pulse">
      <div className="card-body">
        <div className="h-6 bg-gray-300 rounded w-32 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-16 mb-4"></div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-4 bg-gray-300 rounded w-20"></div>
            <div className="h-4 bg-gray-300 rounded w-8"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-4 bg-gray-300 rounded w-20"></div>
            <div className="h-4 bg-gray-300 rounded w-8"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i}>
          <div className="h-4 bg-gray-300 rounded w-full"></div>
        </td>
      ))}
    </tr>
  );
}

export function AccordionSkeleton() {
  return (
    <div className="collapse collapse-arrow bg-base-100 shadow-xl animate-pulse">
      <div className="collapse-title">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-300 rounded w-40"></div>
          <div className="h-8 bg-gray-300 rounded-full w-20"></div>
        </div>
      </div>
    </div>
  );
}

export function LoadingSpinner({ size = "lg" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClass = {
    sm: "loading-sm",
    md: "loading-md",
    lg: "loading-lg"
  }[size];

  return (
    <div className="flex justify-center items-center min-h-[200px]">
      <span className={`loading loading-spinner ${sizeClass}`}></span>
    </div>
  );
}

export function PageLoadingState() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4">
      {/* Header skeleton */}
      <div className="animate-pulse">
        <div className="h-8 bg-gray-300 rounded w-48 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-96"></div>
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Content card skeleton */}
      <div className="card bg-base-100 shadow-xl animate-pulse">
        <div className="card-body">
          <div className="h-6 bg-gray-300 rounded w-40 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-300 rounded w-full"></div>
            <div className="h-4 bg-gray-300 rounded w-full"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
