
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateDOISuffix } from '@/lib/integrations/crossref'

const ALLOWED_ROLES = ['MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'SYSADMIN']
const DOI_PREFIX = process.env.DOI_PREFIX || '10.5567'

/**
 * POST /api/metadata/generate-doi
 * Tạo DOI tự động cho bài viết đã gán vào số tạp chí
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Chưa xác thực' }, { status: 401 })
    }
    if (!ALLOWED_ROLES.includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Không có quyền truy cập' }, { status: 403 })
    }

    const body = await req.json()
    const { articleId } = body

    if (!articleId) {
      return NextResponse.json({ success: false, error: 'Thiếu articleId' }, { status: 400 })
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        issue: { include: { volume: true } }
      }
    })

    if (!article) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy bài viết' }, { status: 404 })
    }

    if (article.doiLocal) {
      return NextResponse.json(
        { success: false, error: 'Bài viết đã có DOI' },
        { status: 409 }
      )
    }

    if (!article.issue) {
      return NextResponse.json(
        { success: false, error: 'Bài viết phải được gán vào số tạp chí trước khi tạo DOI' },
        { status: 422 }
      )
    }

    // Đếm bài viết trong cùng số để xác định thứ tự
    const articleCount = await prisma.article.count({
      where: { issueId: article.issueId! }
    })

    const suffix = generateDOISuffix(
      article.issue.volume.volumeNo,
      article.issue.number,
      articleCount
    )
    const doi = `${DOI_PREFIX}/${suffix}`

    const updated = await prisma.article.update({
      where: { id: articleId },
      data: { doiLocal: doi }
    })

    return NextResponse.json({ success: true, data: updated, doi })
  } catch (error) {
    console.error('[generate-doi] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi máy chủ nội bộ' },
      { status: 500 }
    )
  }
}
