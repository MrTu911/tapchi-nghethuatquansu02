
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  { title: 'Tạp chí Quốc phòng toàn dân', url: 'https://tapchiqptd.vn', icon: 'BookOpen', order: 3, isActive: true },
]

export async function QuickLinksWidget() {
  const links = await getJsonSetting<ExternalLink[]>('external_links', DEFAULT_LINKS) ?? DEFAULT_LINKS
  const activeLinks = links.filter((l) => l.isActive).sort((a, b) => a.order - b.order)

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-purple-600 flex items-center justify-center">
            <ExternalLink className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="text-lg">Liên kết nhanh</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-2">
          {activeLinks.map((link, idx) => {
            const Icon = ICON_MAP[link.icon] ?? Globe
            return (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors group border"
              >
                <div className="h-8 w-8 rounded-md bg-purple-100 dark:bg-purple-900 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-sm font-medium flex-1 line-clamp-1">
                  {link.title}
                </span>
                <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </a>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
