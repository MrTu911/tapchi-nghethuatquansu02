/**
 * journal-text-extract.service.ts
 *
 * Trích toàn văn tiếng Việt từ PDF một bài/số báo. Quy trình 2 bước:
 *
 *   B1. NHẬN DẠNG DẠNG CHỮ trước (pdf-encoding-detect: soi font nhúng bằng pdffonts):
 *       TCVN3 (.Vn*) | VNI | VPS | Unicode | bản scan ảnh (không có lớp text).
 *   B2. CHỌN BIỆN PHÁP theo dạng chữ (tất định), rồi kiểm chất lượng output; có nhánh dự
 *       phòng nếu nhận dạng sai:
 *         - scan ảnh  → OCR tiếng Việt thẳng (không phí công trích text rỗng).
 *         - TCVN3     → pdftotext → convertTcvn3 → (hỏng thì) OCR.
 *         - Unicode   → pdftotext đọc trực tiếp → (hỏng thì) thử TCVN3/OCR.
 *         - VNI/VPS   → chưa có bộ chuyển trong app → OCR (nhãn rõ để BTV biết).
 *
 * pdf-parse chỉ là lưới đỡ khi poppler vắng mặt (với font TCVN3 subset nó ra rác suy biến).
 */

import { promises as fs } from 'fs'
import { extractPdfTextPoppler } from '@/lib/pdf-poppler-text'
import { extractPdfText } from '@/lib/pdf-metadata'
import { ocrPdfToText, isOcrAvailable } from '@/lib/ocr/pdf-ocr'
import { looksLikeVietnameseProse } from '@/lib/pdf-text-quality'
import { looksLikeTcvn3 } from '@/lib/text-encoding/tcvn3-to-unicode'
import { convertTcvn3Calibrated } from '@/lib/text-encoding/tcvn3-calibrate'
import { detectPdfEncoding, type PdfEncoding } from '@/lib/pdf-encoding-detect'

export type TextExtractSource = 'pdftotext' | 'tcvn3-convert' | 'pdf-parse' | `ocr:${string}` | 'none'

export interface TextExtractResult {
  text: string
  source: TextExtractSource
  /** Dạng chữ nhận dạng được (font) — để hiển thị/ghi nhận. */
  encoding: PdfEncoding
  /** Text không đọc được (kể cả OCR) → nên giữ PDF gốc, body để trống. */
  lowQuality: boolean
  ocrApplied: boolean
  tcvn3Applied: boolean
}

/** Trích text từ PDF (theo path). @param opts.ocr Bật OCR dự phòng (mặc định true). */
export async function extractVietnameseText(
  pdfPath: string,
  opts: { ocr?: boolean } = {},
): Promise<TextExtractResult> {
  const ocr = opts.ocr ?? true

  // B1. Nhận dạng dạng chữ TRƯỚC.
  const detected = await detectPdfEncoding(pdfPath)
  const base = { encoding: detected.encoding }

  const tryOcr = async (): Promise<TextExtractResult | null> => {
    if (!ocr || !(await isOcrAvailable())) return null
    const o = await ocrPdfToText(pdfPath)
    if (looksLikeVietnameseProse(o.text)) {
      return { ...base, text: o.text, source: `ocr:${o.engine}`, lowQuality: false, ocrApplied: true, tcvn3Applied: false }
    }
    return null
  }

  // B2a. Bản scan ảnh (không có lớp text) → OCR thẳng.
  if (detected.encoding === 'image') {
    const ocrRes = await tryOcr()
    return ocrRes ?? { ...base, text: '', source: 'none', lowQuality: true, ocrApplied: false, tcvn3Applied: false }
  }

  // Có lớp text → pdftotext (fallback pdf-parse).
  let raw = await extractPdfTextPoppler(pdfPath)
  const popplerUsed = raw.trim().length > 0
  if (!popplerUsed) raw = await extractPdfText(await fs.readFile(pdfPath))

  // B2b. TCVN3 (theo font, hoặc output có dấu hiệu TCVN3) → chuyển mã + hiệu chỉnh per-bài.
  if (detected.encoding === 'tcvn3' || looksLikeTcvn3(raw)) {
    const converted = convertTcvn3Calibrated(raw)
    if (looksLikeVietnameseProse(converted)) {
      return { ...base, encoding: 'tcvn3', text: converted, source: 'tcvn3-convert', lowQuality: false, ocrApplied: false, tcvn3Applied: true }
    }
  }

  // B2c. Unicode: pdftotext đọc trực tiếp.
  if (looksLikeVietnameseProse(raw)) {
    return { ...base, text: raw, source: popplerUsed ? 'pdftotext' : 'pdf-parse', lowQuality: false, ocrApplied: false, tcvn3Applied: false }
  }

  // B2d. Dự phòng (VNI/VPS/chuyển mã hỏng/nhận dạng sai) → OCR.
  const ocrRes = await tryOcr()
  if (ocrRes) return ocrRes

  // Không đọc được.
  return { ...base, text: raw, source: 'none', lowQuality: true, ocrApplied: false, tcvn3Applied: false }
}
