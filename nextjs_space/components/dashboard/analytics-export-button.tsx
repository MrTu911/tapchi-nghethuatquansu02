'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet, Printer, ChevronDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface AnalyticsExportButtonProps {
  className?: string
}

export default function AnalyticsExportButton({ className }: AnalyticsExportButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  async function handleXlsxExport() {
    if (isDownloading) return
    setIsDownloading(true)
    try {
      const res = await fetch('/api/statistics/export?format=xlsx')
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        alert(body?.error ?? 'Lỗi khi xuất báo cáo')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      // Read filename from Content-Disposition if present
      const disposition = res.headers.get('Content-Disposition') ?? ''
      const match = disposition.match(/filename="([^"]+)"/)
      a.download = match ? match[1] : 'bao-cao-tapchi.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } finally {
      setIsDownloading(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('gap-1.5', className)}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          Xuất báo cáo
          <ChevronDown className="h-3 w-3 opacity-60" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleXlsxExport} disabled={isDownloading}>
          <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" aria-hidden="true" />
          Xuất Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2 text-gray-500" aria-hidden="true" />
          In báo cáo (PDF)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
