'use client'

import { useState } from 'react'
import { RefreshCw, X } from 'lucide-react'
import { useVersionCheck } from '@/hooks/use-version-check'

export function VersionUpdateBanner() {
  const { hasNewVersion } = useVersionCheck()
  const [dismissed, setDismissed] = useState(false)

  if (!hasNewVersion || dismissed) return null

  return (
    <div className="w-full bg-amber-500 text-military-900 flex items-center justify-between px-4 py-2 gap-3 text-sm font-medium">
      <div className="flex items-center gap-2 min-w-0">
        <RefreshCw className="h-4 w-4 shrink-0" />
        <span className="truncate">
          Hệ thống vừa được cập nhật phiên bản mới. Vui lòng tải lại trang để tiếp tục.
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => window.location.reload()}
          className="rounded bg-military-900 text-amber-400 px-3 py-1 text-xs font-semibold hover:bg-military-800 transition-colors"
        >
          Tải lại ngay
        </button>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Đóng thông báo"
          className="rounded p-1 hover:bg-amber-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
