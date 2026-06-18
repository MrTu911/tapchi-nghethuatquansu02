/**
 * journal-toc-parser.service.ts
 *
 * Bóc tách trang "MỤC LỤC" của một số báo PDF thành DANH SÁCH DRAFT bài báo
 * (tên bài, tác giả, chuyên mục, trang bắt đầu) để biên tập viên rà/sửa trước khi
 * tạo bản ghi và chạy số hóa.
 *
 * Hai phần:
 *   - parseTocText(rawText): THUẦN (không IO) → test được với fixture OCR.
 *   - extractTocDraft(pdfPath): IO — cắt vài trang đầu, trích text (pdf-parse → OCR), gọi parse.
 *
 * Bản scan font cũ (TCVN3) trích trực tiếp ra rác → tự chuyển sang OCR tiếng Việt.
 * Kết quả parse là DRAFT: luôn cần người xác nhận (cờ `confidence` để tô dòng nghi ngờ).
 */

import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'
import { PDFDocument } from 'pdf-lib'
import { extractPdfText } from '@/lib/pdf-metadata'
import { ocrPdfToText, isOcrAvailable } from '@/lib/ocr/pdf-ocr'
import { looksLikeVietnameseProse } from '@/lib/pdf-text-quality'

export interface DraftArticle {
  title: string
  authorsText: string
  section: string
  pageStart: number
  /** 'low' = thiếu tác giả / tên bất thường → tô đỏ để biên tập viên kiểm tra. */
  confidence: 'high' | 'low'
}

export interface TocExtractResult {
  rawText: string
  engine: 'pdf-parse' | 'ocr' | 'none'
  totalPdfPages: number
  articles: DraftArticle[]
}

// Chuyên mục đặc thù NTQS (CLAUDE.md mục 6) + vài header chung hay gặp ở mục lục.
const KNOWN_SECTIONS = [
  'Chiến lược quân sự',
  'Nghệ thuật tác chiến',
  'Chiến dịch học',
  'Chiến thuật học',
  'Lịch sử quân sự',
  'Khoa học quân sự',
  'Giáo dục quân sự',
  'Hợp tác quốc phòng',
  'Tin tức Học viện',
  'Nghiên cứu - Trao đổi',
  'Diễn đàn',
]

// Token mở đầu phần TÁC GIẢ trong một dòng mục lục (quân hàm / học hàm / học vị).
const AUTHOR_LEAD_TOKENS = [
  'Đại tướng', 'Thượng tướng', 'Trung tướng', 'Thiếu tướng',
  'Đại tá', 'Thượng tá', 'Trung tá', 'Thiếu tá',
  'Đại úy', 'Thượng úy', 'Trung úy', 'Thiếu úy',
  'TSKH', 'PGS', 'GS', 'TS', 'ThS', 'CN', 'QNCN', 'Nhà báo',
]

function normalizeVn(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
}

