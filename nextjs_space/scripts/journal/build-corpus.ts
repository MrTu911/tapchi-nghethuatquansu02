/**
 * build-corpus.ts
 *
 * Sinh "bản đọc số" (corpus.json + cover + PDF từng bài) cho Thư viện KindleReader
 * từ dữ liệu số hóa trong DB. Chạy thủ công hoặc batch; cùng lõi với nút dashboard
 * (lib/services/journal-corpus.service.ts).
 *
 * Run:
 *   ISSUE_SLUG=so-1-231-2025 npx tsx --require dotenv/config scripts/journal/build-corpus.ts
 *   npx tsx --require dotenv/config scripts/journal/build-corpus.ts so-1-231-2025
 *   npx tsx --require dotenv/config scripts/journal/build-corpus.ts so-1-231-2025 --ocr
 *
 * Env:
 *   ISSUE_SLUG — slug (hoặc id) của Issue cần tạo bản đọc. Cũng nhận qua argv.
 *   OCR=1      — bật OCR tiếng Việt cho PDF font cũ (hoặc dùng cờ --ocr). Chậm hơn nhiều.
 */

import 'dotenv/config'
import { prisma } from '@/lib/prisma'
import { buildIssueCorpus } from '@/lib/services/journal-corpus.service'
import { terminateOcr } from '@/lib/ocr/pdf-ocr'

const ISSUE_REF = process.env.ISSUE_SLUG ?? process.argv.slice(2).find((a) => !a.startsWith('--'))
const USE_OCR = process.env.OCR === '1' || process.argv.includes('--ocr')

async function main(): Promise<void> {
  if (!ISSUE_REF) {
    console.error('❌ Thiếu ISSUE_SLUG (đặt qua env ISSUE_SLUG hoặc tham số dòng lệnh).')
    process.exitCode = 1
    return
  }

  console.log(`▶ Tạo bản đọc số cho: ${ISSUE_REF}${USE_OCR ? ' (OCR bật)' : ''}`)
  const summary = await buildIssueCorpus(ISSUE_REF, { ocr: USE_OCR })

  console.log('✓ Hoàn tất.')
  console.log(`  slug:              ${summary.slug}`)
  console.log(`  tổng bài:          ${summary.totalArticles}`)
  console.log(`  đã tạo:            ${summary.generated}`)
  console.log(`  trích từ PDF:      ${summary.extractedFromPdf}`)
  console.log(`  lấy nhờ OCR:       ${summary.ocrApplied}`)
  console.log(`  text PDF kém (bỏ): ${summary.lowQualityText}`)
  console.log(`  cover.jpg:         ${summary.coverGenerated ? 'có' : 'không'}`)
  if (summary.lowQualityText > 0) {
    console.log('  ⚠ Một số PDF dùng font cũ (TCVN3) → không trích được toàn văn; reader hiển thị tóm tắt + nút Tải PDF.')
  }
  if (summary.skipped.length > 0) {
    console.log(`  bỏ qua (${summary.skipped.length}):`)
    for (const s of summary.skipped) console.log(`    - ${s.title} — ${s.reason}`)
  }
  console.log(`  → public/data/issues/${summary.slug}/`)
}

main()
  .catch((error) => {
    console.error('❌ Lỗi tạo bản đọc số:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await terminateOcr()
    await prisma.$disconnect()
  })
