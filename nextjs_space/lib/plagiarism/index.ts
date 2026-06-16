/**
 * Module kiểm tra đạo văn nội bộ — TẦNG IO + ORCHESTRATION.
 * Lõi tính điểm thuần (tokenize, TF-IDF, n-gram, breakdown) nằm ở ./scoring (test được).
 *
 * So sánh bài nộp / văn bản với toàn bộ kho bài trong CSDL:
 *   - Submission (bài đang/đã qua workflow)
 *   - Article (bài xuất bản qua peer-review)
 *   - JournalArticle (bài trong các SỐ ĐÃ IN — kho tạp chí cũ)
 *   - News (tin tức đã xuất bản trên trang công khai)
 *   - CrawledContent (nội dung web đã thu thập — kho đối sánh mở rộng)
 */

import { prisma } from '@/lib/prisma'
import { downloadFileBuffer } from '@/lib/s3'
import { extractPdfText } from '@/lib/pdf-metadata'
import { logAudit } from '@/lib/audit-logger'
import { createBulkNotifications } from '@/lib/notification-manager'
import { logger } from '@/lib/logger'
import {
  computeMatches,
  finalizeResult,
  emptyResult,
  type Candidate,
  type PlagiarismResult,
} from './scoring'

export type {
  PlagiarismSourceType,
  PlagiarismMatch,
  SourceBreakdownEntry,
  PlagiarismResult,
} from './scoring'

export type AutoCheckTrigger = 'ON_SUBMIT' | 'ON_REVIEW'

