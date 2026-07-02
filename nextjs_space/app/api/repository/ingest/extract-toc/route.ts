import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth'
// Toàn bộ I/O file dùng local-storage: hệ thống chạy local (USE_AWS=false).
// lib/s3.saveFile là thuần AWS (không có nhánh local) nên KHÔNG dùng ở đây — sẽ ghi nhầm
// lên S3 rồi đọc lại bằng path local không tồn tại, làm hỏng bước bóc tách mục lục.
import { saveFile, getFileUrl, getAbsolutePath } from '@/lib/local-storage'
import { successResponse, errorResponse } from '@/lib/responses'
import { extractTocDraft } from '@/lib/services/journal-toc-parser.service'
import { saveImageUpload } from '@/lib/services/image-upload.service'
import { buildPdfFromImages } from '@/lib/services/images-to-pdf'

/**
 * POST /api/repository/ingest/extract-toc
 *
 * Bước 1-2 số hóa số báo cũ: nhận NGUỒN (PDF số báo HOẶC nhiều ẢNH scan) + cover tuỳ chọn,
 * lưu file, bóc tách trang Mục lục thành danh sách DRAFT bài báo để biên tập viên xác nhận.
 * Nếu nguồn là ảnh → gói thành PDF rồi xử lý như PDF.
 *
 * Body: FormData { file?: PDF, images?: image[] (nhiều), cover?: image, tocPages?: number }
 */

const ALLOWED_ROLES = ['EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'LAYOUT_EDITOR', 'SYSADMIN']
const MAX_PDF_BYTES = 50 * 1024 * 1024
const VALID_IMAGE = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) return errorResponse('Unauthorized', 401)
    if (!ALLOWED_ROLES.includes(session.role)) return errorResponse('Không có quyền thực hiện', 403)

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const images = formData.getAll('images').filter((f): f is File => f instanceof File && f.size > 0)
    const cover = formData.get('cover') as File | null
    const tocPagesRaw = formData.get('tocPages') as string | null

    // Xác định nguồn: PDF sẵn có hoặc gói từ ảnh scan.
    let savedFilePath: string
    let fileName: string

    if (file && file.type === 'application/pdf') {
      if (file.size > MAX_PDF_BYTES) return errorResponse('File PDF quá lớn (tối đa 50MB)', 400)
      const saved = await saveFile(file, 'issue-pdf', true)
      savedFilePath = saved.filePath
      fileName = file.name
    } else if (images.length > 0) {
      for (const img of images) {
        if (!VALID_IMAGE.includes(img.type)) return errorResponse('Ảnh nguồn phải là JPEG/PNG/WebP', 400)
      }
      const inputs = await Promise.all(
        images.map(async (img) => ({ buffer: Buffer.from(await img.arrayBuffer()), mime: img.type })),
      )
      const pdfBytes = await buildPdfFromImages(inputs)
      const pdfFile = new File([Buffer.from(pdfBytes)], 'nguon-anh.pdf', { type: 'application/pdf' })
      const saved = await saveFile(pdfFile, 'issue-pdf', true)
      savedFilePath = saved.filePath
      fileName = `Ảnh scan (${images.length} trang)`
    } else {
      return errorResponse('Thiếu nguồn: cần 1 file PDF hoặc các ảnh scan', 400)
    }

    const fileUrl = getFileUrl(savedFilePath, true)

    // Cover tuỳ chọn — qua helper dùng chung (chống bẫy s3/local + prefix kép).
    let coverUrl: string | null = null
    if (cover && cover.size > 0) {
      if (!VALID_IMAGE.includes(cover.type)) return errorResponse('Ảnh bìa phải là JPEG/PNG/WebP', 400)
      const savedCover = await saveImageUpload(cover, 'issue-cover')
      coverUrl = savedCover.url
    }

    const tocPages = tocPagesRaw ? Math.min(Math.max(parseInt(tocPagesRaw, 10) || 4, 1), 10) : 4
    const draft = await extractTocDraft(getAbsolutePath(savedFilePath), { tocPages })

    return successResponse({
      fileUrl,
      fileName,
      coverUrl,
      engine: draft.engine,
      encoding: draft.encoding,
      encodingLabel: draft.encodingLabel,
      totalPdfPages: draft.totalPdfPages,
      articles: draft.articles,
      ocrUnavailable: draft.engine === 'none',
    })
  } catch (error) {
    console.error('[ingest.extract-toc] error:', error)
    return errorResponse('Lỗi khi bóc tách mục lục', 500)
  }
}
