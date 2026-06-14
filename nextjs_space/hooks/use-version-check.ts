'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

type AppVersionResponse = {
  success: boolean
  data: { buildId: string }
}

export function useVersionCheck() {
  // Capture the build ID that was bundled when this page was served
  const [initialBuildId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (window as any).__NEXT_DATA__?.buildId ?? null
  })

  const { data } = useQuery<AppVersionResponse>({
    queryKey: ['app-version'],
    queryFn: () => fetch('/api/app-version').then(r => r.json()),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 0,
    enabled: !!initialBuildId,
  })

  const serverBuildId = data?.data?.buildId
  const hasNewVersion =
    !!serverBuildId &&
    !!initialBuildId &&
    serverBuildId !== 'dev' &&
    serverBuildId !== initialBuildId

  return { hasNewVersion }
}
