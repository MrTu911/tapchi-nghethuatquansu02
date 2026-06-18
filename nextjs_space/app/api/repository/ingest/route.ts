import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getServerSession } from '@/lib/auth'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/responses'
import { logAudit } from '@/lib/audit-logger'
import { createIssueFromDraft, runIssueIngest } from '@/lib/services/journal-issue-ingest.service'

/**
 * POST /api/repository/ingest
 *
 * Bước 3 số hóa số báo cũ: nhận danh sách bài đã xác nhận + meta số báo, tạo bản ghi
 * (DRAFT) rồi chạy pipeline số hóa NỀN (tách PDF → trích/OCR → corpus → EPUB → đối chiếu
 * trùng → xuất bản). Trả ngay slug để UI theo dõi tiến trình.
 */

const ALLOWED_ROLES = ['EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'LAYOUT_EDITOR', 'SYSADMIN']

const articleSchema = z.object({
  title: z.string().min(1, 'Tên bài không được trống'),
  authorsText: z.string().optional().default(''),
  section: z.string().optional().default(''),
  pageStart: z.number().int().min(1, 'Trang bắt đầu phải ≥ 1'),
  confidence: z.enum(['high', 'low']).optional().default('high'),
})

const ingestSchema = z.object({
  fileUrl: z.string().min(1, 'Thiếu PDF số báo'),
  coverUrl: z.string().nullable().optional(),
  slug: z.string().optional(),
  number: z.number().int().min(1),
  year: z.number().int().min(1900).max(2100),
  month: z.number().int().min(1).max(12).optional(),
  title: z.string().optional(),
  issueCode: z.number().int().min(1).optional(),
  isSpecial: z.boolean().optional(),
  pageOffset: z.number().int().min(-10).max(50).optional(),
  ocr: z.boolean().optional(),
  articles: z.array(articleSchema).min(1, 'Cần ít nhất một bài'),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) return errorResponse('Unauthorized', 401)
    if (!ALLOWED_ROLES.includes(session.role)) return errorResponse('Không có quyền thực hiện', 403)

    const body = await req.json()
    const parsed = ingestSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors)
    }
    const input = parsed.data

    const { issueId, slug } = await createIssueFromDraft({
      slug: input.slug,
      number: input.number,
      year: input.year,
      month: input.month,
      title: input.title,
      issueCode: input.issueCode,
      isSpecial: input.isSpecial,
      coverImage: input.coverUrl ?? null,
      pdfUrl: input.fileUrl,
      pageOffset: input.pageOffset,
      articles: input.articles,
    })

    await logAudit({
      actorId: session.uid,
      action: 'JOURNAL_ISSUE_INGEST',
      object: `Issue:${issueId}`,
      after: { slug, totalArticles: input.articles.length, ocr: input.ocr ?? true },
    })

    // Chạy nền — KHÔNG await để không chặn response. Lỗi được ghi vào status file.
    void runIssueIngest(issueId, { pageOffset: input.pageOffset ?? 0, ocr: input.ocr ?? true })

    return successResponse({ issueId, slug }, 'Đã bắt đầu số hóa số báo', 202)
  } catch (error) {
    console.error('[ingest] error:', error)
    return errorResponse(error instanceof Error ? error.message : 'Lỗi khi khởi tạo số hóa', 500)
  }
}
