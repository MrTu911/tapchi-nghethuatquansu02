/**
 * images-to-pdf.ts
 *
 * Gói nhiều ẢNH SCAN (PNG/JPG) thành một PDF (mỗi ảnh 1 trang) để chạy chung pipeline số hóa
 * (tách bài → OCR tiếng Việt). Dùng khi nguồn số báo là ẢNH thay vì PDF. Air-gap (pdf-lib),
 * chuẩn hoá qua sharp để nhúng ổn định.
 */

import { PDFDocument } from 'pdf-lib'
import sharp from 'sharp'

export interface ImageInput {
  buffer: Buffer
  mime: string
}

/**
 * Dựng PDF từ danh sách ảnh (theo thứ tự). Ảnh được chuẩn hoá về JPEG để nhúng an toàn.
 * Trả về bytes PDF.
 */
export async function buildPdfFromImages(images: ImageInput[]): Promise<Uint8Array> {
  if (images.length === 0) throw new Error('Không có ảnh nào để dựng PDF')
  const pdf = await PDFDocument.create()

  for (const img of images) {
    // Chuẩn hoá về JPEG (flatten nền trắng cho ảnh có alpha) để embedJpg ổn định.
    const jpg = await sharp(img.buffer)
      .rotate()
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 88 })
      .toBuffer()
    const embedded = await pdf.embedJpg(jpg)
    const page = pdf.addPage([embedded.width, embedded.height])
    page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height })
  }

  return pdf.save()
}
