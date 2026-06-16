'use client'

/**
 * Trình đọc toàn văn bài báo trong kho số NTQS.
 *
 * Đây là "island" tương tác của trang đọc — toàn bộ nội dung học thuật do
 * Server Component truyền vào dưới dạng props (chuỗi/mảng thuần), nên HTML vẫn
 * render phía server (tốt cho SEO). Component chỉ quản lý UI state đọc:
 * tiến trình cuộn, cỡ chữ, chế độ đọc (Sáng/Giấy ngà/Tối), sticky header,
 * sao chép trích dẫn, chia sẻ, in. Không chứa business logic.
 *
 * Bố cục desktop (≥lg): 3 vùng — rail trái (bìa/thông tin/hành động/cài đặt),
 * cột đọc ở giữa (giữ độ rộng đọc tối ưu), rail phải (điều hướng trong số).
 * Dưới lg gập về một cột theo thứ tự đọc: tiêu đề → đọc → hành động → điều hướng.
 */

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  ArrowLeft, BookOpen, BookOpenCheck, Check, ChevronLeft, ChevronRight, ChevronUp,
  Clock, Copy, Download, FileText, Hash, Layers, Moon, Printer, Quote, Settings2,
  Share2, Sun, Type, Users,
} from 'lucide-react'
import type {
  IssueReadingNavigation,
  JournalArticleNavItem,
  PublicJournalArticle,
  PublicJournalArticleAuthor,
} from '@/lib/services/journal-article-reader.service'

type FontScale = 'normal' | 'large' | 'xlarge'
type ReadingTheme = 'light' | 'sepia' | 'dark'

interface ReaderPrefs {
  fontScale: FontScale
  readingTheme: ReadingTheme
}

const PREFS_STORAGE_KEY = 'ntqs:reader-prefs'

const DEFAULT_PREFS: ReaderPrefs = { fontScale: 'normal', readingTheme: 'light' }

/** Cỡ chữ thân bài (px) theo từng mức. */
const FONT_SIZE_PX: Record<FontScale, number> = { normal: 18, large: 20, xlarge: 23 }

/** Style chung cho nút chọn trong popover/rail — viền + trạng thái chọn màu NTQS. */
const TOGGLE_ITEM =
  'border border-border data-[state=on]:border-brand/40 data-[state=on]:bg-brand/10 data-[state=on]:text-brand dark:data-[state=on]:text-gold'

/** Bảng màu cho khung đọc theo từng chế độ — áp trực tiếp qua inline style. */
const PANEL_THEME: Record<
  ReadingTheme,
  { bg: string; fg: string; border: string; muted: string; accent: string; rule: string }
> = {
  light: {
    bg: '#ffffff',
    fg: 'hsl(222 30% 13%)',
    border: 'hsl(220 13% 90%)',
    muted: 'hsl(222 12% 42%)',
    accent: 'hsl(133 31% 20%)', // xanh quân sự NTQS
    rule: 'hsl(220 13% 90%)',
  },
  sepia: {
    bg: '#f7f1e1',
    fg: '#42392a',
    border: '#e7dcc3',
    muted: '#7a6f59',
    accent: '#8a5a17',
    rule: '#e1d4b6',
  },
  dark: {
    bg: '#1d1f22',
    fg: '#dadace',
    border: '#2e3236',
    muted: '#9aa0a6',
    accent: 'hsl(45 70% 66%)', // vàng đồng NTQS
    rule: '#2e3236',
  },
}

/** Tiền tố học hàm/học vị/quân hàm trước tên tác giả: "Đại tá, TS." */
function formatAuthorPrefix(author: PublicJournalArticleAuthor): string {
  return [author.militaryRank, author.academicTitle, author.degree]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(', ')
}

interface ArticleReaderViewProps {
  article: PublicJournalArticle
  navigation: IssueReadingNavigation
  issueHref: string
  coverImageUrl: string | null
  issuePdfUrl: string | null
  libraryHref: string | null
}

