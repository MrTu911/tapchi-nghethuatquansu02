/**
 * fix-youtube-video-ids.ts — một lần
 *
 * Làm sạch videoId của các video YouTube đã lưu lỗi (dính ?si=... từ link youtu.be),
 * khiến URL ảnh đại diện img.youtube.com/vi/<id>/... bị hỏng.
 *
 * Run: npx tsx --require dotenv/config prisma/fix-youtube-video-ids.ts
 */

import { PrismaClient } from '@prisma/client'
import 'dotenv/config'
import { resolveYouTubeId } from '../lib/youtube'

const db = new PrismaClient()

async function main() {
  const videos = await db.video.findMany({ where: { videoType: 'youtube' } })
  let fixed = 0

  for (const v of videos) {
    const clean = resolveYouTubeId(v.videoUrl, v.videoId)
    if (clean && clean !== v.videoId) {
      await db.video.update({ where: { id: v.id }, data: { videoId: clean } })
      console.log(`  ✓ ${v.title.slice(0, 40)} : "${v.videoId}" -> "${clean}"`)
      fixed++
    }
  }

  console.log(`\n📊 ${videos.length} video YouTube, đã sửa ${fixed}`)
  await db.$disconnect()
}

main().catch((e) => {
  console.error('❌ Lỗi:', e)
  process.exit(1)
})
