import { Skeleton } from '@/components/ui/skeleton'

export default function ArchiveLoading() {
  return (
    <div className="py-8 space-y-10">
      {/* Breadcrumb */}
      <Skeleton className="h-4 w-40" />

      {/* Hero band */}
      <Skeleton className="h-56 w-full rounded-xl" />

      {/* Registry strip */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border md:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-5">
            <Skeleton className="h-11 w-11 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs + content */}
      <div className="space-y-6">
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-5">
            <Skeleton className="h-12 w-full rounded-lg" />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3 rounded-lg border p-4">
                  <Skeleton className="aspect-[3/4] w-full rounded-md" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
