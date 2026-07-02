/**
 * cleanup-youtube-videos.ts — Tạp chí Nghệ thuật Quân sự Việt Nam
 *
 * Dọn các bản ghi Video KHÔNG phải video upload nội bộ (LAN): videoType ∈
 * {youtube, vimeo, embed}. Hệ thống chạy air-gap LAN nên các video này không
 * phát/không hiện thumbnail được (dữ liệu hỏng, phần lớn là demo cũ như Rickroll,
 * Gangnam từ seed-news-videos). Cột videoType vẫn được giữ trong schema cho tương thích.
 *
 * An toàn:
 * - Mặc định chạy DRY-RUN: chỉ in danh sách sẽ xóa, KHÔNG xóa.
 * - Thêm cờ --apply (hoặc --yes) để thực sự xóa.
 * - KHÔNG đụng tới video upload nội bộ (videoType = 'upload').
 *
 * Run (xem trước):  npm run db:cleanup-youtube
 * Run (xóa thật):   npm run db:cleanup-youtube -- --apply
 */

import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const db = new PrismaClient()

const NON_LAN_TYPES = ['youtube', 'vimeo', 'embed']

async function main() {
  const apply = process.argv.includes('--apply') || process.argv.includes('--yes')

  const targets = await db.video.findMany({
    where: { videoType: { in: NON_LAN_TYPES } },
    select: { id: true, title: true, videoType: true, videoUrl: true },
    orderBy: { createdAt: 'asc' },
  })

  if (targets.length === 0) {
    console.log('✅ Không có video YouTube/Vimeo/embed nào — dữ liệu đã sạch (chỉ còn video LAN).')
    return
  }

  console.log(`Tìm thấy ${targets.length} video KHÔNG phải LAN (sẽ ${apply ? 'XÓA' : 'xem trước'}):`)
  for (const v of targets) {
    console.log(`  • [${v.videoType}] ${v.title} — ${v.videoUrl}`)
  }

  if (!apply) {
    console.log('\nℹ️  Đây là DRY-RUN. Chạy lại với "-- --apply" để thực sự xóa.')
    return
  }

  const result = await db.video.deleteMany({
    where: { videoType: { in: NON_LAN_TYPES } },
  })
  console.log(`\n🗑️  Đã xóa ${result.count} bản ghi video không phải LAN.`)
}

main()
  .catch((e) => {
    console.error('❌ Dọn dữ liệu thất bại:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
