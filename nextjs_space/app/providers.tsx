'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time 30s — phù hợp với intranet tốc độ cao
            staleTime: 30 * 1000,
            // Retry 1 lần trước khi hiện lỗi
            retry: 1,
            // Không refetch khi window focus lại (giảm request không cần thiết)
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
