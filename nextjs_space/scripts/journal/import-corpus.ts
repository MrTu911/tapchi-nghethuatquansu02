/**
 * import-corpus.ts
 *
 * Nhập "bản đọc số" (public/data/issues/<slug>/corpus.json) vào CSDL để khai thác
 * dữ liệu tạp chí cũ — phục vụ kiểm tra đạo văn / trùng lặp. Toàn văn được lưu vào
 * JournalArticle.contentText. Idempotent: chạy lại an toàn (upsert).
 *
 * Run:
 *   npx tsx --require dotenv/config scripts/journal/import-corpus.ts so-2-2026
 *   npx tsx --require dotenv/config scripts/journal/import-corpus.ts --all
 */

import 'dotenv/config'
import { prisma } from '@/lib/prisma'
import {
  importIssueCorpusBySlug,
  listCorpusSlugs,
  type CorpusImportSummary,
} from '@/lib/services/journal-corpus-import.service'

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const importAll = args.includes('--all')
  const slugArgs = args.filter((a) => !a.startsWith('--'))

  let slugs: string[]
  if (importAll) {
    slugs = await listCorpusSlugs()
  } else if (slugArgs.length > 0) {
    slugs = slugArgs
  } else {
    console.error('❌ Thiếu tham số. Dùng: import-corpus.ts <slug> [<slug>...] | --all')
    process.exitCode = 1
    return
  }

  if (slugs.length === 0) {
    console.log('Không tìm thấy số nào có corpus.json để nhập.')
    return
  }

  console.log(`▶ Nhập ${slugs.length} số vào CSDL:\n`)

  const summaries: CorpusImportSummary[] = []
  for (const slug of slugs) {
    try {
      const summary = await importIssueCorpusBySlug(slug)
      summaries.push(summary)
      console.log(
        `✓ ${summary.slug.padEnd(16)} "${summary.issueName}"\n` +
          `    bài: ${summary.articlesUpserted}/${summary.totalArticles}` +
          `  | có toàn văn: ${summary.withFullText}` +
          `  | thiếu toàn văn: ${summary.withoutFullText}` +
          `  | tác giả: ${summary.authorsCreated} (liên kết User: ${summary.authorsLinkedToUser})`,
      )
    } catch (error) {
      console.error(`✗ ${slug}: ${(error as Error).message}`)
    }
  }

  const totalArticles = summaries.reduce((s, x) => s + x.articlesUpserted, 0)
  const totalFullText = summaries.reduce((s, x) => s + x.withFullText, 0)
  console.log(
    `\n✅ Hoàn tất: ${summaries.length}/${slugs.length} số, ` +
      `${totalArticles} bài (${totalFullText} bài có toàn văn để kiểm tra đạo văn).`,
  )
}

main()
  .catch((error) => {
    console.error('❌ Lỗi nhập corpus:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
