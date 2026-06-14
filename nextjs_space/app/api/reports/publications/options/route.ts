/**
 * GET /api/reports/publications/options
 * Trả về danh sách giá trị lọc cho UI báo cáo: chuyên mục, năm, tập.
 * Chỉ dữ liệu danh mục (không nhạy cảm) — yêu cầu đăng nhập.
 */

export const dynamic = 'force-dynamic'

import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/responses'

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) {
      return errorResponse('Chưa đăng nhập', 401)
    }

    const [sections, years, volumes] = await Promise.all([
      prisma.issueSection.findMany({
        distinct: ['name'],
        select: { name: true },
        orderBy: { name: 'asc' },
      }),
      prisma.issue.findMany({
        distinct: ['year'],
        select: { year: true },
        orderBy: { year: 'desc' },
      }),
      prisma.volume.findMany({
        select: { id: true, volumeNo: true, year: true },
        orderBy: { volumeNo: 'desc' },
      }),
    ])

    return successResponse({
      sections: sections.map((s) => s.name),
      years: years.map((y) => y.year),
      volumes,
    })
  } catch (error) {
    console.error('[reports/publications/options] error:', error)
    return errorResponse('Lỗi khi tải tùy chọn lọc', 500)
  }
}
