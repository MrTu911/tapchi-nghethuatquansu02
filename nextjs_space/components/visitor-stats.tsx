'use client'

import { useEffect, useState } from 'react'
import { Eye, Download, TrendingUp } from 'lucide-react'

interface Stats {
  total: number
  today: number
  downloads: number
}

export default function VisitorStats({ className = '' }: { className?: string }) {
  const [mounted, setMounted] = useState(false)
  const [stats, setStats] = useState<Stats>({ total: 0, today: 0, downloads: 0 })

  useEffect(() => {
    setMounted(true)

    const fetchStats = async () => {
      try {
        const res = await fetch('/api/analytics/visitors')
        if (!res.ok) return
        const data = await res.json()
        if (data.success && data.data) {
          setStats({
            total: data.data.totalVisits ?? 0,
            today: data.data.todayVisits ?? 0,
            downloads: data.data.totalDownloads ?? 0,
          })
        }
      } catch {
        // silently fail – stats are non-critical
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (!mounted) return null

  const rows = [
    {
      icon: Eye,
      label: 'Tổng lượt xem',
      value: stats.total,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      icon: TrendingUp,
      label: 'Lượt xem hôm nay',
      value: stats.today,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      icon: Download,
      label: 'Tổng tải xuống',
      value: stats.downloads,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
    },
  ]

  return (
    <div className={`space-y-2 ${className}`}>
      {rows.map(row => (
        <div key={row.label} className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${row.bg}`}>
          <div className="flex items-center gap-2">
            <row.icon className={`h-4 w-4 ${row.color}`} />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{row.label}</span>
          </div>
          <span className={`text-sm font-bold ${row.color}`}>
            {row.value.toLocaleString('vi-VN')}
          </span>
        </div>
      ))}
    </div>
  )
}
