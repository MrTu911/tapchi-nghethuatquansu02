/**
 * GET /api/reports/publications
 * Xem trước (JSON) báo cáo tổng hợp công bố khoa học: danh mục bài + số liệu.
 *
 * Route layer: chỉ parse/validate/auth + ép phạm vi RBAC rồi gọi service.
 */

export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getServerSession } from '@/lib/auth'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/responses'
import { buildPublicationReport } from '@/lib/services/publication-report.service'
import {
  reportFiltersSchema,
  enforceAuthorScope,
} from '@/lib/validators/publication-report.validator'

const previewPagingSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return errorResponse('Chưa đăng nhập', 401)
    }

    const query = Object.fromEntries(new URL(req.url).searchParams.entries())

    const filterParse = reportFiltersSchema.safeParse(query)
    if (!filterParse.success) {
      return validationErrorResponse(filterParse.error.flatten().fieldErrors)
    }
    const paging = previewPagingSchema.parse(query)

    const filters = enforceAuthorScope(filterParse.data, session)
    const report = await buildPublicationReport(filters)

    // Phân trang preview in-memory (kết quả đã cap ở service)
    const start = (paging.page - 1) * paging.pageSize
    const pagedRows = report.rows.slice(start, start + paging.pageSize)

    return successResponse({
      mode: report.mode,
      authorHeader: report.authorHeader,
      summary: report.summary,
      rows: pagedRows,
      total: report.rows.length,
      page: paging.page,
      pageSize: paging.pageSize,
      truncated: report.truncated,
      generatedAt: report.generatedAt.toISOString(),
    })
  } catch (error) {
    console.error('[reports/publications] preview error:', error)
    return errorResponse('Lỗi khi tạo xem trước báo cáo', 500)
  }
}
