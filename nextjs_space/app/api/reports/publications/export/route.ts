/**
 * GET /api/reports/publications/export?format=docx|xlsx|pdf&mode=author|aggregate
 * Xuất file báo cáo tổng hợp công bố khoa học (DOCX / XLSX / PDF).
 *
 * runtime=nodejs vì cần fs (font PDF) + thư viện docx/exceljs/jspdf chạy server.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { errorResponse, validationErrorResponse } from '@/lib/responses'
import { createAuditLog, AuditEventType } from '@/lib/audit-logger'
import {
  buildPublicationReport,
  buildPublicationReportFile,
} from '@/lib/services/publication-report.service'
import {
  exportQuerySchema,
  enforceAuthorScope,
} from '@/lib/validators/publication-report.validator'

function buildFileName(mode: string, ext: string): string {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  return `bao-cao-tong-hop-cong-bo-${mode}-${stamp}.${ext}`
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return errorResponse('Chưa đăng nhập', 401)
    }

    const query = Object.fromEntries(new URL(req.url).searchParams.entries())
    const parse = exportQuerySchema.safeParse(query)
    if (!parse.success) {
      return validationErrorResponse(parse.error.flatten().fieldErrors)
    }

    const { format, ...filterInput } = parse.data
    const filters = enforceAuthorScope(filterInput, session)

    const report = await buildPublicationReport(filters)
    const { buffer, contentType, ext } = await buildPublicationReportFile(report, format)

    // Audit: mọi lần export đều ghi nhận (không log toàn bộ payload)
    await createAuditLog({
      userId: session.uid,
      action: AuditEventType.DATA_EXPORT,
      entity: 'PublicationReport',
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
      metadata: {
        mode: filters.mode,
        format,
        totalRows: report.rows.length,
        filters: {
          authorName: filters.authorName,
          sectionName: filters.sectionName,
          issueId: filters.issueId,
          volumeId: filters.volumeId,
          year: filters.year,
          yearFrom: filters.yearFrom,
          yearTo: filters.yearTo,
          role: filters.role,
        },
      },
    })

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${buildFileName(filters.mode, ext)}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('[reports/publications/export] error:', error)
    return errorResponse('Lỗi khi xuất file báo cáo', 500)
  }
}
