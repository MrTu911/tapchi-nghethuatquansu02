import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { BookOpen } from 'lucide-react'
import { LibraryClickInterceptor } from '@/components/library/LibraryClickInterceptor'
import { listLibraryIssues } from '@/lib/library/list-issues'

export const metadata: Metadata = {
  title: 'Thư viện Ebook | Tạp chí Nghệ thuật Quân sự Việt Nam',
  description: 'Đọc tạp chí dưới dạng ebook tương tác (EPUB)',
}

export const dynamic = 'force-dynamic'

export default async function LibraryPage() {
  const issues = await listLibraryIssues()

  const issuesByYear = issues.reduce((acc, iss) => {
    if (!acc[iss.year]) acc[iss.year] = []
    acc[iss.year].push(iss)
    return acc
  }, {} as Record<number, typeof issues>)

  const years = Object.keys(issuesByYear).map(Number).sort((a, b) => b - a)

  return (
    <div className="min-h-screen" style={{
      background: 'radial-gradient(circle at 10% 10%, #F8F3E9 0%, transparent 60%), radial-gradient(circle at 90% 10%, #E8DFCC 0%, transparent 60%), radial-gradient(circle at 90% 90%, #DFD3BA 0%, transparent 60%), radial-gradient(circle at 10% 90%, #EAE0CC 0%, transparent 60%), #DCCFB0',
    }}>
      <div className="max-w-[1280px] mx-auto px-0 sm:px-0 py-12">
        <div className="mb-16 text-center">
          <h1 className="text-4xl font-bold mb-3" style={{ color: '#7A2E2E' }}>Thư viện Số</h1>
          <p className="text-lg text-amber-900/70">
            Khám phá {issues.length} số tạp chí
          </p>
        </div>

        {issues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white/20 backdrop-blur-md rounded-2xl border border-white/40 shadow-xl">
            <BookOpen className="h-16 w-16 text-amber-900/30 mb-4" />
            <p className="text-lg font-medium mb-2 text-amber-900">Chưa có số nào được số hóa</p>
          </div>
        ) : (
          <div className="space-y-24">
            {years.map(year => {
              const yearIssues = issuesByYear[year]
              const rows: (typeof issues)[] = []
              for (let i = 0; i < yearIssues.length; i += 5) {
                rows.push(yearIssues.slice(i, i + 5))
              }

              return (
                <div key={year} className="relative space-y-16">
                  {/* Year Badge */}
                  <div className="absolute -top-10 left-4 z-20">
                    <span className="px-4 py-1.5 rounded-full bg-[#7A2E2E] text-white text-sm font-bold shadow-md">
                      NĂM {year}
                    </span>
                  </div>

                  {rows.map((rowBooks, rowIdx) => (
                    <div key={rowIdx} className="relative">
                      {/* Books Container */}
                      <div className="relative pt-4 pb-0 z-10 px-8 flex gap-8 items-end">
                        {rowBooks.map(iss => (
                          <Link
                            key={iss.slug}
                            href={`/library/${iss.slug}`}
                            className="group block relative"
                            style={{ perspective: '1000px' }}
                          >
                            {/* Book Cover */}
                            <div
                              className="relative w-40 h-56 transition-all duration-300 ease-out origin-bottom group-hover:-translate-y-4 group-hover:rotate-y-[-5deg] book-cover-element"
                              style={{
                                transformStyle: 'preserve-3d',
                                boxShadow: '-4px 0 10px rgba(0,0,0,0.1), 10px 20px 20px rgba(0,0,0,0.15)',
                                borderRadius: '2px 6px 6px 2px',
                              }}
                            >
                              {/* Book Spine (Gáy sách) */}
                              <div
                                className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-amber-900/60 to-amber-900/20 transform -translate-x-full origin-right rotate-y-[90deg]"
                                style={{ borderRadius: '2px 0 0 2px' }}
                              />
                              {/* Front Cover */}
                              <div className="absolute inset-0 bg-muted overflow-hidden" style={{ borderRadius: '2px 6px 6px 2px' }}>
                                <Image
                                  src={iss.coverUrl}
                                  alt={`Bìa ${iss.issue}`}
                                  fill
                                  className="object-cover"
                                  sizes="160px"
                                />
                                {/* Glass reflection on cover */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/30 pointer-events-none" />
                                <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-r from-white/40 to-transparent pointer-events-none" />
                              </div>
                            </div>

                            {/* Tooltip on hover */}
                            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-max max-w-[200px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                              <div className="bg-white/90 backdrop-blur-sm text-amber-950 text-xs px-3 py-2 rounded-md shadow-lg border border-white/50 text-center">
                                <p className="font-bold truncate">{iss.title}</p>
                                <p className="text-[10px]">{iss.issue}</p>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>

                      {/* Glass Shelf */}
                      <div
                        className="absolute bottom-[-16px] left-0 right-0 h-4 rounded-b-xl z-0"
                        style={{
                          background: 'rgba(255, 255, 255, 0.4)',
                          backdropFilter: 'blur(24px) saturate(150%)',
                          WebkitBackdropFilter: 'blur(24px) saturate(150%)',
                          borderTop: '1px solid rgba(255, 255, 255, 0.6)',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                        }}
                      />
                      <div className="absolute bottom-[-24px] left-4 right-4 h-2 bg-black/5 blur-sm z-0" />
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        )}
      </div>
      <LibraryClickInterceptor />
    </div>
  )
}
