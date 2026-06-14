/**
 * pdf-ocr.ts
 *
 * OCR tiếng Việt cho PDF dùng font cũ (TCVN3/glyph) mà pdf-parse/pdfjs không đọc được.
 * Quy trình: render từng trang PDF → ảnh (pdftoppm, grayscale 300DPI) → OCR (vie) → ghép text.
 *
 * Hai engine, ưu tiên theo thứ tự:
 *   1. tesseract hệ thống (`tesseract` CLI + gói `tesseract-ocr-vie`) — nhanh, chạy offline (khuyến nghị production).
 *   2. tesseract.js (WASM, npm) — fallback khi không có binary hệ thống (tải model lần đầu cần mạng).
 *
 * Cài đặt production (khuyến nghị):
 *   sudo apt install tesseract-ocr tesseract-ocr-vie
 */

import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

const OCR_LANG = 'vie'
const RENDER_DPI = 300
// Giới hạn an toàn để một bài lỗi (PDF quá dài) không treo cả tiến trình.
const MAX_PAGES_PER_ARTICLE = 40
// Nơi tesseract.js lưu model đã tải để tái dùng (tránh tải lại mỗi lần).
const TESSDATA_CACHE_DIR = path.join(process.cwd(), '.cache', 'tessdata')

export interface OcrResult {
  text: string
  pagesOcred: number
  engine: 'system-tesseract' | 'tesseract.js' | 'none'
}

let systemTesseractChecked = false
let systemTesseractAvailable = false

/** Kiểm tra có `tesseract` CLI hệ thống không (cache kết quả). */
async function hasSystemTesseract(): Promise<boolean> {
  if (systemTesseractChecked) return systemTesseractAvailable
  systemTesseractChecked = true
  try {
    await execFileAsync('tesseract', ['--version'])
    systemTesseractAvailable = true
  } catch {
    systemTesseractAvailable = false
  }
  return systemTesseractAvailable
}

/** Có ít nhất một engine OCR khả dụng không. */
export async function isOcrAvailable(): Promise<boolean> {
  if (await hasSystemTesseract()) return true
  try {
    require.resolve('tesseract.js')
    return true
  } catch {
    return false
  }
}

/**
 * OCR toàn bộ một PDF bài viết thành text.
 * Trả về text rỗng + engine 'none' nếu không có engine khả dụng.
 */
export async function ocrPdfToText(pdfPath: string): Promise<OcrResult> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ntqs-ocr-'))
  try {
    const pageImages = await renderPdfToImages(pdfPath, tmpDir)
    if (pageImages.length === 0) return { text: '', pagesOcred: 0, engine: 'none' }

    const useSystem = await hasSystemTesseract()
    const engine: OcrResult['engine'] = useSystem ? 'system-tesseract' : 'tesseract.js'

    const pageTexts: string[] = []
    for (const img of pageImages) {
      const pageText = useSystem ? await ocrImageSystem(img) : await ocrImageJs(img)
      if (pageText.trim()) pageTexts.push(pageText.trim())
    }

    if (pageTexts.length === 0) return { text: '', pagesOcred: 0, engine: 'none' }
    return { text: pageTexts.join('\n\n'), pagesOcred: pageTexts.length, engine }
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  }
}

// ─── Render PDF → ảnh (pdftoppm) ────────────────────────────────────────────

async function renderPdfToImages(pdfPath: string, outDir: string): Promise<string[]> {
  const prefix = path.join(outDir, 'page')
  // -gray + 300DPI cho chất lượng OCR tốt; giới hạn số trang để an toàn.
  await execFileAsync('pdftoppm', [
    '-png', '-gray', '-r', String(RENDER_DPI),
    '-f', '1', '-l', String(MAX_PAGES_PER_ARTICLE),
    pdfPath, prefix,
  ])
  const files = await fs.readdir(outDir)
  return files
    .filter((f) => f.startsWith('page') && f.endsWith('.png'))
    .sort()
    .map((f) => path.join(outDir, f))
}

// ─── Engine 1: tesseract hệ thống ────────────────────────────────────────────

async function ocrImageSystem(imagePath: string): Promise<string> {
  try {
    // stdout: in text ra stdout; --psm 6 = khối văn bản đồng nhất (phù hợp trang tạp chí).
    const { stdout } = await execFileAsync(
      'tesseract',
      [imagePath, 'stdout', '-l', OCR_LANG, '--psm', '6'],
      { maxBuffer: 20 * 1024 * 1024 },
    )
    return stdout
  } catch (error) {
    console.warn('[ocr] tesseract hệ thống lỗi:', error)
    return ''
  }
}

// ─── Engine 2: tesseract.js (WASM) ───────────────────────────────────────────

let jsWorker: any = null
let jsWorkerInit: Promise<any> | null = null

async function getJsWorker(): Promise<any> {
  if (jsWorker) return jsWorker
  if (!jsWorkerInit) {
    jsWorkerInit = (async () => {
      const { createWorker } = require('tesseract.js')
      await fs.mkdir(TESSDATA_CACHE_DIR, { recursive: true }).catch(() => {})
      // cachePath: tái dùng model đã tải; oem=1 (LSTM).
      jsWorker = await createWorker(OCR_LANG, 1, { cachePath: TESSDATA_CACHE_DIR })
      return jsWorker
    })()
  }
  return jsWorkerInit
}

async function ocrImageJs(imagePath: string): Promise<string> {
  try {
    const worker = await getJsWorker()
    const { data } = await worker.recognize(imagePath)
    return data?.text ?? ''
  } catch (error) {
    console.warn('[ocr] tesseract.js lỗi:', error)
    return ''
  }
}

/** Giải phóng worker tesseract.js (gọi cuối CLI/batch để tiến trình thoát sạch). */
export async function terminateOcr(): Promise<void> {
  if (jsWorker) {
    try { await jsWorker.terminate() } catch { /* ignore */ }
    jsWorker = null
    jsWorkerInit = null
  }
}
