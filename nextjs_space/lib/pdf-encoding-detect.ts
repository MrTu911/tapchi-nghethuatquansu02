/**
 * pdf-encoding-detect.ts
 *
 * NHẬN DẠNG DẠNG CHỮ của một PDF TRƯỚC khi trích text, để chọn đúng biện pháp thay vì
 * "thử rồi đoán". Dùng `pdffonts` (poppler) soi font nhúng:
 *
 *   - Font tên `.Vn*` (.VnTime, .VnArial, .VnArialH…), encoding Custom, uni=no  → TCVN3.
 *   - Font `VNI-*`                                                              → VNI.
 *   - Font `.VPS*` / VPS                                                        → VPS.
 *   - Font chuẩn (Arial/Times/Helvetica…) có ToUnicode hoặc WinAnsi             → Unicode.
 *   - KHÔNG có font nào (không có lớp text)                                      → bản scan ảnh → OCR.
 *
 * Nhận dạng font là tín hiệu CHÍNH (tất định); bước trích vẫn kiểm chất lượng output và
 * có nhánh dự phòng nếu nhận dạng sai (xem journal-text-extract.service.ts).
 */

import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

export type PdfEncoding = 'tcvn3' | 'vni' | 'vps' | 'unicode' | 'image' | 'unknown'

export interface PdfEncodingInfo {
  encoding: PdfEncoding
  /** Nhãn tiếng Việt để hiển thị cho biên tập viên. */
  label: string
  /** Tên font (đã bỏ tiền tố subset "ABCDEF+"). */
  fonts: string[]
  /** Có lớp text (có font nhúng) không. false = bản scan ảnh. */
  hasTextLayer: boolean
  /** Tỉ lệ font .Vn trên tổng số font (độ tin cậy TCVN3). */
  vnFontRatio: number
}

let pdffontsChecked = false
let pdffontsAvailable = false

async function isPdffontsAvailable(): Promise<boolean> {
  if (pdffontsChecked) return pdffontsAvailable
  pdffontsChecked = true
  try {
    await execFileAsync('pdffonts', ['-v'])
    pdffontsAvailable = true
  } catch {
    pdffontsAvailable = false
  }
  return pdffontsAvailable
}

const LABELS: Record<PdfEncoding, string> = {
  tcvn3: 'Font cũ TCVN3 (chuyển mã)',
  // VNI/VPS: chưa có bộ chuyển đã kiểm chứng (cần PDF mẫu thật để dựng bảng như TCVN3) →
  // nếu có ToUnicode thì pdftotext đọc thẳng, không thì OCR.
  vni: 'Font cũ VNI (đọc trực tiếp hoặc OCR)',
  vps: 'Font cũ VPS (đọc trực tiếp hoặc OCR)',
  unicode: 'Unicode',
  image: 'Bản scan ảnh (OCR)',
  unknown: 'Chưa rõ',
}

/** Bỏ tiền tố subset "ABCDEF+" khỏi tên font. */
function stripSubset(name: string): string {
  return name.replace(/^[A-Z]{6}\+/, '')
}

/**
 * Soi font nhúng bằng pdffonts để nhận dạng dạng chữ.
 * @param maxPages Giới hạn số trang soi (đủ để nhận dạng, nhanh).
 */
export async function detectPdfEncoding(pdfPath: string, maxPages = 4): Promise<PdfEncodingInfo> {
  if (!(await isPdffontsAvailable())) {
    return { encoding: 'unknown', label: LABELS.unknown, fonts: [], hasTextLayer: false, vnFontRatio: 0 }
  }

  let stdout = ''
  try {
    const res = await execFileAsync('pdffonts', ['-f', '1', '-l', String(maxPages), pdfPath], {
      maxBuffer: 8 * 1024 * 1024,
    })
    stdout = res.stdout
  } catch {
    return { encoding: 'unknown', label: LABELS.unknown, fonts: [], hasTextLayer: false, vnFontRatio: 0 }
  }

  // Bỏ 2 dòng header (name…/ ---), lấy tên font ở cột đầu mỗi dòng dữ liệu.
  const rows = stdout.split('\n').slice(2).map((l) => l.trim()).filter(Boolean)
  const fonts = rows.map((r) => stripSubset(r.split(/\s+/)[0])).filter(Boolean)

  if (fonts.length === 0) {
    // Không có font → không có lớp text → bản scan ảnh.
    return { encoding: 'image', label: LABELS.image, fonts: [], hasTextLayer: false, vnFontRatio: 0 }
  }

  const vnCount = fonts.filter((f) => /\.Vn/i.test(f)).length
  const vniCount = fonts.filter((f) => /(^|[^A-Za-z])VNI[-_ ]?/i.test(f)).length
  const vpsCount = fonts.filter((f) => /\.?VPS/i.test(f)).length
  const vnFontRatio = vnCount / fonts.length

  let encoding: PdfEncoding
  if (vnCount > 0) encoding = 'tcvn3'
  else if (vniCount > 0) encoding = 'vni'
  else if (vpsCount > 0) encoding = 'vps'
  else encoding = 'unicode'

  return { encoding, label: LABELS[encoding], fonts, hasTextLayer: true, vnFontRatio }
}
