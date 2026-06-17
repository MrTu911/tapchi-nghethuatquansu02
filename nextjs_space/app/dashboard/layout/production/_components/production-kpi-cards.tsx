'use client'

import { Printer, CheckCircle, BookMarked, AlarmClock } from 'lucide-react'
import { BrandStatCard } from '@/components/dashboard/brand-stat-card'

interface ProductionItem {
  published: boolean
  publishedAt?: string
  issue?: { number: number; volume: { volumeNo: number } }
  daysInProduction?: number
}

interface ProductionKpiCardsProps {
  items: ProductionItem[]
  loading?: boolean
}

const OVERDUE_DAYS = 30

function isThisMonth(dateStr?: string): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

export function ProductionKpiCards({ items, loading }: ProductionKpiCardsProps) {
  const inProductionCount = items.filter(p => !p.published).length
  const awaitingIssue = items.filter(p => !p.published && !p.issue).length
  const publishedThisMonth = items.filter(p => p.published && isThisMonth(p.publishedAt)).length
  const overdue = items.filter(p => !p.published && (p.daysInProduction ?? 0) > OVERDUE_DAYS).length

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <BrandStatCard
        label="Đang sản xuất"
        value={inProductionCount}
        icon={Printer}
        tone="green"
        hint="Bài đang biên tập & dàn trang"
        loading={loading}
      />
      <BrandStatCard
        label="Chờ gán số tạp chí"
        value={awaitingIssue}
        icon={BookMarked}
        tone="gold"
        hint="Cần gán vào một số trước khi xuất bản"
        loading={loading}
      />
      <BrandStatCard
        label="Xuất bản tháng này"
        value={publishedThisMonth}
        icon={CheckCircle}
        tone="emerald"
        hint="Bài đã công bố trong tháng"
        loading={loading}
      />
      <BrandStatCard
        label={`Quá hạn (> ${OVERDUE_DAYS} ngày)`}
        value={overdue}
        icon={AlarmClock}
        tone={overdue > 0 ? 'rose' : 'slate'}
        hint="Bài tồn đọng trong sản xuất"
        loading={loading}
      />
    </div>
  )
}
