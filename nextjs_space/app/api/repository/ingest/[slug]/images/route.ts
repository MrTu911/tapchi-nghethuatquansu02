import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/responses'
import {
  readImagesLayout, writeImagesLayout, savePackageImage,
} from '@/lib/services/journal-images-layout.service'

/**
 * POST /api/repository/ingest/[slug]/images
 * Tải ảnh vào gói số (đầu/cuối số hoặc ảnh bài) rồi cập nhật images-layout.json.
 *
 * FormData: { kind: 'front'|'back'|'article', articleSlug?, files[] }
 * Ảnh đầu/cuối bật ngay; ảnh bài BTV tải lên cũng bật (khác ảnh trích tự động — mặc định tắt).
 */

const ALLOWED_ROLES = ['EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'LAYOUT_EDITOR', 'SYSADMIN']

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const session = await getServerSession()
    if (!session) return errorResponse('Unauthorized', 401)
    if (!ALLOWED_ROLES.includes(session.role)) return errorResponse('Không có quyền thực hiện', 403)

    const form = await req.formData()
    const kind = String(form.get('kind') ?? '')
    const articleSlug = form.get('articleSlug') ? String(form.get('articleSlug')) : ''
    const files = form.getAll('files').filter((f): f is File => f instanceof File && f.size > 0)

    if (!['front', 'back', 'article'].includes(kind)) return errorResponse('kind không hợp lệ', 400)
    if (kind === 'article' && !articleSlug) return errorResponse('Thiếu articleSlug', 400)
    if (files.length === 0) return errorResponse('Không có ảnh nào', 400)

    const layout = await readImagesLayout(params.slug)
    const added: string[] = []

    for (const file of files) {
      const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      if (kind === 'article') {
        const rel = await savePackageImage(params.slug, `articles_img/${articleSlug}`, file, `up-${stamp}`)
        const entry = layout.articles[articleSlug] ?? { images: [] }
        entry.images.push({ file: rel, enabled: true })
        layout.articles[articleSlug] = entry
        added.push(rel)
      } else {
        const rel = await savePackageImage(params.slug, 'matter', file, `${kind}-${stamp}`)
        ;(kind === 'front' ? layout.frontMatter : layout.backMatter).push({ file: rel })
        added.push(rel)
      }
    }

    await writeImagesLayout(params.slug, layout)
    return successResponse({ added, layout }, `Đã tải ${added.length} ảnh`)
  } catch (error) {
    console.error('[ingest.images] error:', error)
    return errorResponse(error instanceof Error ? error.message : 'Lỗi khi tải ảnh', 500)
  }
}
