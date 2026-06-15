/**
 * create-author-accounts.ts
 *
 * Tạo tài khoản User (role AUTHOR, đăng nhập được) cho mọi tác giả trong CSDL
 * (JournalArticleAuthor) và liên kết JournalArticleAuthor.userId. Phục vụ demo.
 *
 * Xuất danh sách (KHÔNG kèm mật khẩu) ra prisma/manual/journal-author-accounts.csv
 * để vận hành tra cứu. Mật khẩu chung in ra console.
 *
 * Run:
 *   npx tsx --require dotenv/config scripts/journal/create-author-accounts.ts
 *   AUTHOR_DEMO_PASSWORD='Matkhau@2026' npx tsx --require dotenv/config scripts/journal/create-author-accounts.ts
 */

import 'dotenv/config'
import { promises as fs } from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { createDemoAccountsForJournalAuthors } from '@/lib/services/journal-author-account.service'

const OUTPUT_CSV = path.join(process.cwd(), 'prisma', 'manual', 'journal-author-accounts.csv')

async function main(): Promise<void> {
  const password = process.env.AUTHOR_DEMO_PASSWORD || undefined

  console.log('▶ Tạo tài khoản cho các tác giả trong CSDL...')
  const summary = await createDemoAccountsForJournalAuthors(password)

  await writeCsv(summary.records)

  console.log('\n✅ Hoàn tất.')
  console.log(`  Tác giả duy nhất:        ${summary.uniqueAuthors}`)
  console.log(`  Tài khoản tạo/cập nhật:  ${summary.accountsUpserted}`)
  console.log(`  Bản ghi tác giả liên kết: ${summary.authorLinksUpdated}`)
  console.log(`  Mật khẩu demo (chung):   ${summary.password}`)
  console.log(`  Danh sách (không mật khẩu): ${OUTPUT_CSV}`)

  console.log('\n  Ví dụ đăng nhập (5 tài khoản đầu):')
  for (const record of summary.records.slice(0, 5)) {
    console.log(`    ${record.email}  —  ${record.fullName} (${record.articleCount} bài)`)
  }
}

async function writeCsv(records: { fullName: string; email: string; rank: string | null; academicDegree: string | null; org: string | null; articleCount: number }[]): Promise<void> {
  const header = 'fullName,email,rank,degree,org,articleCount'
  const lines = records.map((r) =>
    [r.fullName, r.email, r.rank ?? '', r.academicDegree ?? '', r.org ?? '', r.articleCount]
      .map(csvCell)
      .join(','),
  )
  await fs.mkdir(path.dirname(OUTPUT_CSV), { recursive: true })
  await fs.writeFile(OUTPUT_CSV, [header, ...lines].join('\n') + '\n', 'utf-8')
}

function csvCell(value: string | number): string {
  const str = String(value)
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

main()
  .catch((error) => {
    console.error('❌ Lỗi tạo tài khoản tác giả:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
