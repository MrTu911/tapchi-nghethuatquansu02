/**
 * set-issue-covers.ts
 *
 * Gán ảnh bìa cho các số tạp chí đã import: copy public/data/issues/<slug>/cover.jpg
 * sang public/uploads/issues/<slug>/cover.jpg và set Issue.coverImage = "issues/<slug>/cover.jpg".
 *
 * Vì sao copy sang /uploads: cả getSignedImageUrl (homepage) lẫn getFileUrl (trang chi tiết)
 * đều resolve path tương đối thành "/uploads/<path>". Lưu path tương đối → hiển thị đúng ở MỌI nơi.
 *
 * Idempotent. Run: npx tsx --require dotenv/config scripts/journal/set-issue-covers.ts
 */

import 'dotenv/config'
import { promises as fs } from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'

const PUBLIC_DIR = path.join(process.cwd(), 'public')

async function main(): Promise<void> {
  const issues = await prisma.issue.findMany({
    where: { slug: { not: null } },
    select: { id: true, slug: true },
  })

  let updated = 0
  let missing = 0
  for (const issue of issues) {
    const slug = issue.slug!
    const srcCover = path.join(PUBLIC_DIR, 'data', 'issues', slug, 'cover.jpg')
    try {
      await fs.access(srcCover)
    } catch {
      missing++
      console.log(`  ⚠ Không có cover.jpg cho ${slug}`)
      continue
    }

    const destDir = path.join(PUBLIC_DIR, 'uploads', 'issues', slug)
    const destCover = path.join(destDir, 'cover.jpg')
    await fs.mkdir(destDir, { recursive: true })
    await fs.copyFile(srcCover, destCover)

    const relativePath = `issues/${slug}/cover.jpg` // resolve -> /uploads/issues/<slug>/cover.jpg
    await prisma.issue.update({ where: { id: issue.id }, data: { coverImage: relativePath } })
    updated++
    console.log(`  ✓ ${slug} → coverImage = ${relativePath}`)
  }

  console.log(`\n✅ Đã gán bìa cho ${updated}/${issues.length} số${missing ? ` (thiếu cover: ${missing})` : ''}.`)
}

main()
  .catch((error) => {
    console.error('❌ Lỗi gán bìa số tạp chí:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
