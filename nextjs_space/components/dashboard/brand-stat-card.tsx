import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * KPI/stat card dùng chung cho các khu vực dàn trang & xuất bản.
 *
 * Áp palette thương hiệu NTQS (xanh quân sự #1E3924 + vàng đồng #E5C86E) làm
 * tông chủ đạo, kèm vài tông phụ ngữ nghĩa (emerald = thành công, rose = cảnh
 * báo...). Card có dải accent dọc bên trái + bong bóng icon để dễ quét nhìn.
 *
 * Là "shared component" (KHÔNG khai báo 'use client'): thuần trình bày, không
 * dùng hook/handler/browser API. Nhờ vậy các Server Component (managing,
 * deputy, security, issues...) truyền thẳng `icon` lucide (forwardRef) mà không
 * vướng lỗi "Functions cannot be passed to Client Components"; đồng thời các
 * Client Component vẫn import và dùng bình thường.
 */
export type BrandTone = 'green' | 'gold' | 'emerald' | 'sky' | 'amber' | 'rose' | 'slate'

interface ToneStyle {
  bar: string
  bubble: string
  icon: string
  value: string
}

const TONE_STYLES: Record<BrandTone, ToneStyle> = {
  green: {
    bar: 'bg-[#1E3924]',
    bubble: 'bg-[#1E3924]/10 dark:bg-[#1E3924]/40',
    icon: 'text-[#1E3924] dark:text-emerald-300',
    value: 'text-[#1E3924] dark:text-emerald-200',
  },
  gold: {
    bar: 'bg-[#E5C86E]',
    bubble: 'bg-[#E5C86E]/25 dark:bg-[#E5C86E]/20',
    icon: 'text-[#8a6a14] dark:text-[#E5C86E]',
    value: 'text-[#8a6a14] dark:text-[#E5C86E]',
  },
  emerald: {
    bar: 'bg-emerald-500',
    bubble: 'bg-emerald-100 dark:bg-emerald-900/40',
    icon: 'text-emerald-700 dark:text-emerald-300',
    value: 'text-emerald-700 dark:text-emerald-200',
  },
  sky: {
    bar: 'bg-sky-500',
    bubble: 'bg-sky-100 dark:bg-sky-900/40',
    icon: 'text-sky-700 dark:text-sky-300',
    value: 'text-sky-700 dark:text-sky-200',
  },
  amber: {
    bar: 'bg-amber-500',
    bubble: 'bg-amber-100 dark:bg-amber-900/40',
    icon: 'text-amber-700 dark:text-amber-300',
    value: 'text-amber-700 dark:text-amber-200',
  },
  rose: {
    bar: 'bg-rose-500',
    bubble: 'bg-rose-100 dark:bg-rose-900/40',
    icon: 'text-rose-700 dark:text-rose-300',
    value: 'text-rose-700 dark:text-rose-200',
  },
  slate: {
    bar: 'bg-slate-400',
    bubble: 'bg-slate-100 dark:bg-slate-800',
    icon: 'text-slate-600 dark:text-slate-300',
    value: 'text-slate-700 dark:text-slate-200',
  },
}

interface BrandStatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  tone?: BrandTone
  hint?: string
  loading?: boolean
  className?: string
}

export function BrandStatCard({
  label,
  value,
  icon: Icon,
  tone = 'green',
  hint,
  loading = false,
  className,
}: BrandStatCardProps) {
  const t = TONE_STYLES[tone]

  return (
    <Card
      className={cn(
        'relative overflow-hidden border-border/60 shadow-sm transition-shadow hover:shadow-md',
        className
      )}
    >
      {/* Dải accent dọc theo tông màu */}
      <span className={cn('absolute inset-y-0 left-0 w-1.5', t.bar)} aria-hidden />

      <div className="flex items-center gap-4 py-5 pl-6 pr-5">
        <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', t.bubble)}>
          <Icon className={cn('h-6 w-6', t.icon)} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-muted-foreground">{label}</p>
          <p className={cn('text-2xl font-bold leading-tight tabular-nums', t.value)}>
            {loading ? '—' : value}
          </p>
          {hint && <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>}
        </div>
      </div>
    </Card>
  )
}
