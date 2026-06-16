"use client"

import { useState } from 'react'
import { Calendar, Clock, Eye, Star } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getImageUrl } from '@/lib/image-utils-client'
import {
  estimateReadingTime,
  getNewsCategoryLabel,
} from '@/lib/news-constants'

export interface NewsPreviewData {
  title: string
  titleEn?: string
  summary?: string
  summaryEn?: string
  content: string
  contentEn?: string
  coverImage?: string
  coverPreviewUrl?: string | null
  category?: string
  tags: string[]
  isFeatured?: boolean
}

interface NewsPreviewDialogProps {
  open: boolean
  onClose: () => void
  data: NewsPreviewData
}

/**
 * Xem trước tin tức đúng như khi hiển thị trên trang công khai,
 * có công tắc chuyển ngôn ngữ VI/EN nếu bài có bản tiếng Anh.
 */
export function NewsPreviewDialog({ open, onClose, data }: NewsPreviewDialogProps) {
  const [lang, setLang] = useState<'vi' | 'en'>('vi')

  const hasEnglish = Boolean(data.titleEn || data.contentEn)
  const showEn = lang === 'en' && hasEnglish

  const title = showEn ? data.titleEn || data.title : data.title
  const summary = showEn ? data.summaryEn || data.summary : data.summary
  const content = showEn ? data.contentEn || data.content : data.content
  const readTime = estimateReadingTime(content)
  const coverSrc = data.coverPreviewUrl || (data.coverImage ? getImageUrl(data.coverImage) : null)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sticky top-0 z-10 flex flex-row items-center justify-between gap-3 border-b bg-white/95 px-6 py-3 backdrop-blur dark:bg-gray-950/95">
          <DialogTitle className="text-sm font-medium text-gray-500">
            Xem trước tin tức
          </DialogTitle>
          {hasEnglish && (
            <div className="flex items-center gap-1 rounded-md border p-0.5">
              <Button
                type="button"
                size="sm"
                variant={lang === 'vi' ? 'default' : 'ghost'}
                className="h-6 px-2 text-xs"
                onClick={() => setLang('vi')}
              >
                Tiếng Việt
              </Button>
              <Button
                type="button"
                size="sm"
                variant={lang === 'en' ? 'default' : 'ghost'}
                className="h-6 px-2 text-xs"
                onClick={() => setLang('en')}
              >
                English
              </Button>
            </div>
          )}
        </DialogHeader>

        <article className="px-6 pb-8 pt-2">
          {/* Meta */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {data.category && (
              <Badge variant="outline" className="border-[#1E3924]/30 text-[#1E3924] dark:text-emerald-400">
                {getNewsCategoryLabel(data.category)}
              </Badge>
            )}
            {data.isFeatured && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#D4A843]">
                <Star className="h-3 w-3" fill="currentColor" /> Nổi bật
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold leading-snug text-gray-900 dark:text-gray-100 md:text-3xl">
            {title || <span className="text-gray-300">(Chưa có tiêu đề)</span>}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-400">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Hôm nay
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {readTime} phút đọc
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" /> 0 lượt xem
            </span>
          </div>

          {coverSrc && (
            <div className="mt-5 overflow-hidden rounded-xl border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverSrc} alt={title} className="max-h-[420px] w-full object-cover" />
            </div>
          )}

          {summary && (
            <p className="mt-5 border-l-4 border-[#1E3924]/40 bg-[#E8F3EA]/50 px-4 py-3 text-base italic leading-relaxed text-gray-600 dark:bg-[#1E3924]/20 dark:text-gray-300">
              {summary}
            </p>
          )}

          {content ? (
            <div
              className="prose prose-slate mt-6 max-w-none dark:prose-invert
                prose-headings:text-[#1E3924] dark:prose-headings:text-emerald-400
                prose-a:text-[#1E3924] dark:prose-a:text-emerald-400
                prose-img:rounded-lg"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <p className="mt-6 text-sm text-gray-300">(Chưa có nội dung)</p>
          )}

          {data.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2 border-t pt-4">
              {data.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </article>
      </DialogContent>
    </Dialog>
  )
}
