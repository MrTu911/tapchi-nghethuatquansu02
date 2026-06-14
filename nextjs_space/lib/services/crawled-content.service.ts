/**
 * Crawled Content Service
 * Business logic cho review và import bài crawl vào News
 */

import { prisma } from '../prisma'
import { auditLogger, AuditEventType } from '../audit-logger'

// ─── Slug helper ─────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 120)
}

async function generateUniqueSlug(title: string): Promise<string> {
  const base = slugify(title)
  let slug = base
  let counter = 1

  while (await prisma.news.findUnique({ where: { slug } })) {
    slug = `${base}-${counter++}`
  }

  return slug
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ImportOverrides {
  title?: string
  summary?: string
  category?: string
  tags?: string[]
  publishedAt?: Date
  isPublished?: boolean
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class CrawledContentService {
  // Import bài đã crawl vào model News
  async importToNews(
    contentId: string,
    actorId: string,
    overrides: ImportOverrides = {}
  ) {
    const content = await prisma.crawledContent.findUnique({
      where: { id: contentId },
      include: { webSource: true },
    })

    if (!content) throw new Error('Không tìm thấy bài đã crawl')
    if (content.status !== 'APPROVED') {
      throw new Error('Chỉ có thể import bài đã được duyệt (status = APPROVED)')
    }
    if (content.importedNewsId) {
      throw new Error('Bài này đã được import vào hệ thống')
    }

    const finalTitle = overrides.title || content.editedTitle || content.rawTitle
    const finalContent = content.editedContent || content.rawContent
    const finalSummary = overrides.summary || content.editedSummary || content.rawSummary || undefined
    const finalCategory = overrides.category || content.category || content.webSource.defaultCategory || undefined
    const finalTags = overrides.tags || content.tags

    const slug = await generateUniqueSlug(finalTitle)

    const news = await prisma.$transaction(async (tx) => {
      const createdNews = await tx.news.create({
        data: {
          slug,
          title: finalTitle,
          summary: finalSummary,
          content: finalContent,
          coverImage: content.coverImageS3 || undefined,
          category: finalCategory,
          tags: finalTags,
          isPublished: overrides.isPublished || false,
          publishedAt: overrides.isPublished ? (overrides.publishedAt || new Date()) : undefined,
          authorId: actorId,
        },
      })

      await tx.crawledContent.update({
        where: { id: contentId },
        data: {
          status: 'IMPORTED',
          importedNewsId: createdNews.id,
          importedAt: new Date(),
          importedBy: actorId,
        },
      })

      await tx.webSource.update({
        where: { id: content.webSourceId },
        data: { totalImported: { increment: 1 } },
      })

      return createdNews
    })

    // Audit logs
    await auditLogger.logSuccess(AuditEventType.NEWS_CREATED, {
      userId: actorId,
      details: {
        module: 'WebCrawler',
        action: 'CRAWLED_CONTENT_IMPORTED',
        newsId: news.id,
        newsSlug: news.slug,
        crawledContentId: contentId,
        sourceUrl: content.sourceUrl,
      },
    })

    return news
  }

  // Approve bài
  async approve(contentId: string, actorId: string, note?: string) {
    const content = await prisma.crawledContent.findUnique({ where: { id: contentId } })
    if (!content) throw new Error('Không tìm thấy bài đã crawl')
    if (content.status === 'IMPORTED') throw new Error('Bài đã được import, không thể thay đổi trạng thái')

    return prisma.crawledContent.update({
      where: { id: contentId },
      data: {
        status: 'APPROVED',
        reviewedBy: actorId,
        reviewedAt: new Date(),
        reviewNote: note || null,
      },
    })
  }

  // Reject bài
  async reject(contentId: string, actorId: string, note: string) {
    const content = await prisma.crawledContent.findUnique({ where: { id: contentId } })
    if (!content) throw new Error('Không tìm thấy bài đã crawl')
    if (content.status === 'IMPORTED') throw new Error('Bài đã được import, không thể thay đổi trạng thái')

    return prisma.crawledContent.update({
      where: { id: contentId },
      data: {
        status: 'REJECTED',
        reviewedBy: actorId,
        reviewedAt: new Date(),
        reviewNote: note,
      },
    })
  }
}

export const crawledContentService = new CrawledContentService()
