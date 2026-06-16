/**
 * Khối dựng PDF bài báo dùng chung (NotoSerif tiếng Việt + bố cục dòng chảy).
 *
 * Tách primitive khỏi script để tái dùng cho:
 *  - tái tạo PDF bài thiếu file (scripts/journal/rebuild-missing-article-pdfs.ts)
 *  - dựng PDF bài xuất bản từ htmlBody (scripts/journal/generate-demo-article-pdfs.ts)
 *
 * Không phụ thuộc DB — chỉ lo render văn bản có cấu trúc thành PDF.
 */
import { registerNotoFonts, PDF_FONT_NAME } from './noto-fonts'

export { PDF_FONT_NAME }

export const JOURNAL_NAME = 'TẠP CHÍ NGHỆ THUẬT QUÂN SỰ VIỆT NAM'
export const ACCENT: [number, number, number] = [0x1e, 0x39, 0x24] // xanh quân sự đậm
export const GOLD: [number, number, number] = [0x9a, 0x7d, 0x2e] // vàng đồng (đậm cho text)

export interface ParagraphOpts {
  size: number
  style?: 'normal' | 'bold'
  lineGap?: number
  align?: 'left' | 'center' | 'justify'
  color?: [number, number, number]
  indent?: number
}

/** Tạo doc jsPDF A4 đã nạp sẵn font NotoSerif. */
export async function createArticlePdfDoc(): Promise<any> {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF('portrait', 'mm', 'a4')
  registerNotoFonts(doc)
  return doc
}

/**
 * Quản lý con trỏ dòng chảy: tự xuống trang, vẽ footer (tên tạp chí + số trang).
 * Toạ độ tính bằng mm trên khổ A4.
 */
export class PdfFlow {
  y: number
  page = 1
  readonly left = 20
  readonly right: number
  readonly top = 22
  readonly bottom: number
  readonly width: number

  constructor(
    private readonly doc: any,
    private readonly footerText: string = JOURNAL_NAME,
  ) {
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    this.right = pageW - 20
    this.bottom = pageH - 16
    this.width = this.right - this.left
    this.y = this.top
  }

  private drawFooter(): void {
    const { doc } = this
    doc.setFont(PDF_FONT_NAME, 'normal')
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    const pageH = doc.internal.pageSize.getHeight()
    doc.text(this.footerText, this.left, pageH - 8)
    doc.text(String(this.page), this.right, pageH - 8, { align: 'right' })
    doc.setTextColor(0, 0, 0)
  }

  /** Đảm bảo còn đủ chỗ; nếu không thì kết thúc trang hiện tại và mở trang mới. */
  ensureSpace(needed: number): void {
    if (this.y + needed <= this.bottom) return
    this.drawFooter()
    this.doc.addPage()
    this.page += 1
    this.y = this.top
  }

  /** In một khối văn bản nhiều dòng, tự ngắt trang khi cần. */
  paragraph(text: string, opts: ParagraphOpts): void {
    const { doc } = this
    const style = opts.style ?? 'normal'
    const lineGap = opts.lineGap ?? 1.4
    doc.setFont(PDF_FONT_NAME, style)
    doc.setFontSize(opts.size)
    if (opts.color) doc.setTextColor(opts.color[0], opts.color[1], opts.color[2])
    const lineHeight = opts.size * 0.3528 * lineGap // pt → mm
    const indent = opts.indent ?? 0
    const lines: string[] = doc.splitTextToSize(text, this.width - indent)
    for (const line of lines) {
      this.ensureSpace(lineHeight)
      if (opts.align === 'center') {
        doc.text(line, (this.left + this.right) / 2, this.y, { align: 'center' })
      } else if (opts.align === 'justify') {
        doc.text(line, this.left + indent, this.y, { align: 'justify', maxWidth: this.width - indent })
      } else {
        doc.text(line, this.left + indent, this.y)
      }
      this.y += lineHeight
    }
    if (opts.color) doc.setTextColor(0, 0, 0)
  }

  gap(mm: number): void {
    this.y += mm
  }

  /** Vẽ đường kẻ ngang ngắt mục. */
  hr(color: [number, number, number] = [210, 210, 210], lineWidth = 0.2): void {
    this.ensureSpace(4)
    this.doc.setDrawColor(color[0], color[1], color[2])
    this.doc.setLineWidth(lineWidth)
    this.doc.line(this.left, this.y, this.right, this.y)
  }

  /** Vẽ footer trang cuối và trả về Buffer PDF. */
  finish(): Buffer {
    this.drawFooter()
    return Buffer.from(this.doc.output('arraybuffer'))
  }
}
