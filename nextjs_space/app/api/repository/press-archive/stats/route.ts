import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/repository/press-archive/stats
 * Trả về số lượng bài báo theo từng trạng thái (PUBLISHED, DRAFT, WITHDRAWN)
 */
export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const [published, draft, withdrawn] = await Promise.all([
      prisma.journalArticle.count({ where: { status: 'PUBLISHED' } }),
      prisma.journalArticle.count({ where: { status: 'DRAFT' } }),
      prisma.journalArticle.count({ where: { status: 'WITHDRAWN' } }),
    ])

    return NextResponse.json({
      success: true,
      data: { published, draft, withdrawn, total: published + draft + withdrawn },
    })
  } catch (error) {
    console.error('GET /api/repository/press-archive/stats error:', error)
    return NextResponse.json({ success: false, error: 'Lỗi tải thống kê' }, { status: 500 })
  }
}
