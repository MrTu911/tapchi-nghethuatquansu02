import { Skeleton } from '@/components/ui/skeleton';

export default function MessagesLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] overflow-hidden">
      {/* Header skeleton */}
      <div className="flex items-center justify-between px-1 pb-4 shrink-0">
        <div className="space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      {/* Panel skeleton */}
      <div className="flex flex-1 overflow-hidden rounded-xl border shadow-sm">
        {/* Sidebar skeleton */}
        <div className="w-[300px] shrink-0 hidden md:flex flex-col border-r">
          <Skeleton className="h-10 w-full rounded-none" />
          <Skeleton className="h-9 mx-3 my-2 rounded-md" />
          <div className="p-3 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-2.5 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat area skeleton */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-3 px-5 py-3 border-b">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="flex-1 p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex gap-2 ${i % 2 === 0 ? 'justify-end' : ''}`}>
                {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full shrink-0" />}
                <Skeleton className={`h-12 rounded-2xl ${i % 2 === 0 ? 'w-48' : 'w-64'}`} />
              </div>
            ))}
          </div>
          <div className="border-t px-4 py-3">
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
