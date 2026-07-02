/**
 * journal-article-images.service.ts
 *
 * Trích ẢNH NHÚNG trong PDF từng bài để đưa vào bản đọc số + EPUB.
 * Dùng `pdfimages` (poppler-utils, đã có sẵn cho OCR) → chạy offline (air-gap);
 * `sharp` chuẩn hoá + LỌC ảnh quá nhỏ/logo/nhiễu.
 *
 * Ảnh trích ra chỉ là ỨNG VIÊN (enabled=false trong images-layout.json) — biên tập viên
 * bật/chú thích ở bước review trước khi xuất bản, tránh xuất bản logo/hoa văn trang trí.
 */

import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import sharp from 'sharp'
import { prisma } from '@/lib/prisma'
import { resolveStoredFileToAbsolute } from '@/lib/storage-path'
import { seedArticleImages } from '@/lib/services/journal-images-layout.service'

const execFileAsync = promisify(execFile)
const ISSUES_DATA_DIR = path.join(process.cwd(), 'public', 'data', 'issues')

// Ngưỡng lọc: ảnh nhỏ hơn coi là logo/icon/nhiễu → bỏ.
const MIN_WIDTH = 200
const MIN_HEIGHT = 200
const MIN_AREA = 300 * 300
const MAX_IMAGES_PER_ARTICLE = 12

let pdfimagesChecked = false
let pdfimagesAvailable = false

async function isPdfimagesAvailable(): Promise<boolean> {
  if (pdfimagesChecked) return pdfimagesAvailable
  pdfimagesChecked = true
  try {
    await execFileAsync('pdfimages', ['-v'])
    pdfimagesAvailable = true
  } catch {
    pdfimagesAvailable = false
  }
  return pdfimagesAvailable
}

/**
 * Trích ảnh nhúng từ một PDF bài → ghi PNG đã chuẩn hoá vào `outDir`.
 * Trả về danh sách đường dẫn tương đối (từ thư mục gói số) đã ghi.
 */
export async function extractArticleImages(
  articlePdfAbsPath: string,
  issueDir: string,
  articleSlug: string,
): Promise<string[]> {
  if (!(await isPdfimagesAvailable())) return []

  const relDir = path.join('articles_img', articleSlug)
  const absDir = path.join(issueDir, relDir)
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ntqs-img-'))

  try {
    // pdfimages -png: xuất tất cả ảnh raster ra <prefix>-NNN.png
    await execFileAsync('pdfimages', ['-png', articlePdfAbsPath, path.join(tmpDir, 'raw')], {
      maxBuffer: 40 * 1024 * 1024,
    }).catch(() => {})

    const rawFiles = (await fs.readdir(tmpDir).catch(() => []))
      .filter((f) => f.toLowerCase().endsWith('.png'))
      .sort()
    if (rawFiles.length === 0) return []

    await fs.mkdir(absDir, { recursive: true })
    const kept: string[] = []
    let idx = 0
    for (const raw of rawFiles) {
      if (kept.length >= MAX_IMAGES_PER_ARTICLE) break
      const rawAbs = path.join(tmpDir, raw)
      try {
        const meta = await sharp(rawAbs).metadata()
        const w = meta.width ?? 0
        const h = meta.height ?? 0
        // Lọc ảnh quá nhỏ (logo/icon) hoặc dải mỏng (đường kẻ/hoa văn).
        if (w < MIN_WIDTH || h < MIN_HEIGHT || w * h < MIN_AREA) continue
        idx++
        const outName = `img-${String(idx).padStart(3, '0')}.png`
        await sharp(rawAbs)
          .resize({ width: 1400, withoutEnlargement: true })
          .png({ quality: 85 })
          .toFile(path.join(absDir, outName))
        kept.push(path.join(relDir, outName).replace(/\\/g, '/'))
      } catch {
        /* bỏ ảnh lỗi */
      }
    }
    return kept
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  }
}

/**
 * Trích ảnh cho TẤT CẢ bài của một số + seed vào images-layout.json (enabled=false).
 * Gọi trong pipeline số hóa (phase EXTRACT_IMAGES). Không ném lỗi ra ngoài luồng chính.
 */
export async function extractIssueArticleImages(slug: string, issueId: string): Promise<number> {
  if (!(await isPdfimagesAvailable())) return 0
  const issueDir = path.join(ISSUES_DATA_DIR, slug)
  const articles = await prisma.journalArticle.findMany({
    where: { issueId, articlePdfUrl: { not: null } },
    select: { slug: true, articlePdfUrl: true },
    orderBy: { pageStart: 'asc' },
  })

  let totalImages = 0
  for (const article of articles) {
    if (!article.slug || !article.articlePdfUrl) continue
    try {
      const pdfAbs = resolveStoredFileToAbsolute(article.articlePdfUrl)
      const files = await extractArticleImages(pdfAbs, issueDir, article.slug)
      if (files.length > 0) {
        await seedArticleImages(slug, article.slug, files)
        totalImages += files.length
      }
    } catch {
      /* bỏ bài lỗi, không chặn pipeline */
    }
  }
  return totalImages
}