export function ArticleReaderView({
  article,
  navigation,
  issueHref,
  coverImageUrl,
  issuePdfUrl,
  libraryHref,
}: ArticleReaderViewProps) {
  const [prefs, setPrefs] = useState<ReaderPrefs>(DEFAULT_PREFS)
  const [progress, setProgress] = useState(0)
  const [showStickyBar, setShowStickyBar] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [citationCopied, setCitationCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const articleRef = useRef<HTMLElement>(null)

  // Khôi phục tuỳ chọn đọc đã lưu (chạy sau mount để tránh lệch hydrate).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as Partial<ReaderPrefs>
      setPrefs((prev) => ({
        fontScale: parsed.fontScale ?? prev.fontScale,
        readingTheme: parsed.readingTheme ?? prev.readingTheme,
      }))
    } catch {
      // localStorage không khả dụng hoặc dữ liệu hỏng — giữ mặc định.
    }
  }, [])

  const updatePrefs = useCallback((patch: Partial<ReaderPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch }
      try {
        localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(next))
      } catch {
        // Bỏ qua nếu không ghi được — không chặn trải nghiệm đọc.
      }
      return next
    })
  }, [])

  // Tiến trình đọc + hiển thị sticky bar / nút lên đầu trang, throttle bằng rAF.
  useEffect(() => {
    let frame = 0
    const handleScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const el = articleRef.current
        if (el) {
          const start = el.offsetTop
          const end = el.offsetTop + el.offsetHeight - window.innerHeight
          const span = end - start
          const pct = span > 0 ? ((window.scrollY - start) / span) * 100 : 0
          setProgress(Math.min(100, Math.max(0, pct)))
        }
        setShowStickyBar(window.scrollY > 380)
        setShowScrollTop(window.scrollY > 760)
      })
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  const copyCitation = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(article.citation)
      setCitationCopied(true)
      setTimeout(() => setCitationCopied(false), 2000)
    } catch {
      // Trình duyệt chặn clipboard — bỏ qua im lặng, người dùng vẫn copy tay được.
    }
  }, [article.citation])

  const shareArticle = useCallback(async () => {
    const url = window.location.href
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: article.title, url })
      } catch {
        // Người dùng huỷ chia sẻ — không làm gì.
      }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      // Bỏ qua nếu clipboard bị chặn.
    }
  }, [article.title])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const theme = PANEL_THEME[prefs.readingTheme]
  const panelStyle: CSSProperties = {
    backgroundColor: theme.bg,
    color: theme.fg,
    borderColor: theme.border,
    fontSize: FONT_SIZE_PX[prefs.fontScale],
    lineHeight: 1.85,
  }

  const railStickyClass = 'lg:sticky lg:top-16 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto lg:pr-1'

  return (
    <div>
      {/* Thanh tiến trình đọc cố định trên đỉnh trang */}
      <div className="fixed inset-x-0 top-0 z-[60] h-1 print:hidden" aria-hidden="true">
        <div
          className="h-full bg-gradient-to-r from-brand via-brand to-gold transition-[width] duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Sticky mini-header xuất hiện khi cuộn qua phần đầu */}
      <div
        className={cn(
          'fixed inset-x-0 top-0 z-50 border-b border-border bg-background/95 backdrop-blur transition-all duration-300 print:hidden',
          showStickyBar ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-full opacity-0',
        )}
      >
        <div className="mx-auto flex h-12 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link
            href={issueHref}
            className="flex shrink-0 items-center text-muted-foreground transition-colors hover:text-foreground"
            aria-label={`Quay lại ${article.issueLabel}`}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <p className="min-w-0 flex-1 truncate font-serif text-sm font-semibold text-foreground">
            {article.title}
          </p>
          <ReaderSettingsPopover prefs={prefs} onChange={updatePrefs} compact />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={shareArticle}
            aria-label="Chia sẻ bài viết"
          >
            {linkCopied ? <Check className="h-4 w-4 text-brand" /> : <Share2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl py-8">
        {/* Quay lại số báo */}
        <Button asChild variant="ghost" className="-ml-2 mb-6 text-muted-foreground hover:text-foreground">
          <Link href={issueHref}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {article.issueLabel}
          </Link>
        </Button>

        <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[14rem_minmax(0,1fr)_14rem] lg:items-start lg:gap-8">
          {/* ── RAIL TRÁI — chỉ desktop ──────────────────────────────── */}
          <aside
            className={cn(
              'order-3 hidden flex-col gap-5 lg:order-none lg:col-start-1 lg:row-start-1 lg:flex',
              railStickyClass,
            )}
          >
            {coverImageUrl && (
              <Link href={issueHref} className="group block" aria-label={`Xem ${article.issueLabel}`}>
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-border shadow-md ring-1 ring-black/5 transition-transform group-hover:-translate-y-0.5">
                  <Image
                    src={coverImageUrl}
                    alt={`Bìa ${article.issueLabel}`}
                    fill
                    sizes="224px"
                    className="object-cover"
                  />
                </div>
              </Link>
            )}

            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <ArticleMeta article={article} issueHref={issueHref} className="flex-col !items-stretch gap-2" stacked />
              <div className="mt-4 border-t border-border pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tác giả</p>
                <AuthorList authors={article.authors} authorsText={article.authorsText} />
              </div>
            </div>

            <ArticleActions
              article={article}
              libraryHref={libraryHref}
              issuePdfUrl={issuePdfUrl}
              onShare={shareArticle}
              linkCopied={linkCopied}
              vertical
            />

            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Settings2 className="h-3.5 w-3.5" />
                Tuỳ chọn đọc
              </p>
              <ReaderSettingsControls prefs={prefs} onChange={updatePrefs} />
            </div>
          </aside>

          {/* ── CỘT GIỮA — nội dung đọc ──────────────────────────────── */}
          <article ref={articleRef} className="order-1 min-w-0 lg:order-none lg:col-start-2 lg:row-start-1">
            {/* Header bài báo */}
            <header className="mb-8">
              {article.sectionName && (
                <div className="mb-3 inline-flex items-center gap-2">
                  <span className="h-px w-6 bg-gold" />
                  <span className="text-xs font-bold uppercase tracking-[0.15em] text-brand dark:text-gold">
                    {article.sectionName}
                  </span>
                </div>
              )}

              <h1 className="font-serif text-[1.7rem] font-bold leading-[1.2] text-foreground md:text-4xl md:leading-[1.15]">
                {article.title}
              </h1>

              {/* Bìa + tác giả + metadata — chỉ hiển thị dưới lg (desktop dùng rail trái) */}
              <div className="lg:hidden">
                <div className="mt-5 flex gap-4">
                  {coverImageUrl && (
                    <Link href={issueHref} className="shrink-0" aria-label={`Xem ${article.issueLabel}`}>
                      <div className="relative h-32 w-24 overflow-hidden rounded-md border border-border shadow-sm">
                        <Image src={coverImageUrl} alt={`Bìa ${article.issueLabel}`} fill sizes="96px" className="object-cover" />
                      </div>
                    </Link>
                  )}
                  <div className="min-w-0">
                    <AuthorList authors={article.authors} authorsText={article.authorsText} />
                  </div>
                </div>
                <div className="mt-5">
                  <ArticleMeta article={article} issueHref={issueHref} />
                </div>
              </div>

              <div className="mt-6 h-px w-full bg-gradient-to-r from-gold/60 via-border to-transparent" />
            </header>

            {/* Tóm tắt */}
            {article.abstract && (
              <section className="mb-8 overflow-hidden rounded-xl border border-border bg-muted/30">
                <div className="border-l-[3px] border-l-gold px-5 py-5 sm:px-7 sm:py-6">
                  <div className="mb-3 flex items-center gap-2">
                    <Quote className="h-4 w-4 text-gold" />
                    <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-foreground">Tóm tắt</h2>
                  </div>
                  <p className="whitespace-pre-line text-justify text-[0.95rem] leading-relaxed text-foreground/90">
                    {article.abstract}
                  </p>

                  {article.keywords.length > 0 && (
                    <div className="mt-5 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <Hash className="h-3 w-3" />
                        Từ khóa
                      </span>
                      {article.keywords.map((kw) => (
                        <Badge key={kw} variant="outline" className="border-border font-normal">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Khung đọc toàn văn (áp chế độ đọc + cỡ chữ) */}
            <div
              className="rounded-2xl border px-5 py-8 font-serif shadow-sm transition-colors sm:px-9 sm:py-11"
              style={panelStyle}
            >
              {article.hasFullText ? (
                <>
                  {article.paragraphs.map((paragraph, i) => {
                    if (i === 0) {
                      const firstChar = paragraph.charAt(0)
                      const canDropCap = /\p{L}/u.test(firstChar)
                      return (
                        <p key={i} className="mb-5 text-justify last:mb-0">
                          {canDropCap ? (
                            <>
                              <span
                                className="float-left mr-2.5 mt-1 font-serif text-[3.4em] font-bold leading-[0.72]"
                                style={{ color: theme.accent }}
                              >
                                {firstChar}
                              </span>
                              {paragraph.slice(1)}
                            </>
                          ) : (
                            paragraph
                          )}
                        </p>
                      )
                    }
                    return (
                      <p key={i} className="mb-5 text-justify last:mb-0">
                        {paragraph}
                      </p>
                    )
                  })}

                  {article.references.length > 0 && (
                    <section className="mt-10">
                      <div className="mb-4 h-px w-full" style={{ backgroundColor: theme.rule }} aria-hidden="true" />
                      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide" style={{ color: theme.accent }}>
                        Tài liệu tham khảo
                      </h2>
                      <ol className="list-none space-y-2 pl-0 text-[0.82em] leading-relaxed" style={{ color: theme.muted }}>
                        {article.references.map((ref, i) => (
                          <li key={i}>{ref}</li>
                        ))}
                      </ol>
                    </section>
                  )}
                </>
              ) : (
                <div className="py-8 text-center">
                  <BookOpen className="mx-auto mb-3 h-8 w-8 opacity-40" style={{ color: theme.muted }} />
                  <p className="text-base" style={{ color: theme.muted }}>
                    Bài báo này chưa có bản số hóa toàn văn.
                  </p>
                  {libraryHref && (
                    <p className="mt-2 text-sm" style={{ color: theme.muted }}>
                      Bạn có thể{' '}
                      <Link href={libraryHref} className="font-medium underline" style={{ color: theme.accent }}>
                        đọc toàn bộ số trong Thư viện số
                      </Link>
                      .
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Trích dẫn */}
            <section className="mt-8 rounded-xl border border-border bg-muted/30 p-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-foreground">
                  <Quote className="h-3.5 w-3.5 text-gold" />
                  Trích dẫn bài viết
                </h2>
                <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2 text-xs" onClick={copyCitation}>
                  {citationCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-brand" /> Đã sao chép
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Sao chép
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{article.citation}</p>
            </section>

            {/* Hành động — chỉ dưới lg (desktop dùng rail trái) */}
            <div className="mt-8 lg:hidden">
              <ArticleActions
                article={article}
                libraryHref={libraryHref}
                issuePdfUrl={issuePdfUrl}
                onShare={shareArticle}
                linkCopied={linkCopied}
              />
            </div>
          </article>

          {/* ── RAIL PHẢI — điều hướng trong số ───────────────────────── */}
          <aside className={cn('order-2 lg:order-none lg:col-start-3 lg:row-start-1', railStickyClass)}>
            <IssueNavigation navigation={navigation} issueHref={issueHref} />
          </aside>
        </div>
      </div>

      {/* ── Tiện ích nổi (lên đầu trang + cài đặt đọc cho mobile) ───── */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2.5 print:hidden">
        {showScrollTop && (
          <Button
            size="icon"
            variant="outline"
            className="h-11 w-11 rounded-full bg-background/90 shadow-lg backdrop-blur"
            onClick={scrollToTop}
            aria-label="Lên đầu trang"
          >
            <ChevronUp className="h-5 w-5" />
          </Button>
        )}
        <div className="lg:hidden">
          <ReaderSettingsPopover prefs={prefs} onChange={updatePrefs} floating />
        </div>
      </div>
    </div>
  )
}

/** Dải/khối metadata: số báo (liên kết), trang, thời gian đọc. */
function ArticleMeta({
  article,
  issueHref,
  className,
  stacked = false,
}: {
  article: PublicJournalArticle
  issueHref: string
  className?: string
  stacked?: boolean
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2.5', className)}>
      <MetaChip icon={<FileText className="h-3.5 w-3.5" />} href={issueHref} block={stacked}>
        {article.issueLabel}
      </MetaChip>
      <MetaChip icon={<Layers className="h-3.5 w-3.5" />} block={stacked}>
        Trang {article.pageRange}
      </MetaChip>
      {article.hasFullText && (
        <MetaChip icon={<Clock className="h-3.5 w-3.5" />} block={stacked}>
          {article.readingMinutes} phút đọc
        </MetaChip>
      )}
    </div>
  )
}

/** Chip metadata nhỏ; nếu có href thì là liên kết. `block` để xếp dọc trong rail. */
function MetaChip({
  icon,
  href,
  block = false,
  children,
}: {
  icon: React.ReactNode
  href?: string
  block?: boolean
  children: React.ReactNode
}) {
  const className = cn(
    'inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground transition-colors',
    block && 'w-full justify-start',
  )
  if (href) {
    return (
      <Link href={href} className={cn(className, 'hover:border-brand/40 hover:text-brand dark:hover:text-gold')}>
        {icon}
        {children}
      </Link>
    )
  }
  return (
    <span className={className}>
      {icon}
      {children}
    </span>
  )
}

/** Danh sách tác giả có cấu trúc (quân hàm/học hàm/học vị/đơn vị). */
function AuthorList({
  authors,
  authorsText,
}: {
  authors: PublicJournalArticleAuthor[]
  authorsText: string
}) {
  if (authors.length > 0) {
    return (
      <div className="space-y-1.5">
        {authors.map((author, i) => {
          const prefix = formatAuthorPrefix(author)
          return (
            <div key={i} className="text-[0.9rem] leading-relaxed">
              <span className="font-semibold text-foreground">
                {prefix && <span className="font-normal text-muted-foreground">{prefix} </span>}
                {author.name}
              </span>
              {author.organization && <span className="block text-xs text-muted-foreground">{author.organization}</span>}
            </div>
          )
        })}
      </div>
    )
  }
  if (authorsText) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4 shrink-0" />
        {authorsText}
      </p>
    )
  }
  return null
}

/** Nhóm nút hành động: tải PDF, đọc toàn số, chia sẻ, in. */
function ArticleActions({
  article,
  libraryHref,
  issuePdfUrl,
  onShare,
  linkCopied,
  vertical = false,
}: {
  article: PublicJournalArticle
  libraryHref: string | null
  issuePdfUrl: string | null
  onShare: () => void
  linkCopied: boolean
  vertical?: boolean
}) {
  const btn = vertical ? 'w-full justify-start' : ''
  return (
    <div className={cn('print:hidden', vertical ? 'flex flex-col gap-2' : 'flex flex-wrap gap-3')}>
      {/* PDF bản gốc — đường dẫn /data/... phục vụ trực tiếp, không qua getFileUrl */}
      {article.articlePdfUrl && (
        <Button asChild className={cn('bg-brand text-brand-foreground hover:bg-brand/90', btn)}>
          <a href={article.articlePdfUrl} target="_blank" rel="noopener noreferrer">
            <Download className="mr-2 h-4 w-4" />
            Tải PDF bài báo gốc
          </a>
        </Button>
      )}
      {libraryHref && (
        <Button asChild variant="outline" className={btn}>
          <Link href={libraryHref}>
            <BookOpenCheck className="mr-2 h-4 w-4" />
            Đọc toàn bộ số
          </Link>
        </Button>
      )}
      {issuePdfUrl && (
        <Button asChild variant="outline" className={btn}>
          <a href={issuePdfUrl} download>
            <Download className="mr-2 h-4 w-4" />
            Tải PDF số
          </a>
        </Button>
      )}
      <Button variant="outline" className={btn} onClick={onShare}>
        {linkCopied ? (
          <>
            <Check className="mr-2 h-4 w-4 text-brand" /> Đã sao chép liên kết
          </>
        ) : (
          <>
            <Share2 className="mr-2 h-4 w-4" /> Chia sẻ
          </>
        )}
      </Button>
      <Button variant="outline" className={btn} onClick={() => window.print()}>
        <Printer className="mr-2 h-4 w-4" />
        In bài
      </Button>
    </div>
  )
}

/** Hai nhóm điều khiển đọc: cỡ chữ + chế độ đọc. Dùng chung popover lẫn rail. */
function ReaderSettingsControls({
  prefs,
  onChange,
}: {
  prefs: ReaderPrefs
  onChange: (patch: Partial<ReaderPrefs>) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cỡ chữ</p>
        <ToggleGroup
          type="single"
          value={prefs.fontScale}
          onValueChange={(value) => value && onChange({ fontScale: value as FontScale })}
          className="grid grid-cols-3 gap-1"
        >
          <ToggleGroupItem value="normal" aria-label="Cỡ chữ vừa" className={cn(TOGGLE_ITEM, 'h-10 text-sm')}>
            A
          </ToggleGroupItem>
          <ToggleGroupItem value="large" aria-label="Cỡ chữ lớn" className={cn(TOGGLE_ITEM, 'h-10 text-base')}>
            A
          </ToggleGroupItem>
          <ToggleGroupItem value="xlarge" aria-label="Cỡ chữ rất lớn" className={cn(TOGGLE_ITEM, 'h-10 text-lg')}>
            A
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Chế độ đọc</p>
        <ToggleGroup
          type="single"
          value={prefs.readingTheme}
          onValueChange={(value) => value && onChange({ readingTheme: value as ReadingTheme })}
          className="grid grid-cols-3 gap-1"
        >
          <ToggleGroupItem value="light" aria-label="Nền sáng" className={cn(TOGGLE_ITEM, 'h-auto flex-col gap-1 py-2 text-[11px]')}>
            <Sun className="h-4 w-4" />
            Sáng
          </ToggleGroupItem>
          <ToggleGroupItem value="sepia" aria-label="Nền giấy ngà" className={cn(TOGGLE_ITEM, 'h-auto flex-col gap-1 py-2 text-[11px]')}>
            <BookOpen className="h-4 w-4" />
            Giấy ngà
          </ToggleGroupItem>
          <ToggleGroupItem value="dark" aria-label="Nền tối" className={cn(TOGGLE_ITEM, 'h-auto flex-col gap-1 py-2 text-[11px]')}>
            <Moon className="h-4 w-4" />
            Tối
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  )
}

/** Popover cài đặt đọc cho sticky bar (compact) và nút nổi mobile (floating). */
function ReaderSettingsPopover({
  prefs,
  onChange,
  compact = false,
  floating = false,
}: {
  prefs: ReaderPrefs
  onChange: (patch: Partial<ReaderPrefs>) => void
  compact?: boolean
  floating?: boolean
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {floating ? (
          <Button
            size="icon"
            className="h-12 w-12 rounded-full bg-brand text-brand-foreground shadow-lg hover:bg-brand/90"
            aria-label="Tuỳ chọn đọc"
          >
            <Settings2 className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className={cn('shrink-0', compact ? 'h-8 w-8' : 'h-9 w-9')}
            aria-label="Tuỳ chọn đọc"
          >
            <Type className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64">
        <ReaderSettingsControls prefs={prefs} onChange={onChange} />
      </PopoverContent>
    </Popover>
  )
}

/** Điều hướng bài trước/sau + danh sách các bài còn lại trong số (rail phải/mobile). */
function IssueNavigation({
  navigation,
  issueHref,
}: {
  navigation: IssueReadingNavigation
  issueHref: string
}) {
  const { prev, next, siblings } = navigation
  if (!prev && !next && siblings.length === 0) return null

  return (
    <nav className="space-y-5 print:hidden" aria-label="Điều hướng trong số">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-foreground">Trong số này</h2>
        <Link href={issueHref} className="text-xs font-medium text-brand hover:underline dark:text-gold">
          Xem cả số
        </Link>
      </div>

      {(prev || next) && (
        <div className="space-y-2">
          {prev && <NavPager item={prev} direction="prev" />}
          {next && <NavPager item={next} direction="next" />}
        </div>
      )}

      {siblings.length > 0 && (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          {siblings.map((item) => (
            <li key={item.id}>
              <Link
                href={`/journal-articles/${item.id}`}
                className="flex items-start gap-2.5 px-3 py-2.5 transition-colors hover:bg-muted/50"
              >
                <span className="mt-0.5 w-9 shrink-0 text-[11px] font-semibold tabular-nums text-muted-foreground">
                  tr.{item.pageStart}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 font-serif text-[0.8rem] font-medium leading-snug text-foreground">
                    {item.title}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </nav>
  )
}

/** Thẻ điều hướng bài trước / bài sau (xếp dọc trong rail). */
function NavPager({ item, direction }: { item: JournalArticleNavItem; direction: 'prev' | 'next' }) {
  const isPrev = direction === 'prev'
  return (
    <Link
      href={`/journal-articles/${item.id}`}
      className="group flex flex-col gap-1 rounded-lg border border-border p-3 transition-colors hover:border-brand/40 hover:bg-muted/40"
    >
      <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {isPrev ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        {isPrev ? 'Bài trước' : 'Bài sau'}
      </span>
      <span className="line-clamp-2 font-serif text-[0.85rem] font-medium leading-snug text-foreground transition-colors group-hover:text-brand dark:group-hover:text-gold">
        {item.title}
      </span>
    </Link>
  )
}
