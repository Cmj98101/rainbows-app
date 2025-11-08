import { StatCardSkeleton, ClassCardSkeleton } from "@/components/LoadingStates";

export default function Loading() {
  return (
    <main className="p-4 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="animate-pulse">
        <div className="h-8 bg-gray-300 rounded w-32 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-80"></div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Quick Actions Card */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-32 mb-4"></div>
          <div className="flex flex-wrap gap-2">
            <div className="h-10 bg-gray-300 rounded w-32"></div>
            <div className="h-10 bg-gray-300 rounded w-28"></div>
            <div className="h-10 bg-gray-300 rounded w-24"></div>
          </div>
        </div>
      </div>

      {/* Class Overview */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4 animate-pulse">
            <div className="h-6 bg-gray-300 rounded w-32"></div>
            <div className="h-8 bg-gray-300 rounded w-32"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ClassCardSkeleton />
            <ClassCardSkeleton />
            <ClassCardSkeleton />
          </div>
        </div>
      </div>
    </main>
  );
}
