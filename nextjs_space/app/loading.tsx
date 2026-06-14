import { Skeleton } from '@/components/ui/skeleton'

export default function RootLoading() {
  return (
    <div className="min-h-screen">
      {/* Hero skeleton */}
      <div className="w-full h-[400px] bg-muted animate-pulse" />

      <div className="container mx-auto px-4 py-12 space-y-12">
        {/* Featured articles */}
        <section className="space-y-4">
          <Skeleton className="h-7 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-5 space-y-3">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-4/5" />
                <Skeleton className="h-4 w-36" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Latest issue + news */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-7 w-48" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4 py-3 border-b">
                <Skeleton className="w-16 h-16 rounded flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <Skeleton className="h-7 w-36" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-1 pb-3 border-b">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
