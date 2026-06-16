/**
 * Nạp font NotoSerif (Regular + Bold) cho jsPDF để render tiếng Việt CÓ DẤU.
 *
 * Tách dùng chung cho mọi builder PDF (báo cáo công bố, báo cáo đạo văn...) — tránh
 * trùng lặp logic tìm/đọc font. Font tự host tại `lib/fonts/` (chạy được air-gapped).
 *
 * Thử nhiều vị trí để bền vững với mọi kiểu deploy (next start, standalone, cwd khác).
 */

import path from 'path'
import fs from 'fs'

export const PDF_FONT_NAME = 'NotoSerif'
export const FONT_REGULAR = 'NotoSerif-Regular.ttf'
export const FONT_BOLD = 'NotoSerif-Bold.ttf'

let cachedFonts: { regular: string; bold: string } | null = null

function resolveFontDir(): string {
  const candidates: string[] = [
    path.join(process.cwd(), 'lib', 'fonts'),
    path.join(process.cwd(), 'nextjs_space', 'lib', 'fonts'),
  ]
  if (typeof __dirname !== 'undefined') {
    candidates.push(
      path.join(__dirname, 'fonts'),
      path.join(__dirname, '..', 'fonts'),
      path.join(__dirname, '..', '..', 'lib', 'fonts'),
      path.join(__dirname, '..', '..', '..', 'lib', 'fonts'),
    )
  }
  for (const dir of candidates) {
    try {
      if (fs.existsSync(path.join(dir, FONT_REGULAR))) return dir
    } catch {
      // bỏ qua, thử ứng viên tiếp theo
    }
  }
  throw new Error(
    `Không tìm thấy font tiếng Việt cho PDF (${FONT_REGULAR}). Đã thử: ${candidates.join(' | ')}`,
  )
}

/** Đọc font về base64, cache trong bộ nhớ sau lần đầu. */
export function loadPdfFonts(): { regular: string; bold: string } {
  if (cachedFonts) return cachedFonts
  const dir = resolveFontDir()
  cachedFonts = {
    regular: fs.readFileSync(path.join(dir, FONT_REGULAR)).toString('base64'),
    bold: fs.readFileSync(path.join(dir, FONT_BOLD)).toString('base64'),
  }
  return cachedFonts
}

/** Đăng ký font NotoSerif vào một instance jsPDF và đặt làm font mặc định. */
export function registerNotoFonts(doc: {
  addFileToVFS: (name: string, data: string) => void
  addFont: (name: string, family: string, style: string) => void
  setFont: (family: string, style?: string) => void
}): void {
  const fonts = loadPdfFonts()
  doc.addFileToVFS(FONT_REGULAR, fonts.regular)
  doc.addFont(FONT_REGULAR, PDF_FONT_NAME, 'normal')
  doc.addFileToVFS(FONT_BOLD, fonts.bold)
  doc.addFont(FONT_BOLD, PDF_FONT_NAME, 'bold')
  doc.setFont(PDF_FONT_NAME, 'normal')
}