// Giới hạn số bản ghi lấy từ mỗi nguồn để tránh quá tải.
const MAX_CANDIDATES_PER_SOURCE = 1000
// Ngưỡng cảnh báo tự động: báo biên tập viên khi điểm tương đồng cao tới mức này.
export const AUTO_ALERT_THRESHOLD = 40
// Vai trò được nhận cảnh báo đạo văn tự động.
const EDITORIAL_ALERT_ROLES = ['SECTION_EDITOR', 'MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'SYSADMIN'] as const

const stripHtml = (html: string | null | undefined): string => (html ?? '').replace(/<[^>]*>/g, ' ')

// ─── Nạp ứng viên từ CSDL ───────────────────────────────────────────────────

/**
 * Lấy ứng viên so khớp từ 5 nguồn. `excludeSubmissionId` để không so bài với chính nó.
 * Nguồn mở rộng (News, CrawledContent) bọc guard: bảng vắng/lỗi ở checkout khác thì bỏ
 * qua nguồn đó thay vì làm vỡ toàn bộ phép kiểm tra.
 */
async function loadCandidates(excludeSubmissionId?: string): Promise<Candidate[]> {
  // Article.submissionId bắt buộc → `{ not: x }` an toàn.
  const excludeArticleSelf = excludeSubmissionId ? { submissionId: { not: excludeSubmissionId } } : {}

  // JournalArticle.submissionId nullable: hầu hết bài tạp chí cũ có submissionId = null.
  // Prisma `{ not: x }` loại luôn hàng NULL, nên phải OR tường minh với { null } —
  // nếu không, TOÀN BỘ kho tạp chí cũ bị bỏ khỏi phép so khớp.
  const excludeJournalSelf = excludeSubmissionId
    ? { OR: [{ submissionId: null }, { submissionId: { not: excludeSubmissionId } }] }
    : {}

  const [submissions, articles, journalArticles] = await Promise.all([
    prisma.submission.findMany({
      where: {
        status: { notIn: ['DESK_REJECT', 'REJECTED'] },
        ...(excludeSubmissionId ? { id: { not: excludeSubmissionId } } : {}),
      },
      include: { article: true },
      take: MAX_CANDIDATES_PER_SOURCE,
    }),
    prisma.article.findMany({
      where: {
        approvalStatus: 'APPROVED',
        ...excludeArticleSelf,
      },
      include: { submission: true },
      take: MAX_CANDIDATES_PER_SOURCE,
    }),
    prisma.journalArticle.findMany({
      where: {
        status: 'PUBLISHED',
        contentText: { not: null },
        ...excludeJournalSelf,
      },
      select: { id: true, title: true, abstract: true, contentText: true },
      take: MAX_CANDIDATES_PER_SOURCE,
    }),
  ])

  const newsRows = await loadNewsCandidates()
  const crawledRows = await loadCrawledCandidates()

  // Dedup: bỏ Article nếu submission của nó đã có trong danh sách submission ứng viên.
  const submissionIds = new Set(submissions.map((s) => s.id))

  const candidates: Candidate[] = []

  for (const submission of submissions) {
    candidates.push({
      id: submission.id,
      title: submission.title,
      type: 'submission',
      authorUserId: submission.createdBy,
      text: [submission.title, submission.abstractVn ?? '', submission.abstractEn ?? '', submission.article?.htmlBody ?? ''].join(' '),
    })
  }

  for (const article of articles) {
    if (article.submissionId && submissionIds.has(article.submissionId)) continue
    candidates.push({
      id: article.id,
      title: article.submission?.title ?? `Article ${article.id}`,
      type: 'article',
      authorUserId: article.submission?.createdBy ?? null,
      text: [article.submission?.title ?? '', article.submission?.abstractVn ?? '', article.htmlBody ?? ''].join(' '),
    })
  }

  for (const journalArticle of journalArticles) {
    candidates.push({
      id: journalArticle.id,
      title: journalArticle.title,
      type: 'journal',
      authorUserId: null,
      text: [journalArticle.title, journalArticle.abstract ?? '', journalArticle.contentText ?? ''].join(' '),
    })
  }

  for (const news of newsRows) {
    candidates.push({
      id: news.id,
      title: news.title,
      type: 'news',
      authorUserId: null,
      text: [news.title, news.summary ?? '', stripHtml(news.content)].join(' '),
    })
  }

  for (const crawled of crawledRows) {
    const title = crawled.editedTitle ?? crawled.rawTitle
    candidates.push({
      id: crawled.id,
      title,
      type: 'web',
      authorUserId: null,
      text: [title, stripHtml(crawled.editedContent ?? crawled.rawContent)].join(' '),
    })
  }

  return candidates
}

/** Tin tức đã xuất bản (bảng core — luôn tồn tại, vẫn bọc guard cho chắc). */
async function loadNewsCandidates() {
  try {
    return await prisma.news.findMany({
      where: { isPublished: true },
      select: { id: true, title: true, summary: true, content: true },
      take: MAX_CANDIDATES_PER_SOURCE,
    })
  } catch (error) {
    logger.warn({ context: 'plagiarism.loadCandidates', source: 'News', error: String(error) })
    return []
  }
}

/** Nội dung web đã thu thập (bảng tạo qua manual SQL — guard nếu checkout chưa có bảng). */
async function loadCrawledCandidates() {
  try {
    return await prisma.crawledContent.findMany({
      where: { status: { in: ['APPROVED', 'IMPORTED'] } },
      select: { id: true, rawTitle: true, editedTitle: true, rawContent: true, editedContent: true },
      take: MAX_CANDIDATES_PER_SOURCE,
    })
  } catch (error) {
    logger.warn({ context: 'plagiarism.loadCandidates', source: 'CrawledContent', error: String(error) })
    return []
  }
}

// ─── PDF text từ submission ─────────────────────────────────────────────────

/**
 * Trích xuất text từ các file PDF đã upload của một submission.
 * Thử download từ S3 và parse. Trả về chuỗi rỗng nếu không có hoặc lỗi.
 */
async function extractPdfTextFromSubmission(submissionId: string): Promise<string> {
  try {
    const files = await prisma.uploadedFile.findMany({
      where: { submissionId, mimeType: 'application/pdf' },
      select: { cloudStoragePath: true },
      take: 3,
    })

    const texts: string[] = []
    for (const file of files) {
      if (!file.cloudStoragePath) continue
      const buffer = await downloadFileBuffer(file.cloudStoragePath)
      if (!buffer) continue
      const text = await extractPdfText(buffer)
      if (text.trim().length > 50) texts.push(text)
    }
    return texts.join(' ')
  } catch {
    return ''
  }
}

// ─── API công khai ──────────────────────────────────────────────────────────

/**
 * Kiểm tra đạo văn cho Submission — so với 5 nguồn.
 * Ưu tiên: title + abstract > htmlBody > PDF text (nếu không có text cấu trúc).
 */
export async function checkSubmissionPlagiarism(
  submissionId: string,
  method: 'cosine' | 'jaccard' = 'cosine',
): Promise<PlagiarismResult> {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { article: true },
  })

  if (!submission) {
    throw new Error('Submission not found')
  }

  const structuredText = [
    submission.title,
    submission.abstractVn ?? '',
    submission.abstractEn ?? '',
    submission.article?.htmlBody ?? '',
  ].join(' ').trim()

  let pdfText = ''
  if (structuredText.length < 200) {
    pdfText = await extractPdfTextFromSubmission(submissionId)
  }

  const sourceText = structuredText.length >= 50
    ? (pdfText ? `${structuredText} ${pdfText}` : structuredText)
    : pdfText

  if (sourceText.trim().length < 50) {
    return emptyResult(method)
  }

  const candidates = await loadCandidates(submissionId)
  const matches = computeMatches(sourceText, candidates, method, submission.createdBy)
  return finalizeResult(matches, candidates.length, method)
}

