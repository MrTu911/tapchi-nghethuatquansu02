/**
 * pdf-poppler-text.ts
 *
 * Trích text từ PDF bằng `pdftotext` (poppler-utils) — chạy offline (air-gap).
 *
 * VÌ SAO không chỉ dùng pdf-parse: các số báo cũ nhúng font TCVN3 subset (encoding
 * "Custom", không có ToUnicode). `pdf-parse` (pdfjs) giải mã hỏng thành rác suy biến
 * (nhiều '2'/'D'), KHÔNG khôi phục được. `pdftotext` đọc đúng byte TCVN3 dưới dạng
 * CP1252 (vd "BIÖN PH¸P"), sau đó lib/text-encoding/tcvn3-to-unicode.ts chuyển về Unicode.
 * Với PDF Unicode chuẩn, pdftotext trả text đọc được ngay.
 *
 * Cài đặt: poppler-utils (đã có sẵn vì pdftoppm dùng cho OCR).
 *   sudo apt install poppler-utils
 */

import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

let popplerChecked = false
let popplerAvailable = false

/** Có `pdftotext` (poppler) trên hệ thống không (cache kết quả). */
export async function isPdftotextAvailable(): Promise<boolean> {
  if (popplerChecked) return popplerAvailable
  popplerChecked = true
  try {
    await execFileAsync('pdftotext', ['-v'])
    popplerAvailable = true
  } catch {
    popplerAvailable = false
  }
  return popplerAvailable
}

/**
 * Trích toàn văn PDF (theo path) bằng pdftotext. Trả '' nếu poppler không có hoặc lỗi.
 * `-enc UTF-8` để CP1252/Unicode ra đúng; `-nopgbrk` bỏ ký tự ngắt trang.
 */
export async function extractPdfTextPoppler(pdfPath: string): Promise<string> {
  if (!(await isPdftotextAvailable())) return ''
  try {
    const { stdout } = await execFileAsync(
      'pdftotext',
      ['-enc', 'UTF-8', '-nopgbrk', pdfPath, '-'],
      { maxBuffer: 60 * 1024 * 1024 },
    )
    return stdout
  } catch (error) {
    console.warn('[pdftotext] lỗi trích text:', error)
    return ''
  }
}

/** Trích text từ Buffer PDF (ghi tạm ra file để pdftotext đọc). */
export async function extractPdfTextPopplerFromBuffer(buffer: Buffer): Promise<string> {
  if (!(await isPdftotextAvailable())) return ''
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ntqs-pdftext-'))
  const tmpPath = path.join(tmpDir, 'in.pdf')
  try {
    await fs.writeFile(tmpPath, buffer)
    return await extractPdfTextPoppler(tmpPath)
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  }
}
