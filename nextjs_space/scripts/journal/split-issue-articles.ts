/**
 * split-issue-articles.ts (CLI)
 *
 * Wrapper gọi lib/services/journal-split.service.ts để tách PDF số báo thành PDF từng bài.
 * Logic lõi nằm ở service để dùng chung với orchestrator số hóa số báo cũ.
 *
 * Run:
 *   npx tsx --require dotenv/config scripts/journal/split-issue-articles.ts
 *   npx tsx --require dotenv/config scripts/journal/split-issue-articles.ts --replace
 *
 * Env:
 *   ISSUE_SLUG       — slug của Issue cần xử lý (default: so-1-231-2025)
 *   PDF_PAGE_OFFSET  — bù lệch trang PDF vs trang in (default: 0)
 *   SOURCE_PDF_PATH  — đường dẫn tuyệt đối tới file PDF gốc (override issue.pdfUrl)
 */

import 'dotenv/config'
import { prisma } from '@/lib/prisma'
import { splitIssueArticles } from '@/lib/services/journal-split.service'

const ISSUE_SLUG = process.env.ISSUE_SLUG ?? 'so-1-231-2025'
const PDF_PAGE_OFFSET = Number(process.env.PDF_PAGE_OFFSET ?? '0')
const SHOULD_REPLACE = process.argv.includes('--replace')
const SOURCE_PDF_OVERRIDE = process.env.SOURCE_PDF_PATH ?? undefined

async function main(): Promise<void> {
  console.log(`\n=== Tách PDF bài báo — Issue: ${ISSUE_SLUG} ===`)
  console.log(`PDF_PAGE_OFFSET: ${PDF_PAGE_OFFSET} | REPLACE: ${SHOULD_REPLACE}`)
  if (SOURCE_PDF_OVERRIDE) console.log(`SOURCE_PDF_OVERRIDE: ${SOURCE_PDF_OVERRIDE}`)
  console.log()

  const summary = await splitIssueArticles(ISSUE_SLUG, {
    pageOffset: PDF_PAGE_OFFSET,
    replace: SHOULD_REPLACE,
    sourcePdfOverride: SOURCE_PDF_OVERRIDE,
    onProgress: ({ index, total, title }) => console.log(`[${index}/${total}] ${title}`),
  })

  for (const detail of summary.details) {
    const icon = detail.status === 'done' ? '✓' : detail.status === 'skipped' ? '–' : '✗'
    console.log(`  ${icon} ${detail.title}${detail.message ? ` (${detail.message})` : ''}`)
  }

  console.log('\n=== Kết quả ===')
  console.log(`  Thành công: ${summary.done}`)
  console.log(`  Bỏ qua:    ${summary.skipped}`)
  console.log(`  Lỗi:       ${summary.errors}`)
  console.log(`  Tổng:      ${summary.total}\n`)
}

main()
  .catch((err) => {
    console.error('Fatal:', err instanceof Error ? err.message : err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
