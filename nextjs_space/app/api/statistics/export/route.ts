/**
 * GET /api/statistics/export?format=xlsx
 * Export analytics report as Excel workbook.
 * Restricted to EIC, MANAGING_EDITOR, SYSADMIN.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { errorResponse } from '@/lib/responses'
import { buildExportReportData, buildXlsxWorkbook } from '@/lib/services/statistics-export.service'

export const dynamic = 'force-dynamic'

const ALLOWED_ROLES = ['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR'] as const

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return errorResponse('Unauthorized', 401)
    }
    if (!ALLOWED_ROLES.includes(session.role as typeof ALLOWED_ROLES[number])) {
      return errorResponse('Forbidden', 403)
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') ?? 'xlsx'

    if (format !== 'xlsx') {
      return errorResponse('Format không hợp lệ. Chỉ hỗ trợ: xlsx', 400)
    }

    const report = await buildExportReportData()
    const buffer = await buildXlsxWorkbook(report)

    const dateStamp = report.generatedAt
      .toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
      .replace(/\//g, '-')

    const filename = `bao-cao-tapchi-${dateStamp}.xlsx`

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error: any) {
    console.error('❌ Export error:', error)
    return errorResponse(error.message || 'Lỗi khi xuất báo cáo', 500)
  }
}
