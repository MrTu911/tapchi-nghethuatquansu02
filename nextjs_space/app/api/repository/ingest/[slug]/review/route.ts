import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/responses'
import { getIngestStatus } from '@/lib/services/journal-issue-ingest.service'
import { readImagesLayout } from '@/lib/services/journal-images-layout.service'

/**
 * GET /api/repository/ingest/[slug]/review
 * Dữ liệu cho BÀN BIÊN TẬP trước xuất bản: số + danh sách bài (kèm toàn văn), chuyên mục,
 * tiến trình (cờ trùng), và bố cục ảnh (ảnh bài + ảnh đầu/cuối số).
 */

const ALLOWED_ROLES = ['EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'LAYOUT_EDITOR', 'SYSADMIN']

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const session = await getServerSession()
    if (!session) return errorResponse('Unauthorized', 401)
    if (!ALLOWED_ROLES.includes(session.role)) return errorResponse('Không có quyền thực hiện', 403)

    const issue = await prisma.issue.findUnique({
      where: { slug: params.slug },
      include: {
        sections: { orderBy: { order: 'asc' }, select: { id: true, name: true } },
        journalArticles: {
          orderBy: { pageStart: 'asc' },
          select: {
            id: true, slug: true, title: true, authorsText: true, sectionId: true,
            pageStart: true, pageEnd: true, abstract: true,
            contentText: true, contentSource: true, extractionStatus: true, status: true,
          },
        },
      },
    })
    if (!issue) return notFoundResponse('Không tìm thấy số báo')

    const [status, imagesLayout] = await Promise.all([
      getIngestStatus(params.slug),
      readImagesLayout(params.slug),
    ])

    return successResponse({
      issue: {
        id: issue.id, slug: issue.slug, title: issue.title, number: issue.number, year: issue.year,
        coverImage: issue.coverImage, status: issue.status, pageCount: issue.pageCount,
      },
      sections: issue.sections,
      articles: issue.journalArticles,
      status,
      imagesLayout,
    })
  } catch (error) {
    console.error('[ingest.review] error:', error)
    return errorResponse('Lỗi khi tải dữ liệu biên tập', 500)
  }
}
