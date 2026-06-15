'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, BookOpen, BookOpenText, Users } from 'lucide-react'

export interface TocAuthor {
  id: string
  name: string
  militaryRank?: string | null
  academicTitle?: string | null
  degree?: string | null
  order: number
}

export interface TocArticle {
  id: string
  title: string
  slug: string
  authorsText: string
  pageStart: number
  pageEnd?: number | null
  articlePdfUrl?: string | null
  authors: TocAuthor[]
}

export interface TocSection {
  id: string
  name: string
  slug: string
  order: number
  journalArticles: TocArticle[]
}

interface IssueTocClientProps {
  sections: TocSection[]
  pdfUrl?: string | null
  totalArticles: number
}

const ALL_SECTIONS = '__all__'

export function IssueTocClient({ sections, pdfUrl, totalArticles }: IssueTocClientProps) {
  const [activeSection, setActiveSection] = useState<string>(ALL_SECTIONS)

  const visibleSections =
    activeSection === ALL_SECTIONS
      ? sections
      : sections.filter((s) => s.id === activeSection)

  const visibleCount = visibleSections.reduce((sum, s) => sum + s.journalArticles.length, 0)

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground opacity-40 mb-3" />
        <p className="text-base font-medium text-muted-foreground">Chưa có mục lục</p>
        <p className="text-sm text-muted-foreground mt-1">
          Số báo này chưa được số hóa mục lục.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Section filter */}
      <div className="flex flex-wrap gap-2 pb-2 border-b">
        <button
          onClick={() => setActiveSection(ALL_SECTIONS)}
          className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
            activeSection === ALL_SECTIONS
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background text-muted-foreground border-border hover:border-primary hover:text-primary'
          }`}
        >
          Tất cả ({totalArticles})
        </button>
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              activeSection === s.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:border-primary hover:text-primary'
            }`}
          >
            {s.name} ({s.journalArticles.length})
          </button>
        ))}
      </div>

      {/* Articles */}
      <p className="text-xs text-muted-foreground">
        Hiển thị {visibleCount} bài
      </p>

      <div className="space-y-0">
        {visibleSections.map((section) => (
          <div key={section.id}>
            {/* Section header — only shown when showing all */}
            {activeSection === ALL_SECTIONS && (
              <div className="py-2 px-3 bg-muted/50 rounded-md mb-1 mt-3 first:mt-0">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {section.name}
                </span>
              </div>
            )}

            {section.journalArticles.map((article) => (
              <ArticleRow key={article.id} article={article} pdfUrl={pdfUrl} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function ArticleRow({ article, pdfUrl }: { article: TocArticle; pdfUrl?: string | null }) {
  const articleHref = `/journal-articles/${article.id}`
  // Ưu tiên PDF bản gốc của từng bài; nếu chưa số hóa thì mở PDF cả số tại đúng trang.
  const pdfHref = article.articlePdfUrl ?? (pdfUrl ? `${pdfUrl}#page=${article.pageStart}` : null)

  return (
    <div className="flex gap-3 py-3 border-b last:border-b-0 group hover:bg-muted/30 px-1 rounded transition-colors">
      {/* Page badge */}
      <div className="flex-shrink-0 mt-0.5">
        <span className="inline-flex items-center justify-center w-14 h-6 text-xs font-mono font-medium rounded bg-muted text-muted-foreground border">
          Tr.&nbsp;{article.pageStart}
        </span>
      </div>

      {/* Content — bấm tiêu đề để đọc toàn văn bài báo */}
      <Link href={articleHref} className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-semibold leading-snug text-foreground line-clamp-3 group-hover:text-primary transition-colors">
          {article.title}
        </p>
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-2">{article.authorsText}</span>
        </div>
      </Link>

      {/* Actions */}
      <div className="flex-shrink-0 flex items-start gap-1 pt-0.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          asChild
        >
          <Link href={articleHref}>
            <BookOpenText className="h-3 w-3 mr-1" />
            Đọc
          </Link>
        </Button>
        {pdfHref && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            asChild
          >
            <a href={pdfHref} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" />
              PDF
            </a>
          </Button>
        )}
      </div>
    </div>
  )
}
