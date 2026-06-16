/**
 * build-issue-pdfs.ts
 *
 * Tạo PDF TOÀN SỐ cho từng Issue bằng cách gộp PDF của tất cả bài báo trong số
 * (theo thứ tự trang in), kèm trang bìa ở đầu. Sau đó cập nhật `Issue.pdfUrl`.
 *
 * Nguồn: `JournalArticle.articlePdfUrl` (đã đảm bảo có file nhờ journal:rebuild-pdfs).
 * Bìa: `Issue.coverImage` (vd "issues/<slug>/cover.jpg" → public/uploads/...).
 *
 * Lưu file: `public/uploads/issues/<slug>/full-issue.pdf`
 * DB: `Issue.pdfUrl = "issues/<slug>/full-issue.pdf"` (đi qua getFileUrl như coverImage
 *     → /uploads/issues/<slug>/full-issue.pdf ở mọi consumer).
 *
 * Idempotent: bỏ qua số đã có pdfUrl + file tồn tại, trừ khi --replace.
 *
 * Run:
 *   npx tsx --require dotenv/config scripts/journal/build-issue-pdfs.ts
 *   ISSUE_SLUG=so-01-2026 npx tsx --require dotenv/config scripts/journal/build-issue-pdfs.ts
 *   ... --replace
 *   ... --dry-run
 */
import { prisma } from '../../lib/db'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import * as fs from 'node:fs'
import * as path from 'node:path'

const PUBLIC_DIR = path.join(process.cwd(), 'public')
const REPLACE = process.argv.includes('--replace')
const DRY_RUN = process.argv.includes('--dry-run')
const ISSUE_FILTER = process.env.ISSUE_SLUG?.trim() || null

// A4 tính bằng point (đơn vị mặc định của pdf-lib)
const A4_W = 595.28
const A4_H = 841.89

function resolvePublicToDisk(url: string | null | undefined): string | null {
  if (!url) return null
  const clean = url.replace(/^\/+/, '').split('?')[0]
  // coverImage lưu dạng tương đối "issues/..." → thực tế ở public/uploads/...
  if (clean.startsWith('uploads/')) return path.join(PUBLIC_DIR, clean)
  if (clean.startsWith('data/')) return path.join(PUBLIC_DIR, clean)
  if (clean.startsWith('issues/')) return path.join(PUBLIC_DIR, 'uploads', clean)
  return path.join(PUBLIC_DIR, clean)
}

/** Thêm trang bìa: ảnh cover căn giữa trên nền trắng A4. */
async function addCoverPage(merged: PDFDocument, coverDiskPath: string | null): Promise<boolean> {
  if (!coverDiskPath || !fs.existsSync(coverDiskPath)) return false
  try {
    const bytes = fs.readFileSync(coverDiskPath)
    const lower = coverDiskPath.toLowerCase()
    const img = lower.endsWith('.png') ? await merged.embedPng(bytes) : await merged.embedJpg(bytes)
    const page = merged.addPage([A4_W, A4_H])
    const scale = Math.min(A4_W / img.width, A4_H / img.height)
    const w = img.width * scale
    const h = img.height * scale
    page.drawImage(img, { x: (A4_W - w) / 2, y: (A4_H - h) / 2, width: w, height: h })
    return true
  } catch (err) {
    console.warn(`  ⚠ Không nhúng được bìa (${path.basename(coverDiskPath)}): ${(err as Error).message}`)
    return false
  }
}

interface IssueRow {
  id: string
  slug: string | null
  number: number
  year: number
  title: string | null
  coverImage: string | null
  pdfUrl: string | null
}

