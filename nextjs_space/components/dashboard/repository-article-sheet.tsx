'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  User, Building2, BookOpen, Calendar, Eye, Download, Tag, Quote,
  ExternalLink, FileText, AlertCircle, Pencil, Hash, ScrollText,
} from 'lucide-react'

/** Nguồn bài — khớp RepositoryArticleSource ở service (giữ client không phụ thuộc prisma). */
type ArticleSource = 'PEER_REVIEW' | 'JOURNAL_IMPORT'

/** Mirror của RepositoryArticleDetail (repository.service.ts) cho phía client. */
interface ArticleDetail {
  id: string
  sourceType: ArticleSource
  title: string
  authors: string
  authorOrg: string | null
  categoryName: string
  issueInfo: string
  pages: string | null
  publishedAt: string | null
  views: number
  downloads: number
  abstractVn: string
  abstractEn: string | null
  keywords: string[]
  doiLocal: string | null
  paragraphs: string[]
  references: string[]
  hasFullText: boolean
  pdfUrl: string | null
  downloadUrl: string | null
  fullTextHref: string
  editable: boolean
}

export interface RepositoryArticleRef {
  id: string
  sourceType: ArticleSource
  title: string
}

interface Props {
  article: RepositoryArticleRef | null
  open: boolean
  onOpenChange: (open: boolean) => void
  canManage: boolean
}

