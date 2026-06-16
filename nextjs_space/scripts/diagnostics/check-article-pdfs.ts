/**
 * Chẩn đoán độ phủ PDF gốc của bài báo trong CSDL.
 *
 * Đối chiếu 3 nguồn:
 *  - JournalArticle.articlePdfUrl   (kho bài báo số hoá / thư viện)
 *  - Article.pdfFile                (bài đã xuất bản từ submission)
 *  - Issue.pdfUrl                   (PDF toàn số)
 *
 * Với mỗi URL public dạng /data/... hoặc /uploads/..., kiểm tra file có
 * thật trên đĩa (public/<path>) hay không → phân biệt "có link nhưng mất file".
 *
 * Chạy: npx tsx --require dotenv/config scripts/diagnostics/check-article-pdfs.ts
 */
import { prisma } from '../../lib/db'
import { existsSync } from 'fs'
import { join } from 'path'

const PUBLIC_DIR = join(process.cwd(), 'public')

/** Map một public URL ("/data/..." | "/uploads/...") về đường dẫn file trên đĩa. */
function resolvePublicUrlToDisk(url: string): string | null {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return null // external
  const clean = url.split('?')[0].split('#')[0]
  if (clean.startsWith('/')) return join(PUBLIC_DIR, clean)
  return null
}

function diskFileExists(url: string | null | undefined): boolean | null {
  if (!url) return null
  const disk = resolvePublicUrlToDisk(url)
  if (!disk) return null // không map được (vd external/relative khác) -> không kết luận
  return existsSync(disk)
}

async function main() {
  // ---- 1. JournalArticle (kho thư viện số) ----
  const journalArticles = await prisma.journalArticle.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      articlePdfUrl: true,
      splitStatus: true,
      issue: { select: { slug: true, number: true, year: true, title: true } },
    },
    orderBy: [{ issue: { year: 'asc' } }, { pageStart: 'asc' }],
  })

  const jaTotal = journalArticles.length
  const jaNoUrl = journalArticles.filter((a) => !a.articlePdfUrl)
  const jaWithUrl = journalArticles.filter((a) => !!a.articlePdfUrl)
  const jaMissingFile = jaWithUrl.filter((a) => diskFileExists(a.articlePdfUrl) === false)
  const jaOkFile = jaWithUrl.filter((a) => diskFileExists(a.articlePdfUrl) === true)

  // gom theo số
  const byIssue = new Map<string, { name: string; total: number; ok: number; noUrl: number; missing: number }>()
  for (const a of journalArticles) {
    const key = a.issue?.slug ?? '(no-issue)'
    const name = a.issue ? `${a.issue.slug} (Số ${a.issue.number}/${a.issue.year})` : '(no-issue)'
    const row = byIssue.get(key) ?? { name, total: 0, ok: 0, noUrl: 0, missing: 0 }
    row.total++
    if (!a.articlePdfUrl) row.noUrl++
    else if (diskFileExists(a.articlePdfUrl) === false) row.missing++
    else row.ok++
    byIssue.set(key, row)
  }

  // ---- 2. Article (bài xuất bản từ submission) ----
  const articles = await prisma.article.findMany({
    select: { id: true, pdfFile: true, publishedAt: true, submission: { select: { title: true } } },
  })
  const artTotal = articles.length
  const artNoPdf = articles.filter((a) => !a.pdfFile)
  const artWithPdf = articles.filter((a) => !!a.pdfFile)
  const artMissingFile = artWithPdf.filter((a) => diskFileExists(a.pdfFile) === false)

  // ---- 3. Issue (PDF toàn số) ----
  const issues = await prisma.issue.findMany({
    select: { id: true, slug: true, number: true, year: true, pdfUrl: true },
    orderBy: [{ year: 'asc' }, { number: 'asc' }],
  })
  const issTotal = issues.length
  const issNoPdf = issues.filter((i) => !i.pdfUrl)

  // ================= REPORT =================
  console.log('\n========================================')
  console.log('   ĐỘ PHỦ PDF GỐC CỦA BÀI BÁO TRONG CSDL')
  console.log('========================================\n')

  console.log('### 1) JournalArticle (Kho/Thư viện số) ###')
  console.log(`Tổng số bài            : ${jaTotal}`)
  console.log(`  - Có articlePdfUrl   : ${jaWithUrl.length}`)
  console.log(`      • file tồn tại   : ${jaOkFile.length}`)
  console.log(`      • file MẤT (404) : ${jaMissingFile.length}`)
  console.log(`  - KHÔNG có pdf url    : ${jaNoUrl.length}`)

  console.log('\n  Phân theo số tạp chí:')
  for (const [, r] of byIssue) {
    const flag = r.noUrl + r.missing > 0 ? '  ⚠' : ''
    console.log(
      `   - ${r.name.padEnd(34)} total=${String(r.total).padStart(3)}  ok=${String(r.ok).padStart(3)}  noUrl=${String(r.noUrl).padStart(3)}  missingFile=${String(r.missing).padStart(3)}${flag}`,
    )
  }

  if (jaNoUrl.length > 0) {
    console.log(`\n  ▸ Bài CHƯA có articlePdfUrl (tối đa 40):`)
    for (const a of jaNoUrl.slice(0, 40)) {
      console.log(`     [${a.issue?.slug}] ${a.title.slice(0, 70)}`)
    }
    if (jaNoUrl.length > 40) console.log(`     ... và ${jaNoUrl.length - 40} bài nữa`)
  }

  if (jaMissingFile.length > 0) {
    console.log(`\n  ▸ Bài CÓ url nhưng MẤT file trên đĩa (tối đa 40):`)
    for (const a of jaMissingFile.slice(0, 40)) {
      console.log(`     [${a.issue?.slug}] ${a.articlePdfUrl}`)
    }
    if (jaMissingFile.length > 40) console.log(`     ... và ${jaMissingFile.length - 40} bài nữa`)
  }

  console.log('\n### 2) Article (bài xuất bản từ submission) ###')
  console.log(`Tổng số bài            : ${artTotal}`)
  console.log(`  - Có pdfFile         : ${artWithPdf.length}`)
  console.log(`      • file MẤT       : ${artMissingFile.length}`)
  console.log(`  - KHÔNG có pdfFile    : ${artNoPdf.length}`)

  console.log('\n### 3) Issue (PDF toàn số) ###')
  console.log(`Tổng số                : ${issTotal}`)
  console.log(`  - KHÔNG có pdfUrl     : ${issNoPdf.length}`)
  for (const i of issNoPdf) {
    console.log(`     [${i.slug}] Số ${i.number}/${i.year}`)
  }

  console.log('\n========================================')
  console.log('TÓM TẮT:')
  const jaProblem = jaNoUrl.length + jaMissingFile.length
  console.log(`  JournalArticle thiếu PDF khả dụng: ${jaProblem}/${jaTotal}`)
  console.log(`  Article thiếu PDF                : ${artNoPdf.length + artMissingFile.length}/${artTotal}`)
  console.log('========================================\n')

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