async function buildOneIssue(issue: IssueRow): Promise<{ ok: boolean; pages: number; merged: number; missing: number; reason?: string }> {
  const slug = issue.slug!
  const articles = await prisma.journalArticle.findMany({
    where: { issueId: issue.id, articlePdfUrl: { not: null } },
    select: { articlePdfUrl: true, title: true, pageStart: true, pageEnd: true },
    orderBy: [{ pageStart: 'asc' }, { pageEnd: 'asc' }],
  })
  if (articles.length === 0) return { ok: false, pages: 0, merged: 0, missing: 0, reason: 'Không có bài có PDF' }

  const merged = await PDFDocument.create()
  const font = await merged.embedFont(StandardFonts.Helvetica)
  merged.setTitle(issue.title || `Tạp chí NTQS — Số ${issue.number}/${issue.year}`)
  merged.setCreator('Tạp chí Nghệ thuật Quân sự Việt Nam')

  // Trang bìa
  await addCoverPage(merged, resolvePublicToDisk(issue.coverImage))

  let mergedCount = 0
  let missing = 0
  for (const a of articles) {
    const disk = resolvePublicToDisk(a.articlePdfUrl)
    if (!disk || !fs.existsSync(disk)) {
      missing++
      console.warn(`  ⚠ Thiếu file bài: ${a.articlePdfUrl}`)
      continue
    }
    try {
      const srcBytes = fs.readFileSync(disk)
      const src = await PDFDocument.load(srcBytes, { ignoreEncryption: true })
      const indices = src.getPageIndices()
      const copied = await merged.copyPages(src, indices)
      copied.forEach((p) => merged.addPage(p))
      mergedCount++
    } catch (err) {
      missing++
      console.warn(`  ⚠ Lỗi nạp PDF bài "${a.title.slice(0, 40)}": ${(err as Error).message}`)
    }
  }

  if (merged.getPageCount() === 0) return { ok: false, pages: 0, merged: 0, missing, reason: 'Không gộp được trang nào' }

  // Footer số trang ở cuối mỗi trang (nhẹ, không che nội dung)
  const total = merged.getPageCount()
  merged.getPages().forEach((p, i) => {
    p.drawText(`${i + 1}/${total}`, { x: p.getWidth() - 48, y: 16, size: 8, font, color: rgb(0.5, 0.5, 0.5) })
  })

  const relPath = `issues/${slug}/full-issue.pdf`
  const diskOut = path.join(PUBLIC_DIR, 'uploads', relPath)
  if (!DRY_RUN) {
    fs.mkdirSync(path.dirname(diskOut), { recursive: true })
    const out = await merged.save()
    fs.writeFileSync(diskOut, out)
    await prisma.issue.update({ where: { id: issue.id }, data: { pdfUrl: relPath } })
  }
  return { ok: true, pages: total, merged: mergedCount, missing }
}

async function main() {
  console.log(`▶ Tạo PDF toàn số${ISSUE_FILTER ? ` (lọc: ${ISSUE_FILTER})` : ''}${DRY_RUN ? ' [DRY-RUN]' : ''}${REPLACE ? ' [REPLACE]' : ''}\n`)

  const issues = (await prisma.issue.findMany({
    where: {
      slug: { not: null },
      ...(ISSUE_FILTER ? { slug: ISSUE_FILTER } : {}),
      journalArticles: { some: {} },
    },
    select: { id: true, slug: true, number: true, year: true, title: true, coverImage: true, pdfUrl: true },
    orderBy: [{ year: 'asc' }, { number: 'asc' }],
  })) as IssueRow[]

  if (issues.length === 0) {
    console.log('Không có số nào phù hợp (cần có slug + có bài báo).')
    await prisma.$disconnect()
    return
  }

  let done = 0
  let skipped = 0
  const failures: { slug: string; reason: string }[] = []

  for (const issue of issues) {
    const relPath = `issues/${issue.slug}/full-issue.pdf`
    const diskOut = path.join(PUBLIC_DIR, 'uploads', relPath)
    if (issue.pdfUrl && fs.existsSync(diskOut) && !REPLACE) {
      skipped++
      continue
    }

    try {
      const r = await buildOneIssue(issue)
      if (r.ok) {
        done++
        console.log(
          `  ✓ ${(issue.slug ?? '').padEnd(14)} Số ${issue.number}/${issue.year}  → ${r.pages} trang (gộp ${r.merged} bài${r.missing ? `, thiếu ${r.missing}` : ''})`,
        )
      } else {
        failures.push({ slug: issue.slug ?? issue.id, reason: r.reason ?? 'unknown' })
      }
    } catch (err) {
      failures.push({ slug: issue.slug ?? issue.id, reason: (err as Error).message })
    }
  }

  console.log('\n========================================')
  console.log(`Tạo thành công : ${done}`)
  console.log(`Bỏ qua (đã có) : ${skipped}`)
  console.log(`Lỗi            : ${failures.length}`)
  failures.forEach((f) => console.log(`  ✗ ${f.slug} — ${f.reason}`))
  console.log('========================================\n')

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
