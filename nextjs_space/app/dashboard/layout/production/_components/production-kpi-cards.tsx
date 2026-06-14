'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Printer, CheckCircle, BookOpen } from 'lucide-react'

interface ProductionItem {
  published: boolean
  publishedAt?: string
  issue?: { number: number; volume: { volumeNo: number } }
}

interface ProductionKpiCardsProps {
  items: ProductionItem[]
  loading?: boolean
}

function isThisMonth(dateStr?: string): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

export function ProductionKpiCards({ items, loading }: ProductionKpiCardsProps) {
  const inProductionCount = items.filter(p => !p.published).length
  const publishedThisMonth = items.filter(p => p.published && isThisMonth(p.publishedAt)).length
  const awaitingIssue = items.filter(p => !p.published && !p.issue).length

  const cards = [
    {
      label: 'Đang sản xuất',
      value: inProductionCount,
      icon: Printer,
      colorClass: 'text-blue-600',
      bgClass: 'bg-blue-50',
      borderClass: 'border-blue-100',
    },
    {
      label: 'Xuất bản tháng này',
      value: publishedThisMonth,
      icon: CheckCircle,
      colorClass: 'text-emerald-600',
      bgClass: 'bg-emerald-50',
      borderClass: 'border-emerald-100',
    },
    {
      label: 'Chờ gán số tạp chí',
      value: awaitingIssue,
      icon: BookOpen,
      colorClass: 'text-amber-600',
      bgClass: 'bg-amber-50',
      borderClass: 'border-amber-100',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map(({ label, value, icon: Icon, colorClass, bgClass, borderClass }) => (
        <Card key={label} className={`border ${borderClass}`}>
          <CardContent className="flex items-center gap-4 pt-5 pb-5">
            <div className={`p-3 rounded-lg ${bgClass}`}>
              <Icon className={`h-5 w-5 ${colorClass}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold">
                {loading ? '—' : value}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
