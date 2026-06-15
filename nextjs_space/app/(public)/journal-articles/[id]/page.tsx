import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft, BookOpenCheck, Download, FileText, Hash, Quote, Users,
} from 'lucide-react'
import { getFileUrl } from '@/lib/local-storage'
import {
  getPublicJournalArticle,
  type PublicJournalArticle,
  type PublicJournalArticleAuthor,
} from '@/lib/services/journal-article-reader.service'

interface Props {
  params: { id: string }
}

export const revalidate = 300

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getPublicJournalArticle(params.id)
  if (!article) return { title: 'Không tìm thấy bài báo' }

  const description = article.abstract?.slice(0, 200) || article.authorsText
  return {
    title: `${article.title} | Tạp chí Nghệ thuật Quân sự Việt Nam`,
    description,
    openGraph: {
      title: article.title,
      description,
      type: 'article',
      images: article.issue.coverImage ? [getFileUrl(article.issue.coverImage, true)] : undefined,
    },
  }
}

/** Tiền tố học hàm/học vị/quân hàm trước tên tác giả: "Đại tá, TS." */
function formatAuthorPrefix(author: PublicJournalArticleAuthor): string {
  return [author.militaryRank, author.academicTitle, author.degree]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(', ')
}

export default async function JournalArticlePage({ params }: Props) {
  const article = await getPublicJournalArticle(params.id)
  if (!article) notFound()

  const issueHref = `/issues/${article.issue.slug ?? article.issue.id}`
  const issueLabel = article.issue.title ?? `Số ${article.issue.number} (${article.issue.year})`
  const pageRange =
    article.pageEnd && article.pageEnd !== article.pageStart
      ? `${article.pageStart}–${article.pageEnd}`
      : `${article.pageStart}`
  const issuePdfUrl = article.issue.pdfUrl ? getFileUrl(article.issue.pdfUrl, true) : null

  return (
    <div className="py-8 max-w-4xl mx-auto">
      {/* Back to issue */}
      <Button asChild variant="ghost" className="mb-6 -ml-2">
        <Link href={issueHref}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {issueLabel}
        </Link>
      </Button>

      <article>
        {/* Header */}
        <header className="mb-8">
          {article.sectionName && (
            <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-3">
              {article.sectionName}
            </p>
          )}

          <h1 className="text-2xl md:text-3xl font-bold leading-snug font-serif text-foreground">
            {article.title}
          </h1>

          {/* Authors */}
          {article.authors.length > 0 ? (
            <div className="mt-4 space-y-1">
              {article.authors.map((author, i) => {
                const prefix = formatAuthorPrefix(author)
                return (
                  <div key={i} className="text-sm">
                    <span className="font-medium text-foreground">
                      {prefix && <span className="font-normal text-muted-foreground">{prefix} </span>}
                      {author.name}
                    </span>
                    {author.organization && (
                      <span className="text-muted-foreground"> — {author.organization}</span>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            article.authorsText && (
              <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4 flex-shrink-0" />
                {article.authorsText}
              </p>
            )
          )}

          {/* Meta line */}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              {issueLabel}
            </span>
            <span>Trang {pageRange}</span>
          </div>
        </header>

        {/* Abstract */}
        {article.abstract && (
          <Card className="mb-8 bg-muted/40 border-l-4 border-l-primary">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-2 mb-2">
                <Quote className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Tóm tắt</h2>
              </div>
              <p className="text-sm leading-relaxed text-justify text-foreground/90 whitespace-pre-line">
                {article.abstract}
              </p>

              {article.keywords.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Hash className="h-3 w-3" />
                    Từ khóa
                  </span>
                  {article.keywords.map((kw) => (
                    <Badge key={kw} variant="outline" className="font-normal">
                      {kw}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Full text */}
        {article.hasFullText ? (
          <div className="space-y-5 text-[17px] leading-[1.9] text-justify text-foreground/90 font-serif">
            {article.paragraphs.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Bài báo này chưa có bản số hóa toàn văn.
              {article.issue.slug && (
                <>
                  {' '}Bạn có thể{' '}
                  <Link href={`/library/${article.issue.slug}`} className="text-primary hover:underline">
                    đọc toàn bộ số trong Thư viện số
                  </Link>
                  .
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* References */}
        {article.references.length > 0 && (
          <section className="mt-10">
            <h2 className="text-base font-semibold mb-3 text-foreground">Tài liệu tham khảo</h2>
            <ol className="space-y-1.5 list-none pl-0 text-sm leading-relaxed text-muted-foreground">
              {article.references.map((ref, i) => (
                <li key={i}>{ref}</li>
              ))}
            </ol>
          </section>
        )}

        <Separator className="my-8" />

        {/* Footer actions */}
        <div className="flex flex-wrap gap-3">
          {/* PDF bản gốc của bài — đường dẫn /data/... phục vụ trực tiếp, không qua getFileUrl */}
          {article.articlePdfUrl && (
            <Button asChild>
              <a href={article.articlePdfUrl} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" />
                Tải PDF bài báo gốc
              </a>
            </Button>
          )}
          {article.issue.slug && (
            <Button asChild variant="outline">
              <Link href={`/library/${article.issue.slug}`}>
                <BookOpenCheck className="mr-2 h-4 w-4" />
                Đọc toàn bộ số trong Thư viện
              </Link>
            </Button>
          )}
          {issuePdfUrl && (
            <Button asChild variant="outline">
              <a href={issuePdfUrl} download>
                <Download className="mr-2 h-4 w-4" />
                Tải PDF số
              </a>
            </Button>
          )}
        </div>
      </article>
    </div>
  )
}
