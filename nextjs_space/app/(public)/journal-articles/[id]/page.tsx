import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getFileUrl } from '@/lib/local-storage'
import {
  getIssueReadingNavigation,
  getPublicJournalArticle,
} from '@/lib/services/journal-article-reader.service'
import { ArticleReaderView } from '@/components/journal/article-reader-view'

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

export default async function JournalArticlePage({ params }: Props) {
  const article = await getPublicJournalArticle(params.id)
  if (!article) notFound()

  const navigation = await getIssueReadingNavigation(article.issue.id, article.id)

  const issueHref = `/issues/${article.issue.slug ?? article.issue.id}`
  const coverImageUrl = article.issue.coverImage ? getFileUrl(article.issue.coverImage, true) : null
  const issuePdfUrl = article.issue.pdfUrl ? getFileUrl(article.issue.pdfUrl, true) : null
  const libraryHref = article.issue.slug ? `/library/${article.issue.slug}` : null

  return (
    <ArticleReaderView
      article={article}
      navigation={navigation}
      issueHref={issueHref}
      coverImageUrl={coverImageUrl}
      issuePdfUrl={issuePdfUrl}
      libraryHref={libraryHref}
    />
  )
}
