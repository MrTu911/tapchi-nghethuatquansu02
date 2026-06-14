/**
 * GET /api/plagiarism/reports
 * Lấy toàn bộ báo cáo kiểm tra đạo văn (dành cho dashboard editor/admin)
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ALLOWED_ROLES = ['SECTION_EDITOR', 'MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'LAYOUT_EDITOR', 'SYSADMIN']

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!ALLOWED_ROLES.includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))
    const skip = (page - 1) * limit

    const reports = await prisma.plagiarismReport.findMany({
      include: {
        checker: {
          select: { id: true, fullName: true, email: true },
        },
        article: {
          include: {
            submission: {
              select: {
                title: true,
                author: {
                  select: { fullName: true, org: true },
                },
              },
            },
          },
        },
        submission: {
          select: {
            title: true,
            author: {
              select: { fullName: true },
            },
          },
        },
      },
      orderBy: { checkedAt: 'desc' },
      skip,
      take: limit,
    })

    return NextResponse.json({
      success: true,
      data: reports,
    })
  } catch (error: any) {
    console.error('GET /api/plagiarism/reports error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi lấy danh sách báo cáo' },
      { status: 500 }
    )
  }
}
