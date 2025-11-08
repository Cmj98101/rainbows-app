import { StatCardSkeleton, AccordionSkeleton } from "@/components/LoadingStates";

export default function StudentsLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-96"></div>
        </div>
        <div className="h-10 bg-gray-300 rounded w-32 animate-pulse"></div>
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Controls skeleton */}
      <div className="card bg-base-100 shadow-xl animate-pulse">
        <div className="card-body">
          <div className="flex gap-4 items-center justify-between">
            <div className="flex gap-2">
              <div className="h-8 bg-gray-300 rounded w-24"></div>
              <div className="h-8 bg-gray-300 rounded w-32"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-8 bg-gray-300 rounded w-64"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="space-y-4">
        <AccordionSkeleton />
        <AccordionSkeleton />
        <AccordionSkeleton />
      </div>
    </div>
  );
}
