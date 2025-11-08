import { TableRowSkeleton } from "@/components/LoadingStates";

export default function AttendanceLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-56"></div>
        </div>
        <div className="h-10 bg-gray-300 rounded w-24 animate-pulse"></div>
      </div>

      {/* Filters card skeleton */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body animate-pulse">
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="h-8 bg-gray-300 rounded w-24"></div>
            <div className="h-8 bg-gray-300 rounded w-28"></div>
            <div className="h-8 bg-gray-300 rounded w-32"></div>
            <div className="h-8 bg-gray-300 rounded w-20"></div>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-2">
              <div className="h-4 bg-gray-300 rounded w-20"></div>
              <div className="h-10 bg-gray-300 rounded w-40"></div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-4 bg-gray-300 rounded w-20"></div>
              <div className="h-10 bg-gray-300 rounded w-40"></div>
            </div>
            <div className="h-10 bg-gray-300 rounded w-24 self-end"></div>
          </div>
        </div>
      </div>

      {/* Table skeleton */}
      <div className="card bg-base-100 shadow-xl">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Student</th>
                <th>Days Present</th>
                <th>Days Absent</th>
                <th>Attendance Rate</th>
              </tr>
            </thead>
            <tbody>
              <TableRowSkeleton columns={4} />
              <TableRowSkeleton columns={4} />
              <TableRowSkeleton columns={4} />
              <TableRowSkeleton columns={4} />
              <TableRowSkeleton columns={4} />
              <TableRowSkeleton columns={4} />
              <TableRowSkeleton columns={4} />
              <TableRowSkeleton columns={4} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
