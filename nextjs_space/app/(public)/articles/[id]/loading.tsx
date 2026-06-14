import { Skeleton } from '@/components/ui/skeleton'

export default function ArticleDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex gap-2 mb-6">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Category badge */}
      <Skeleton className="h-6 w-32 mb-4" />

      {/* Title */}
      <div className="space-y-2 mb-6">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-5/6" />
      </div>

      {/* Meta: author, date, stats */}
      <div className="flex flex-wrap gap-4 mb-6 pb-6 border-b">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-28" />
      </div>

      {/* Abstract box */}
      <div className="border rounded-lg p-5 mb-8 space-y-3">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>

      {/* Keywords */}
      <div className="flex flex-wrap gap-2 mb-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-20 rounded-full" />
        ))}
      </div>

      {/* PDF download + citation buttons */}
      <div className="flex gap-3 mb-8">
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Body content */}
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}
