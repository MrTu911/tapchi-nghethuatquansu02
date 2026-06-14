import { NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit-logger'
import { successResponse, errorResponse } from '@/lib/responses'
import { buildIssueCorpus } from '@/lib/services/journal-corpus.service'

type RouteContext = { params: Promise<{ id: string }> }

const ALLOWED_ROLES = ['MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'SYSADMIN']

/**
 * POST /api/issues/[id]/generate-corpus
 * Sinh "bản đọc số" (corpus.json + cover + PDF từng bài) cho Thư viện KindleReader.
 * Chỉ MANAGING_EDITOR / EIC / SYSADMIN.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession()
    if (!session?.uid) {
      return errorResponse('Unauthorized', 401)
    }
    if (!ALLOWED_ROLES.includes(session.role)) {
      return errorResponse('Forbidden', 403)
    }

    // Body tùy chọn: { ocr?: boolean } — bật OCR tiếng Việt cho PDF font cũ (chậm).
    const body = await request.json().catch(() => ({}))
    const ocr = body?.ocr === true

    const { id } = await params
    const issue = await prisma.issue.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true },
    })
    if (!issue) {
      return errorResponse('Không tìm thấy số tạp chí', 404)
    }

    const summary = await buildIssueCorpus(issue.id, { ocr })

    await logAudit({
      actorId: session.uid,
      action: 'ISSUE_CORPUS_GENERATED',
      object: 'Issue',
      objectId: summary.issueId,
      after: {
        slug: summary.slug,
        generated: summary.generated,
        skipped: summary.skipped.length,
        extractedFromPdf: summary.extractedFromPdf,
        ocr,
        ocrApplied: summary.ocrApplied,
      },
    })

    // Thư viện đọc tĩnh từ public/data/issues → revalidate để hiện ngay
    revalidatePath('/library')
    revalidatePath(`/library/${summary.slug}`)

    const parts = [`Đã tạo bản đọc số: ${summary.generated} bài`]
    if (summary.ocrApplied > 0) parts.push(`${summary.ocrApplied} bài lấy toàn văn nhờ OCR`)
    if (summary.lowQualityText > 0) parts.push(`${summary.lowQualityText} bài chỉ có tóm tắt + PDF`)
    if (summary.skipped.length > 0) parts.push(`bỏ qua ${summary.skipped.length} bài`)

    return successResponse(summary, parts.join(' · '))
  } catch (error) {
    console.error('generate-corpus error:', error)
    return errorResponse('Lỗi khi tạo bản đọc số', 500)
  }
}
