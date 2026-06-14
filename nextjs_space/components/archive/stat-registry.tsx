import { BookOpen, FileText, Users, Eye, Download } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'

export interface ArchiveStats {
  totalIssues: number
  totalArticles: number
  totalAuthors: number
  totalViews: number
  totalDownloads: number
}

interface RegistryCell {
  icon: LucideIcon
  value: number
  label: string
}

// Dải "sổ bộ" thay cho 5 thẻ gradient cầu vồng: đơn sắc đỏ rượu + đường kẻ vàng đồng,
// đọc như mục lục/đề mục của một CSDL, không phải KPI dashboard.
export function StatRegistry({ stats }: { stats: ArchiveStats }) {
  const cells: RegistryCell[] = [
    { icon: BookOpen, value: stats.totalIssues, label: 'Số tạp chí' },
    { icon: FileText, value: stats.totalArticles, label: 'Bài báo' },
    { icon: Users, value: stats.totalAuthors, label: 'Tác giả' },
    { icon: Eye, value: stats.totalViews, label: 'Lượt xem' },
    { icon: Download, value: stats.totalDownloads, label: 'Lượt tải' },
  ]

  return (
    <Card className="card-bg overflow-hidden border-t-2 border-t-[#C8960C]">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 divide-x divide-y md:divide-y-0 divide-[#C8960C]/20">
        {cells.map(({ icon: Icon, value, label }) => (
          <div key={label} className="flex items-center gap-3 p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#8B1A1A]/5 dark:bg-[#C8960C]/10">
              <Icon className="h-5 w-5 text-[#8B1A1A] dark:text-[#C8960C]" />
            </span>
            <div className="min-w-0">
              <div className="font-serif text-2xl font-bold tabular-nums text-content leading-none">
                {value.toLocaleString('vi-VN')}
              </div>
              <div className="mt-1 text-xs text-content-muted">{label}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
