import { Skeleton } from "../ui/skeleton"

export function TopicExplorerSkeleton() {
  return (
    <div className="w-full space-y-6">
      {/* Title skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>

      {/* Section skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="space-y-2 pl-9">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
          {/* Resource grid skeleton */}
          <div className="grid grid-cols-1 gap-3 pl-9 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2].map((j) => (
              <div key={j} className="space-y-2 rounded-lg border p-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