const SOURCE_LABEL: Record<ArticleSource, string> = {
  PEER_REVIEW: 'Qua phản biện',
  JOURNAL_IMPORT: 'Kho số',
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Drawer xem nhanh nội dung bài báo CSDL ngay trong trang danh sách — không điều
 * hướng. Tự tải chi tiết khi mở; bài kho số hiển thị cả toàn văn số hóa.
 */
export function RepositoryArticleSheet({ article, open, onOpenChange, canManage }: Props) {
  const [detail, setDetail] = useState<ArticleDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !article) return

    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      setDetail(null)
      try {
        const res = await fetch(
          `/api/repository/view/${article.id}?sourceType=${article.sourceType}`,
        )
        const data = await res.json()
        if (cancelled) return
        if (data.success) {
          setDetail(data.data)
        } else {
          setError(data.error || 'Không tải được nội dung bài báo')
        }
      } catch {
        if (!cancelled) setError('Lỗi kết nối khi tải bài báo')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [open, article])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl p-0 flex flex-col gap-0"
      >
        {/* Header cố định */}
        <SheetHeader className="border-b bg-muted/40 px-6 py-4 space-y-2 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {detail?.categoryName ?? '—'}
            </Badge>
            {article && (
              <Badge
                variant="outline"
                className={
                  article.sourceType === 'PEER_REVIEW'
                    ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-400'
                    : 'border-amber-500/40 text-amber-700 dark:text-amber-500'
                }
              >
                {SOURCE_LABEL[article.sourceType]}
              </Badge>
            )}
          </div>
          <SheetTitle className="text-lg leading-snug font-serif">
            {detail?.title ?? article?.title ?? 'Chi tiết bài báo'}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Nội dung chi tiết bài báo trong cơ sở dữ liệu
          </SheetDescription>
        </SheetHeader>

        {/* Nội dung cuộn */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading && <DetailSkeleton />}

          {!loading && error && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          )}

          {!loading && detail && (
            <div className="space-y-6">
              {/* Tác giả + đơn vị */}
              <div className="space-y-1.5 text-sm">
                <div className="flex items-start gap-2">
                  <User className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <span className="font-medium text-foreground">{detail.authors || '—'}</span>
                </div>
                {detail.authorOrg && (
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <Building2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{detail.authorOrg}</span>
                  </div>
                )}
              </div>

              {/* Thông tin số/trang/ngày */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                {detail.issueInfo && (
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4" />
                    {detail.issueInfo}
                  </span>
                )}
                {detail.pages && (
                  <span className="inline-flex items-center gap-1.5">
                    <FileText className="h-4 w-4" />
                    Trang {detail.pages}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {formatDate(detail.publishedAt)}
                </span>
              </div>

              {/* Lượt xem/tải (chỉ bài phản biện có theo dõi) */}
              {detail.sourceType === 'PEER_REVIEW' && (
                <div className="flex gap-6 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Eye className="h-4 w-4" />
                    {detail.views} lượt xem
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Download className="h-4 w-4" />
                    {detail.downloads} lượt tải
                  </span>
                </div>
              )}

              <Separator />

              {/* Tóm tắt */}
              <section>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-foreground">
                  <Quote className="h-4 w-4 text-primary" />
                  Tóm tắt
                </h3>
                <p className="whitespace-pre-line text-justify text-sm leading-relaxed text-foreground/90">
                  {detail.abstractVn || 'Chưa có tóm tắt.'}
                </p>
              </section>

              {detail.abstractEn && (
                <section>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-foreground">
                    Abstract
                  </h3>
                  <p className="whitespace-pre-line text-justify text-sm italic leading-relaxed text-foreground/80">
                    {detail.abstractEn}
                  </p>
                </section>
              )}

              {/* Từ khóa */}
              {detail.keywords.length > 0 && (
                <section className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Hash className="h-3 w-3" />
                    Từ khóa
                  </span>
                  {detail.keywords.map((kw) => (
                    <Badge key={kw} variant="outline" className="font-normal">
                      <Tag className="mr-1 h-3 w-3" />
                      {kw}
                    </Badge>
                  ))}
                </section>
              )}

              {/* DOI */}
              {detail.doiLocal && (
                <div className="flex items-center gap-2 text-sm">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">DOI:</span>
                  <a
                    href={`https://doi.org/${detail.doiLocal}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {detail.doiLocal}
                  </a>
                </div>
              )}

              {/* Toàn văn (bài kho số đã số hóa) */}
              {detail.hasFullText && (
                <section>
                  <Separator className="mb-5" />
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-foreground">
                    <ScrollText className="h-4 w-4 text-primary" />
                    Toàn văn
                  </h3>
                  <div className="space-y-4 text-justify font-serif text-[15px] leading-[1.85] text-foreground/90">
                    {detail.paragraphs.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>

                  {detail.references.length > 0 && (
                    <div className="mt-8">
                      <h4 className="mb-2 text-sm font-semibold text-foreground">
                        Tài liệu tham khảo
                      </h4>
                      <ol className="list-none space-y-1.5 pl-0 text-sm leading-relaxed text-muted-foreground">
                        {detail.references.map((ref, i) => (
                          <li key={i}>{ref}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </section>
              )}

              {/* Bài phản biện không có toàn văn số hóa → gợi ý mở trang đọc */}
              {!detail.hasFullText && detail.sourceType === 'PEER_REVIEW' && (
                <p className="rounded-md border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                  Toàn văn bài báo nằm trong file PDF. Mở "Xem toàn văn" hoặc tải PDF bên dưới.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Hành động cố định dưới */}
        {!loading && detail && (
          <div className="flex flex-wrap gap-2 border-t bg-muted/40 px-6 py-4">
            {detail.downloadUrl && (
              <Button asChild size="sm">
                <a href={detail.downloadUrl}>
                  <Download className="mr-2 h-4 w-4" />
                  Tải PDF
                </a>
              </Button>
            )}
            {detail.pdfUrl && (
              <Button asChild size="sm">
                <a href={detail.pdfUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" />
                  PDF bản gốc
                </a>
              </Button>
            )}
            <Button asChild size="sm" variant="outline">
              <Link href={detail.fullTextHref} target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                Xem toàn văn
              </Link>
            </Button>
            {canManage && detail.editable && (
              <Button asChild size="sm" variant="ghost">
                <Link href={`/dashboard/repository/${detail.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Sửa
                </Link>
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Separator />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-4 w-32" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-14" />
      </div>
    </div>
  )
}