/** Gom khoảng trắng + bỏ dấu chấm dẫn (".....") trong dòng mục lục. */
function cleanLine(raw: string): string {
  return raw
    .replace(/[.…·•]{2,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const SECTION_KEYS = KNOWN_SECTIONS.map((s) => normalizeVn(s).replace(/[^a-z ]/g, '').trim())

function hasTrailingPage(line: string): boolean {
  return /(?:^|\s)(\d{1,4})\s*$/.test(line)
}

/** Dòng là tiêu đề chuyên mục: không có số trang cuối, khớp tên đã biết hoặc viết hoa & ngắn. */
function isSectionHeader(line: string): boolean {
  if (hasTrailingPage(line)) return false
  const norm = normalizeVn(line).replace(/[^a-z ]/g, '').trim()
  if (!norm) return false
  if (SECTION_KEYS.some((key) => norm === key || norm.includes(key))) return true

  const letters = line.replace(/[^A-Za-zÀ-ỹ]/g, '')
  if (letters.length < 4 || line.length > 45) return false
  const upper = letters.replace(/[^A-ZÀ-Ỹ]/g, '')
  return upper.length / letters.length > 0.7
}

/** Tách phần tác giả (nếu có) khỏi tên bài trong một entry mục lục đã gộp. */
function splitTitleAuthor(entryText: string): { title: string; authorsText: string } {
  const text = entryText.replace(/^\s*\d{1,3}\s*[.)]\s*/, '').trim() // bỏ số thứ tự đầu dòng

  let splitAt = -1
  for (const token of AUTHOR_LEAD_TOKENS) {
    const idx = text.indexOf(token)
    // token phải nằm sau một phần tên bài (>3 ký tự) mới coi là ranh giới tác giả
    if (idx > 3 && (splitAt === -1 || idx < splitAt)) splitAt = idx
  }

  if (splitAt === -1) {
    return { title: stripTrailingPunct(text), authorsText: '' }
  }
  return {
    title: stripTrailingPunct(text.slice(0, splitAt)),
    authorsText: stripTrailingPunct(text.slice(splitAt)),
  }
}

function stripTrailingPunct(raw: string): string {
  return raw.replace(/[\s.,;:\-/]+$/g, '').trim()
}

function assessConfidence(title: string, authorsText: string): 'high' | 'low' {
  if (title.length < 8) return 'low'
  if (!authorsText) return 'low'
  return 'high'
}

/**
 * Parse text mục lục thô thành danh sách draft bài báo.
 * Quy ước: dòng có SỐ TRANG ở cuối = kết thúc một entry; các dòng trước đó (không phải
 * header) là phần tên bài bị xuống dòng → gộp vào entry.
 */
export function parseTocText(rawText: string): DraftArticle[] {
  const allLines = rawText.split(/\r?\n/).map(cleanLine).filter(Boolean)

  // Bắt đầu sau dòng "MỤC LỤC" nếu có (bỏ phần măng sét/thông tin tòa soạn phía trên).
  const mucLucIdx = allLines.findIndex((l) => {
    const n = normalizeVn(l).replace(/[^a-z ]/g, '').trim()
    return n === 'muc luc' || n.startsWith('muc luc ')
  })
  const lines = mucLucIdx >= 0 ? allLines.slice(mucLucIdx + 1) : allLines

  const articles: DraftArticle[] = []
  let section = ''
  let buffer: string[] = []

  for (const line of lines) {
    if (isSectionHeader(line)) {
      section = cleanLine(line)
      buffer = []
      continue
    }

    const pageMatch = line.match(/^(.*?)(?:\s|^)(\d{1,4})\s*$/)
    if (pageMatch) {
      const pageStart = parseInt(pageMatch[2], 10)
      const textBeforePage = pageMatch[1].trim()
      const entryText = [...buffer, textBeforePage].join(' ').trim()
      buffer = []

      if (!entryText || pageStart < 1 || pageStart > 2000) continue
      const { title, authorsText } = splitTitleAuthor(entryText)
      if (!title) continue

      articles.push({
        title,
        authorsText,
        section,
        pageStart,
        confidence: assessConfidence(title, authorsText),
      })
      continue
    }

    // Dòng không có số trang → phần tên bài bị xuống dòng, giữ lại cho entry kế tiếp.
    buffer.push(line)
  }

  return articles
}

// ─── IO: trích text trang mục lục ────────────────────────────────────────────

function pageRange(count: number): number[] {
  return Array.from({ length: count }, (_, i) => i)
}

/** Cắt `tocPages` trang đầu thành sub-PDF (giảm thời gian OCR). */
async function buildTocSubPdf(srcPdf: PDFDocument, tocPages: number): Promise<Uint8Array> {
  const count = Math.min(tocPages, srcPdf.getPageCount())
  const sub = await PDFDocument.create()
  const copied = await sub.copyPages(srcPdf, pageRange(count))
  copied.forEach((p) => sub.addPage(p))
  return sub.save()
}

/**
 * Trích danh sách draft bài báo từ trang mục lục của PDF số báo.
 * Ưu tiên text trực tiếp; nếu là rác (font TCVN3) thì OCR tiếng Việt vài trang đầu.
 */
export async function extractTocDraft(
  sourcePdfPath: string,
  options: { tocPages?: number } = {},
): Promise<TocExtractResult> {
  const tocPages = options.tocPages ?? 4
  const srcBytes = await fs.readFile(sourcePdfPath)
  const srcPdf = await PDFDocument.load(srcBytes)
  const totalPdfPages = srcPdf.getPageCount()

  const subBytes = await buildTocSubPdf(srcPdf, tocPages)

  let rawText = await extractPdfText(Buffer.from(subBytes))
  let engine: TocExtractResult['engine'] = 'pdf-parse'

  if (!looksLikeVietnameseProse(rawText)) {
    if (await isOcrAvailable()) {
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ntqs-toc-'))
      const tmpPath = path.join(tmpDir, 'toc.pdf')
      try {
        await fs.writeFile(tmpPath, subBytes)
        const ocrResult = await ocrPdfToText(tmpPath)
        if (ocrResult.text.trim()) {
          rawText = ocrResult.text
          engine = 'ocr'
        } else {
          engine = 'none'
        }
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
      }
    } else if (!rawText.trim()) {
      engine = 'none'
    }
  }

  return {
    rawText,
    engine,
    totalPdfPages,
    articles: parseTocText(rawText),
  }
}
