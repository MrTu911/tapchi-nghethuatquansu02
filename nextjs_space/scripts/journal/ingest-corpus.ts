/**
 * ingest-corpus.ts
 *
 * Số hóa số báo cũ từ BẢN CHUẨN (tcvn3-extractor) qua CLI — chạy FULL pipeline:
 *   nhập CSDL (DRAFT) → sinh EPUB → đối chiếu trùng → xuất bản.
 *
 * Khác với `journal:import-corpus` (chỉ nhập CSDL). Yêu cầu: corpus.json (+ articles_pdf/,
 * cover tuỳ chọn) đã nằm sẵn ở public/data/issues/<slug>/.
 *
 * Run:
 *   npx tsx --require dotenv/config scripts/journal/ingest-corpus.ts so-7-2026
 */

import 'dotenv/config'
import { prisma } from '@/lib/prisma'
import { runCorpusIngest, getIngestStatus } from '@/lib/services/journal-issue-ingest.service'

async function main(): Promise<void> {
  const slug = process.argv.slice(2).find((a) => !a.startsWith('--'))
  if (!slug) {
    console.error('❌ Thiếu slug. Dùng: ingest-corpus.ts <slug>  (vd: so-7-2026)')
    process.exitCode = 1
    return
  }

  console.log(`▶ Số hóa từ bản chuẩn (corpus): ${slug}\n`)
  await runCorpusIngest(slug)

  const status = await getIngestStatus(slug)
  if (!status) {
    console.error('❌ Không đọc được tiến trình (status). Kiểm tra public/data/issues/' + slug)
    process.exitCode = 1
    return
  }

  if (status.status === 'done') {
    console.log(`✅ ${status.message}`)
    console.log(
      `   bài: ${status.totalArticles}` +
        `  | có toàn văn: ${status.extractedFromPdf}` +
        `  | thiếu toàn văn: ${status.lowQuality}`,
    )
    if (status.epubUrl) console.log(`   EPUB: ${status.epubUrl}`)
    if (status.libraryUrl) console.log(`   Thư viện: ${status.libraryUrl}`)
    if (status.duplicatesFlagged.length > 0) {
      console.log(`   ⚠ ${status.duplicatesFlagged.length} bài nghi trùng với CSDL:`)
      for (const d of status.duplicatesFlagged) {
        console.log(`      - ${d.title} (${d.severity}%)`)
      }
    }
  } else {
    console.error(`✗ Thất bại: ${status.message}`)
    for (const e of status.errors) console.error('   - ' + e)
    process.exitCode = 1
  }
}

main()
  .catch((error) => {
    console.error('❌ Lỗi số hóa từ corpus:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
