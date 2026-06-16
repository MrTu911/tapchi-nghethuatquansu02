export const dynamic = 'force-dynamic'

/**
 * POST /api/articles/[id]/doi
 * Gán DOI local và tùy chọn đăng ký lên CrossRef.
 * Auth: SYSADMIN, EIC, LAYOUT_EDITOR, MANAGING_EDITOR
 *
 * Body:
 *   { doiLocal?: string, registerCrossRef?: boolean }
 *
 * - doiLocal omitted → auto-generate from article ID + year
 * - registerCrossRef: true → submit XML to CrossRef after saving
 *
 * GET /api/articles/[id]/doi
 * Trả về DOI hiện tại + CrossRef XML preview.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/responses'
import { logAudit } from '@/lib/audit-logger'
import { generateDOI } from '@/lib/validation/metadata'
import {
  generateCrossRefXML,
  submitDOIToCrossRef,
  getCrossRefConfig,
  validateDOI,
  type CrossRefArticleMetadata,
} from '@/lib/integrations/crossref'

const ALLOWED_ROLES = ['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'LAYOUT_EDITOR']

async function fetchArticleWithMeta(id: string) {
  return prisma.article.findUnique({
    where: { id },
    include: {
      submission: {
        include: {
          author: { select: { fullName: true, org: true } },
          category: { select: { name: true } },
        },
      },
      issue: {
        include: { volume: { select: { volumeNo: true } } },
      },
    },
  })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession()
  if (!session || !ALLOWED_ROLES.includes(session.role)) {
    return errorResponse('Không có quyền truy cập', 403)
  }

  const article = await fetchArticleWithMeta(params.id)
  if (!article) return errorResponse('Không tìm thấy bài viết', 404)

  const config = getCrossRefConfig()
  let xmlPreview: string | null = null

  if (article.doiLocal) {
    const [firstName, ...rest] = (article.submission.author.fullName ?? '').split(' ')
    const lastName = rest.join(' ') || firstName

    const meta: CrossRefArticleMetadata = buildCrossRefMeta(article, firstName, lastName)
    xmlPreview = generateCrossRefXML(meta, config)
  }

  return successResponse({
    articleId: article.id,
    doiLocal: article.doiLocal ?? null,
    xmlPreview,
    crossrefConfigured: !!(config.loginId && config.password),
    testMode: config.testMode ?? true,
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession()
  if (!session || !ALLOWED_ROLES.includes(session.role)) {
    return errorResponse('Không có quyền thực hiện', 403)
  }

  const article = await fetchArticleWithMeta(params.id)
  if (!article) return errorResponse('Không tìm thấy bài viết', 404)

  if (!article.submission) return errorResponse('Bài viết chưa có submission liên kết', 400)

  const body = await request.json().catch(() => ({}))
  const { doiLocal: customDoi, registerCrossRef = false } = body as {
    doiLocal?: string
    registerCrossRef?: boolean
  }

  // Determine the DOI to assign
  let doi: string
  if (customDoi) {
    if (!validateDOI(customDoi)) {
      return errorResponse('DOI không đúng định dạng (ví dụ: 10.59386/ntqs.2025.abc123)', 400)
    }
    doi = customDoi
  } else if (article.doiLocal) {
    doi = article.doiLocal // keep existing
  } else {
    const year = article.issue?.year ?? new Date().getFullYear()
    doi = generateDOI(article.id, year)
  }

  // Persist DOI
  await prisma.article.update({
    where: { id: params.id },
    data: { doiLocal: doi },
  })

  await logAudit({
    actorId: session.uid,
    action: 'DOI_ASSIGNED',
    object: 'article',
    objectId: params.id,
    after: { doi },
  })

  let crossRefResult: { success: boolean; message: string; batchId?: string } | null = null

  if (registerCrossRef) {
    const config = getCrossRefConfig()
    const [firstName, ...rest] = (article.submission.author.fullName ?? '').split(' ')
    const lastName = rest.join(' ') || firstName

    const meta: CrossRefArticleMetadata = buildCrossRefMeta({ ...article, doiLocal: doi }, firstName, lastName)
    const xml = generateCrossRefXML(meta, config)

    crossRefResult = await submitDOIToCrossRef(meta, config)

    await logAudit({
      actorId: session.uid,
      action: 'DOI_CROSSREF_SUBMITTED',
      object: 'article',
      objectId: params.id,
      after: {
        doi,
        success: crossRefResult.success,
        message: crossRefResult.message,
        batchId: crossRefResult.batchId ?? null,
      },
    })
  }

  return successResponse({
    doi,
    crossRef: crossRefResult,
  }, crossRefResult?.success === false
    ? `DOI đã lưu nhưng CrossRef thất bại: ${crossRefResult.message}`
    : 'DOI đã gán thành công'
  )
}

// ── Helper ─────────────────────────────────────────────────────────────────────

function buildCrossRefMeta(
  article: NonNullable<Awaited<ReturnType<typeof fetchArticleWithMeta>>>,
  firstName: string,
  lastName: string
): CrossRefArticleMetadata {
  return {
    title: article.submission.title,
    authors: [{
      firstName,
      lastName,
      affiliation: article.submission.author.org ?? undefined,
    }],
    abstract: article.submission.abstractVn ?? article.submission.abstractEn ?? undefined,
    publicationDate: article.publishedAt?.toISOString() ?? new Date().toISOString(),
    doi: article.doiLocal!,
    journalTitle: 'Tạp chí Nghệ thuật Quân sự Việt Nam',
    journalIssn: process.env.JOURNAL_ISSN ?? undefined,
    volume: article.issue?.volume?.volumeNo ?? undefined,
    issue: article.issue?.number ?? undefined,
    pages: article.pages ?? undefined,
    keywords: article.submission.keywords ?? undefined,
  }
}
