import Image from 'next/image'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// Số tạp chí đã gộp từ DB (Issue PUBLISHED) và Thư viện (corpus.json), khóa theo slug.
export interface MergedArchiveIssue {
  key: string
  name: string
  year: number
  coverUrl: string | null
  articleCount: number
  libraryUrl: string | null // /library/<slug> — mở KindleReader (nếu đã số hóa)
  viewerUrl: string | null // /issues/<id>/viewer — PDF Flipbook (nếu có trong DB)
  tocUrl: string | null // /issues/<id> — mục lục (nếu có trong DB)
}

interface IssueBookshelfProps {
  issuesByYear: Record<string, MergedArchiveIssue[]>
  years: string[]
}

const ACTION_PRIMARY =
  'inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold bg-[#8B1A1A] text-white hover:bg-[#6B1313] transition-colors'
const ACTION_OUTLINE =
  'inline-flex items-center rounded border border-[#8B1A1A]/30 px-2 py-0.5 text-[11px] font-medium text-[#8B1A1A] dark:text-[#C8960C] dark:border-[#C8960C]/40 hover:bg-[#8B1A1A]/5 transition-colors'

function BookCover({ issue }: { issue: MergedArchiveIssue }) {
  const primaryUrl = issue.libraryUrl ?? issue.viewerUrl ?? issue.tocUrl ?? '#'

  return (
    <div className="group relative shrink-0" style={{ perspective: '1000px' }}>
      <Link href={primaryUrl} className="block" aria-label={`Mở ${issue.name}`}>
        <div
          className="book-cover-element relative h-44 w-32 origin-bottom transition-all duration-300 ease-out group-hover:-translate-y-3 sm:h-56 sm:w-40"
          style={{
            transformStyle: 'preserve-3d',
            boxShadow: '-4px 0 10px rgba(0,0,0,0.1), 10px 20px 20px rgba(0,0,0,0.15)',
            borderRadius: '2px 6px 6px 2px',
          }}
        >
          {/* Gáy sách */}
          <div
            className="absolute inset-y-0 left-0 w-2.5 -translate-x-full origin-right bg-gradient-to-r from-black/50 to-black/10"
            style={{ borderRadius: '2px 0 0 2px' }}
          />
          {/* Bìa trước */}
          <div className="absolute inset-0 overflow-hidden bg-muted" style={{ borderRadius: '2px 6px 6px 2px' }}>
            {issue.coverUrl ? (
              <Image src={issue.coverUrl} alt={`Bìa ${issue.name}`} fill className="object-cover" sizes="160px" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#8B1A1A]/15 to-[#6B1313]/25">
                <BookOpen className="h-10 w-10 text-[#8B1A1A]/40 dark:text-[#C8960C]/50" />
              </div>
            )}
            {/* Phản chiếu kính */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/30" />
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-r from-white/40 to-transparent" />
            {/* Nhãn "đã số hóa" */}
            {issue.libraryUrl && (
              <span className="absolute right-1.5 top-1.5 rounded bg-[#C8960C] px-1.5 py-0.5 text-[9px] font-bold text-[#3a1208] shadow">
                Đã số hóa
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Bóng nền dưới chân sách (gợi mặt kệ) */}
      <div className="mx-auto mt-1 h-2 w-[85%] rounded-full bg-black/15 blur-sm" />

      {/* Tooltip hành động khi hover — là sibling, không lồng trong Link */}
      <div className="pointer-events-none absolute left-1/2 top-full z-30 mt-1 w-max max-w-[230px] -translate-x-1/2 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
        <div className="rounded-md border border-border bg-popover/95 px-3 py-2 text-center shadow-lg backdrop-blur">
          <p className="line-clamp-2 text-xs font-medium text-content">{issue.name}</p>
          <p className="mt-0.5 text-[10px] text-content-muted">{issue.articleCount} bài</p>
          <div className="mt-2 flex flex-wrap justify-center gap-1">
            {issue.libraryUrl && (
              <Link href={issue.libraryUrl} className={ACTION_PRIMARY}>
                Đọc
              </Link>
            )}
            {issue.viewerUrl && (
              <Link href={issue.viewerUrl} className={ACTION_OUTLINE}>
                PDF
              </Link>
            )}
            {issue.tocUrl && (
              <Link href={issue.tocUrl} className={ACTION_OUTLINE}>
                Mục lục
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function IssueBookshelf({ issuesByYear, years }: IssueBookshelfProps) {
  if (years.length === 0) {
    return (
      <div className="py-16 text-center">
        <BookOpen className="mx-auto mb-4 h-16 w-16 text-[#8B1A1A]/30 dark:text-[#C8960C]/40" />
        <h3 className="mb-2 font-serif text-xl font-semibold text-content">Chưa có số nào</h3>
        <p className="text-content-muted">Các số tạp chí sẽ được số hóa và cập nhật sớm nhất có thể.</p>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      {years.map((year) => {
        const yearIssues = issuesByYear[year] ?? []
        return (
          <section key={year} className="scroll-mt-24" id={`archive-year-${year}`}>
            <div className="mb-5 flex items-center gap-3">
              <span className="h-5 w-1 rounded bg-[#8B1A1A]" aria-hidden="true" />
              <h3 className="font-serif text-xl font-bold text-content">Năm {year}</h3>
              <Badge variant="secondary" className="text-xs">
                {yearIssues.length} số
              </Badge>
            </div>

            {/* Kệ: sách xếp cạnh nhau, có đường kẻ kệ kính phía dưới */}
            <div className="relative rounded-lg border border-border/60 bg-gradient-to-b from-muted/30 to-muted/60 px-5 py-6 dark:from-muted/10 dark:to-muted/20">
              <div className="flex flex-wrap items-end gap-x-7 gap-y-14">
                {yearIssues.map((issue) => (
                  <BookCover key={issue.key} issue={issue} />
                ))}
              </div>
            </div>
          </section>
        )
      })}
    </div>
  )
}
