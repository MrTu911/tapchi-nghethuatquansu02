
import { ExternalLink, Globe, School, Shield, Newspaper, BookOpen, Link2 } from 'lucide-react'
import { getJsonSetting } from '@/lib/site-settings'
import type { LucideIcon } from 'lucide-react'

interface ExternalLink {
  title: string
  url: string
  icon: string
  order: number
  isActive: boolean
}

const ICON_MAP: Record<string, LucideIcon> = {
  School,
  Shield,
  Globe,
  Newspaper,
  BookOpen,
  Link2,
}

const DEFAULT_LINKS: ExternalLink[] = [
  { title: 'Học viện Quốc phòng', url: 'https://www.nda.edu.vn', icon: 'School', order: 1, isActive: true },
  { title: 'Bộ Quốc phòng', url: 'https://www.mod.gov.vn', icon: 'Shield', order: 2, isActive: true },
  { title: 'Quân Đội Nhân Dân Việt Nam', url: 'https://www.qdnd.vn', icon: 'Newspaper', order: 3, isActive: true },
  { title: 'Cổng Thông tin Chính phủ', url: 'https://chinhphu.vn', icon: 'Globe', order: 4, isActive: true },
  { title: 'Đảng Cộng Sản Việt Nam', url: 'http://dangcongsan.vn', icon: 'Globe', order: 5, isActive: true },
  { title: 'Tạp chí Quốc phòng toàn dân', url: 'https://tapchiqptd.vn', icon: 'BookOpen', order: 6, isActive: true },
]

export async function ExternalLinksSection() {
  const links = await getJsonSetting<ExternalLink[]>('external_links', DEFAULT_LINKS) ?? DEFAULT_LINKS
  const activeLinks = links.filter((l) => l.isActive).sort((a, b) => a.order - b.order)

  if (activeLinks.length === 0) return null

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3">
        <Link2 className="h-4 w-4 text-primary shrink-0" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
          Liên kết trang
        </h3>
      </div>
      <ul className="space-y-1.5">
        {activeLinks.map((link, idx) => {
          const Icon = ICON_MAP[link.icon] ?? Globe
          return (
            <li key={idx}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 py-1.5 px-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors group"
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-primary/70 group-hover:text-primary transition-colors" />
                <span className="flex-1 line-clamp-1">{link.title}</span>
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
