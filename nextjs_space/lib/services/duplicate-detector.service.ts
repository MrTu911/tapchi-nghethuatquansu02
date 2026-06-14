import { prisma } from '@/lib/prisma'
import { combinedSimilarityScore } from '@/lib/search-engine'

export type SimilarityLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export interface DuplicateCheckInput {
  title: string
  abstractVn?: string
  keywords?: string[]
}

export interface DuplicateMatch {
  id: string
  title: string
  authors: string
  issueInfo: string
  publishedAt: string | null
  score: number
  level: SimilarityLevel
  sourceType: 'PEER_REVIEW' | 'JOURNAL_IMPORT'
  pdfUrl: string | null
}

export interface DuplicateCheckResult {
  matches: DuplicateMatch[]
  totalCompared: number
  checkedAt: string
}

function classifyLevel(score: number): SimilarityLevel {
  if (score >= 0.85) return 'HIGH'
  if (score >= 0.6) return 'MEDIUM'
  return 'LOW'
}

function buildIssueInfo(volumeNo: number | undefined | null, issueNumber: number, year: number): string {
  if (volumeNo) return `Tập ${volumeNo}, Số ${issueNumber}/${year}`
  return `Số ${issueNumber}/${year}`
}

export async function checkDuplicates(
  input: DuplicateCheckInput,
  minScore: number = 0.3,
  topK: number = 10,
): Promise<DuplicateCheckResult> {
  const checkedAt = new Date().toISOString()

  // 1. Load all APPROVED Article records (peer-review track)
  const articles = await prisma.article.findMany({
    where: { approvalStatus: 'APPROVED', publishedAt: { not: null } },
    include: {
      submission: {
        select: {
          title: true,
          abstractVn: true,
          keywords: true,
          author: { select: { fullName: true } },
        },
      },
      issue: { include: { volume: true } },
    },
  })

  // 2. Load all PUBLISHED JournalArticle records (import track)
  const journalArticles = await prisma.journalArticle.findMany({
    where: { status: 'PUBLISHED' },
    include: {
      issue: { include: { volume: true } },
      authors: { orderBy: { order: 'asc' } },
    },
  })

  const totalCompared = articles.length + journalArticles.length
  const inputCandidate = {
    title: input.title,
    abstract: input.abstractVn,
    keywords: input.keywords,
  }

  const results: DuplicateMatch[] = []

  // Score peer-review articles
  for (const a of articles) {
    const keywords: string[] = Array.isArray(a.submission.keywords)
      ? (a.submission.keywords as string[])
      : []

    const score = combinedSimilarityScore(inputCandidate, {
      title: a.submission.title,
      abstract: a.submission.abstractVn || undefined,
      keywords,
    })

    if (score >= minScore) {
      results.push({
        id: a.id,
        title: a.submission.title,
        authors: a.submission.author.fullName,
        issueInfo: a.issue
          ? buildIssueInfo(a.issue.volume?.volumeNo, a.issue.number, a.issue.year)
          : 'Chưa phân số',
        publishedAt: a.publishedAt?.toISOString() ?? null,
        score: Math.round(score * 1000) / 1000,
        level: classifyLevel(score),
        sourceType: 'PEER_REVIEW',
        pdfUrl: a.pdfFile ?? null,
      })
    }
  }

  // Score journal import articles
  for (const ja of journalArticles) {
    const authorDisplay =
      ja.authors.length > 0
        ? ja.authors.map((au) => [au.militaryRank, au.degree, au.name].filter(Boolean).join(' ')).join('; ')
        : ja.authorsText

    const score = combinedSimilarityScore(inputCandidate, {
      title: ja.title,
      abstract: ja.abstract || undefined,
      keywords: ja.keywords ?? [],
    })

    if (score >= minScore) {
      results.push({
        id: ja.id,
        title: ja.title,
        authors: authorDisplay,
        issueInfo: buildIssueInfo(ja.issue.volume?.volumeNo, ja.issue.number, ja.issue.year),
        publishedAt: ja.issue.publishDate?.toISOString() ?? null,
        score: Math.round(score * 1000) / 1000,
        level: classifyLevel(score),
        sourceType: 'JOURNAL_IMPORT',
        pdfUrl: ja.articlePdfUrl ?? null,
      })
    }
  }

  // Sort by score desc, take top K
  const topMatches = results.sort((a, b) => b.score - a.score).slice(0, topK)

  return { matches: topMatches, totalCompared, checkedAt }
}