/**
 * Kiểm tra đạo văn từ raw text (dùng cho upload PDF trực tiếp).
 * Không cần submission trong DB — chỉ so text với toàn bộ kho.
 */
export async function checkTextPlagiarism(
  sourceText: string,
  method: 'cosine' | 'jaccard' = 'cosine',
): Promise<PlagiarismResult> {
  if (sourceText.trim().length < 50) {
    return emptyResult(method)
  }

  const candidates = await loadCandidates()
  const matches = computeMatches(sourceText, candidates, method)
  return finalizeResult(matches, candidates.length, method)
}

/**
 * Lưu kết quả kiểm tra vào database.
 * `originalityScore` và `sourceBreakdown` KHÔNG lưu cột riêng (tính lại được từ score +
 * matches ở tầng đọc) — giữ schema tương thích ngược, `matches` vẫn là mảng như cũ.
 */
export async function savePlagiarismReport(
  submissionId: string,
  result: PlagiarismResult,
  userId?: string,
  triggeredBy?: AutoCheckTrigger,
) {
  const triggerNote =
    triggeredBy === 'ON_SUBMIT'
      ? ' [Tự động khi nộp bài]'
      : triggeredBy === 'ON_REVIEW'
        ? ' [Tự động khi vào phản biện]'
        : ''
  return prisma.plagiarismReport.create({
    data: {
      submissionId,
      score: result.score,
      method: result.method,
      status: 'COMPLETED',
      matches: result.matches as any,
      totalCompared: result.totalCompared,
      checkedBy: userId,
      notes:
        `Mức nghiêm trọng cao nhất ${result.score}% (độ độc đáo ${result.originalityScore}%). ` +
        `Tìm thấy ${result.matches.length} bài tương tự trong ${result.totalCompared} bản ghi.${triggerNote}`,
    },
  })
}

/**
 * Lấy báo cáo kiểm tra đạo văn mới nhất của submission
 */
export async function getLatestPlagiarismReport(submissionId: string) {
  return prisma.plagiarismReport.findFirst({
    where: { submissionId },
    orderBy: { checkedAt: 'desc' },
    include: {
      checker: { select: { fullName: true, email: true } },
    },
  })
}

/**
 * Chạy kiểm tra đạo văn TỰ ĐỘNG trong quy trình (khi nộp bài / khi vào phản biện).
 * Thiết kế để gọi fire-and-forget: tự nuốt lỗi, KHÔNG được chặn luồng nghiệp vụ chính.
 * Lưu báo cáo + ghi audit, và cảnh báo biên tập viên nếu vượt ngưỡng.
 */
export async function runAutoPlagiarismCheck(
  submissionId: string,
  triggeredBy: AutoCheckTrigger,
): Promise<void> {
  try {
    const result = await checkSubmissionPlagiarism(submissionId, 'cosine')
    await savePlagiarismReport(submissionId, result, undefined, triggeredBy)

    await logAudit({
      action: 'PLAGIARISM_CHECK_AUTO',
      object: `submission:${submissionId}`,
      after: {
        triggeredBy,
        score: result.score,
        originalityScore: result.originalityScore,
        matchCount: result.matches.length,
        totalCompared: result.totalCompared,
      },
    })

    if (result.score < AUTO_ALERT_THRESHOLD) return

    const [submission, editors] = await Promise.all([
      prisma.submission.findUnique({
        where: { id: submissionId },
        select: { code: true, title: true },
      }),
      prisma.user.findMany({
        where: { role: { in: [...EDITORIAL_ALERT_ROLES] } },
        select: { id: true },
      }),
    ])

    const editorIds = editors.map((e) => e.id)
    if (editorIds.length === 0) return

    await createBulkNotifications(editorIds, {
      type: 'PLAGIARISM_ALERT',
      title: 'Cảnh báo nghi vấn trùng lặp',
      message:
        `Bài "${submission?.title ?? submissionId}" (${submission?.code ?? ''}) có mức tương đồng ` +
        `${result.score}% với kho dữ liệu — cần xem xét trước khi đưa vào phản biện.`,
      link: '/dashboard/plagiarism',
      sendEmail: false,
    })
  } catch (error) {
    logger.error({ context: 'plagiarism.runAutoPlagiarismCheck', submissionId, triggeredBy, error: String(error) })
  }
}
