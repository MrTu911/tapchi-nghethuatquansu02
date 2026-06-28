import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth'
// Toàn bộ I/O file dùng local-storage: hệ thống chạy local (USE_AWS=false).
// lib/s3.saveFile là thuần AWS (không có nhánh local) nên KHÔNG dùng ở đây — sẽ ghi nhầm
// lên S3 rồi đọc lại bằng path local không tồn tại, làm hỏng bước bóc tách mục lục.
import { saveFile, getFileUrl, getAbsolutePath } from '@/lib/local-storage'
import { successResponse, errorResponse } from '@/lib/responses'
import { extractTocDraft } from '@/lib/services/journal-toc-parser.service'

/**
 * POST /api/repository/ingest/extract-toc
 *
 * Bước 1-2 số hóa số báo cũ: nhận PDF số báo (+ cover tuỳ chọn), lưu file, bóc tách
 * trang Mục lục thành danh sách DRAFT bài báo để biên tập viên xác nhận.
 *
 * Body: FormData { file: PDF, cover?: image, tocPages?: number }
 */

const ALLOWED_ROLES = ['EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'LAYOUT_EDITOR', 'SYSADMIN']
const MAX_PDF_BYTES = 50 * 1024 * 1024

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) return errorResponse('Unauthorized', 401)
    if (!ALLOWED_ROLES.includes(session.role)) return errorResponse('Không có quyền thực hiện', 403)

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const cover = formData.get('cover') as File | null
    const tocPagesRaw = formData.get('tocPages') as string | null

    if (!file) return errorResponse('Thiếu file PDF số báo', 400)
    if (file.type !== 'application/pdf') return errorResponse('File phải là PDF', 400)
    if (file.size > MAX_PDF_BYTES) return errorResponse('File PDF quá lớn (tối đa 50MB)', 400)

    // Lưu PDF số báo (public để trình đọc/tra cứu truy cập được).
    const saved = await saveFile(file, 'issue-pdf', true)
    const fileUrl = getFileUrl(saved.filePath, true)

    // Cover tuỳ chọn.
    let coverUrl: string | null = null
    if (cover && cover.size > 0) {
      const validImage = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
      if (!validImage.includes(cover.type)) return errorResponse('Ảnh bìa phải là JPEG/PNG/WebP', 400)
      const savedCover = await saveFile(cover, 'issue-cover', true)
      coverUrl = getFileUrl(savedCover.filePath, true)
    }

    const tocPages = tocPagesRaw ? Math.min(Math.max(parseInt(tocPagesRaw, 10) || 4, 1), 10) : 4
    const draft = await extractTocDraft(getAbsolutePath(saved.filePath), { tocPages })

    return successResponse({
      fileUrl,
      fileName: file.name,
      coverUrl,
      engine: draft.engine,
      totalPdfPages: draft.totalPdfPages,
      articles: draft.articles,
      ocrUnavailable: draft.engine === 'none',
    })
  } catch (error) {
    console.error('[ingest.extract-toc] error:', error)
    return errorResponse('Lỗi khi bóc tách mục lục PDF', 500)
  }
}
