/**
 * journal-images-layout.service.ts
 *
 * Quản lý sidecar `images-layout.json` trong gói số: public/data/issues/<slug>/.
 *
 * Đây là NƠI LƯU quyết định của biên tập viên về ảnh (bật/tắt, thứ tự, chú thích, ảnh
 * đầu/cuối số) — TÁCH khỏi DB (DB dùng chung, tránh đổi schema) và SỐNG SÓT qua mỗi lần
 * rebuild corpus từ DB. buildIssueCorpus đọc file này để chèn ảnh vào corpus.json.
 */

import { promises as fs } from 'fs'
import path from 'path'
import sharp from 'sharp'

const ISSUES_DATA_DIR = path.join(process.cwd(), 'public', 'data', 'issues')
const LAYOUT_FILE = 'images-layout.json'

/** Ảnh minh họa trong một bài (ứng viên trích tự động hoặc BTV tải lên). */
export interface ArticleImage {
  /** Đường dẫn tương đối trong gói số, vd 'articles_img/<article-slug>/img-001.png'. */
  file: string
  caption?: string
  /** BTV bật thì mới đưa vào bản đọc/EPUB (mặc định false để tránh xuất bản logo/nhiễu). */
  enabled: boolean
}

export interface MatterImage {
  file: string
  caption?: string
}

export interface ImagesLayout {
  /** Ảnh trang đầu số (sau bìa). */
  frontMatter: MatterImage[]
  /** Ảnh trang cuối số. */
  backMatter: MatterImage[]
  /** Ảnh theo bài, khóa = slug bài (JournalArticle.slug). */
  articles: Record<string, { images: ArticleImage[] }>
}

function layoutPath(slug: string): string {
  return path.join(ISSUES_DATA_DIR, slug, LAYOUT_FILE)
}

export function emptyLayout(): ImagesLayout {
  return { frontMatter: [], backMatter: [], articles: {} }
}

export async function readImagesLayout(slug: string): Promise<ImagesLayout> {
  try {
    const raw = await fs.readFile(layoutPath(slug), 'utf-8')
    const parsed = JSON.parse(raw) as Partial<ImagesLayout>
    return {
      frontMatter: parsed.frontMatter ?? [],
      backMatter: parsed.backMatter ?? [],
      articles: parsed.articles ?? {},
    }
  } catch {
    return emptyLayout()
  }
}

export async function writeImagesLayout(slug: string, layout: ImagesLayout): Promise<void> {
  const dir = path.join(ISSUES_DATA_DIR, slug)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(layoutPath(slug), JSON.stringify(layout, null, 2), 'utf-8')
}

/**
 * Seed ảnh ứng viên cho một bài (mặc định enabled=false). Giữ nguyên quyết định cũ của BTV
 * nếu file đã có (không ghi đè caption/enabled đã chỉnh).
 */
export async function seedArticleImages(slug: string, articleSlug: string, files: string[]): Promise<void> {
  const layout = await readImagesLayout(slug)
  const existing = layout.articles[articleSlug]?.images ?? []
  const byFile = new Map(existing.map((img) => [img.file, img]))
  const merged: ArticleImage[] = files.map((file) => byFile.get(file) ?? { file, enabled: false })
  layout.articles[articleSlug] = { images: merged }
  await writeImagesLayout(slug, layout)
}

const IMG_EXT = /\.(png|jpe?g|webp)$/i

/**
 * Lưu một ảnh upload TRỰC TIẾP vào gói số (public/data/issues/<slug>/<subdir>/), chuẩn hoá
 * bằng sharp. Trả đường dẫn tương đối trong gói (dùng làm src corpus). Ảnh ĐẦU/CUỐI số và
 * ảnh BÀI do BTV tải lên đi qua đây (không dùng /uploads vì corpus/EPUB đọc theo gói).
 */
export async function savePackageImage(
  slug: string,
  subdir: string,
  file: File,
  baseName: string,
): Promise<string> {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) throw new Error('Ảnh phải là JPEG/PNG/WebP')
  if (file.size > 15 * 1024 * 1024) throw new Error('Ảnh quá lớn (tối đa 15MB)')

  const ext = (file.name.match(IMG_EXT)?.[1] ?? 'jpg').toLowerCase()
  const relDir = subdir.replace(/^\/+|\/+$/g, '')
  const absDir = path.join(ISSUES_DATA_DIR, slug, relDir)
  await fs.mkdir(absDir, { recursive: true })

  const fileName = `${baseName}.${ext === 'jpeg' ? 'jpg' : ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  const normalized = await sharp(buffer).rotate().resize({ width: 1600, withoutEnlargement: true }).toBuffer()
  await fs.writeFile(path.join(absDir, fileName), normalized)

  return path.join(relDir, fileName).replace(/\\/g, '/')
}
