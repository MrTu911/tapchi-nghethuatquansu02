/**
 * image-upload.service.ts
 *
 * MỘT ĐƯỜNG CODE DUY NHẤT để lưu ảnh (bìa số, ảnh đầu/cuối số, ảnh bài, ảnh-nguồn) — chống
 * các lỗi upload ảnh thực tế ở mọi vị trí trong web:
 *
 *   1. Dùng nhầm lib/s3.ts khi chạy local (USE_AWS=false): s3.saveFile không có nhánh local
 *      → ghi lên S3 rồi đọc path local không tồn tại → ảnh vỡ. Ở ĐÂY luôn dùng local-storage.
 *   2. Prefix kép: getFileUrl(path, true) luôn ép '/uploads/...'; KHÔNG bao giờ bọc lại một URL
 *      đã tuyệt đối. Hàm này nhận file gốc, trả URL '/uploads/...' dùng được ngay — lưu thẳng.
 *
 * Khi HIỂN THỊ, luôn cho URL qua getImageUrl (lib/image-utils-client) để chuẩn hoá.
 */

import { promises as fs } from 'fs'
import sharp from 'sharp'
import { saveFile, getFileUrl, getAbsolutePath } from '@/lib/local-storage'

const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_IMAGE_BYTES = 15 * 1024 * 1024 // 15MB

export interface SaveImageResult {
  /** URL root-relative dùng được ngay (vd '/uploads/images/issues/...'). Lưu thẳng vào DB/corpus. */
  url: string
  /** Đường dẫn tương đối từ UPLOAD_ROOT (nội bộ). */
  filePath: string
}

export class ImageUploadError extends Error {}

/** Danh mục ảnh dùng cho số hóa (khớp local-storage). */
export type ImageCategory = 'issue-cover' | 'article-image' | 'media' | 'banner' | 'general'

/**
 * Lưu một ảnh upload (public) và trả URL dùng được ngay.
 * @param category Danh mục local-storage (vd 'issue-cover', 'article-image', 'media').
 * @param opts.maxWidth Giới hạn bề rộng (px) — resize bằng sharp để file gọn (air-gap, không CDN).
 */
export async function saveImageUpload(
  file: File,
  category: ImageCategory,
  opts: { maxWidth?: number } = {},
): Promise<SaveImageResult> {
  if (!file || file.size === 0) throw new ImageUploadError('Thiếu file ảnh')
  if (!ALLOWED_IMAGE_MIME.includes(file.type)) {
    throw new ImageUploadError('Ảnh phải là JPEG/PNG/WebP')
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new ImageUploadError(`Ảnh quá lớn (tối đa ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)}MB)`)
  }

  // Luôn dùng local-storage (KHÔNG lib/s3 khi chạy local) + public → getFileUrl trả '/uploads/...'.
  const saved = await saveFile(file, category, true)

  // Chuẩn hoá/nén bằng sharp (đọc ra buffer trước rồi ghi đè — an toàn cùng file).
  try {
    const abs = getAbsolutePath(saved.filePath)
    const maxWidth = opts.maxWidth ?? 2000
    const buffer = await sharp(abs).rotate().resize({ width: maxWidth, withoutEnlargement: true }).toBuffer()
    await fs.writeFile(abs, buffer)
  } catch {
    // Nếu sharp lỗi (định dạng lạ) vẫn giữ file gốc đã lưu — không chặn.
  }

  return { url: getFileUrl(saved.filePath, true), filePath: saved.filePath }
}
