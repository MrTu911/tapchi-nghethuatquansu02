import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/responses'
import { writeImagesLayout, type ImagesLayout } from '@/lib/services/journal-images-layout.service'

/**
 * PATCH /api/repository/ingest/[slug]/images/layout
 * Cập nhật bố cục ảnh (bật/tắt, thứ tự, chú thích, thứ tự ảnh đầu/cuối). Ghi images-layout.json.
 * Body = ImagesLayout đầy đủ (UI review gửi bản đã chỉnh).
 */

const ALLOWED_ROLES = ['EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'LAYOUT_EDITOR', 'SYSADMIN']

export async function PATCH(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const session = await getServerSession()
    if (!session) return errorResponse('Unauthorized', 401)
    if (!ALLOWED_ROLES.includes(session.role)) return errorResponse('Không có quyền thực hiện', 403)

    const body = (await req.json()) as Partial<ImagesLayout>
    const layout: ImagesLayout = {
      frontMatter: Array.isArray(body.frontMatter) ? body.frontMatter : [],
      backMatter: Array.isArray(body.backMatter) ? body.backMatter : [],
      articles: body.articles && typeof body.articles === 'object' ? body.articles : {},
    }

    await writeImagesLayout(params.slug, layout)
    return successResponse({ layout }, 'Đã lưu bố cục ảnh')
  } catch (error) {
    console.error('[ingest.images.layout] error:', error)
    return errorResponse('Lỗi khi lưu bố cục ảnh', 500)
  }
}
