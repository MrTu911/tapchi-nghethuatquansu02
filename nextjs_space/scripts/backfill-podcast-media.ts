/**
 * backfill-podcast-media.ts — Tạp chí Nghệ thuật Quân sự Việt Nam
 *
 * Mục đích: gắn audio + ảnh bìa cho các bản ghi Podcast đang thiếu media
 * (audioUrl/coverImageUrl = null) khiến trang chủ không phát được và không có ảnh.
 *
 * An toàn: KHÔNG xóa bản ghi nào — chỉ UPDATE các record còn thiếu media.
 * Idempotent: bỏ qua record đã có audio; copy ảnh bìa chỉ khi chưa tồn tại.
 *
 * Nguồn media:
 *  - Audio: đã có sẵn trong public/uploads/podcasts/audio (file seed-*.m4a).
 *  - Ảnh bìa: copy từ ~/Downloads/Gemini_Generated_Image_*.png.
 *
 * Run: npx tsx --require dotenv/config scripts/backfill-podcast-media.ts
 */

import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import 'dotenv/config'

const db = new PrismaClient()

const PROJECT_ROOT = path.join(__dirname, '..')
const AUDIO_DIR = path.join(PROJECT_ROOT, 'public', 'uploads', 'podcasts', 'audio')
const COVER_DEST = path.join(PROJECT_ROOT, 'public', 'uploads', 'podcasts', 'covers')
const DOWNLOADS = '/home/kelinton/Downloads'

// Gán audio theo thứ tự hiển thị (displayOrder). Chọn file gần chủ đề nhất
// trong kho audio hiện có để đỡ lệch nội dung.
const AUDIO_BY_ORDER: Record<number, string> = {
  0: 'seed-1777010620590-Drone_v_AI_thay_i_chin_trng.m4a',          // Nghệ thuật tác chiến (drone/AI)
  1: 'seed-1777010620497-AI_d_bo_v_din_tp_s.m4a',                   // Chiến lược (AI dự báo, diễn tập)
  2: 'seed-1777010620289-Hu_cn_v_mch_mu_chin_tranh.m4a',           // Chiến dịch học
  3: 'seed-1777010620433-Mnh_lnh_sinh_t_di_na_giy.m4a',            // Chiến thuật (quyết định tốc độ)
  4: 'seed-1777010620399-Hu_cn_k_thut_Vit_Nam_2040.m4a',           // Lịch sử/tầm nhìn VN
  5: 'seed-1777010620824-How_Logistics_Staff_Work_Engineers_Military_Survival.m4a', // Hợp tác quốc tế
}

function listCoverSources(): string[] {
  if (!fs.existsSync(DOWNLOADS)) return []
  return fs
    .readdirSync(DOWNLOADS)
    .filter((f) => /^Gemini_Generated_Image_.*\.png$/i.test(f))
    .sort()
    .map((f) => path.join(DOWNLOADS, f))
}

/** Copy 1 ảnh bìa vào COVER_DEST nếu chưa có; trả về relative path từ /uploads. */
function ensureCover(srcPath: string): string | null {
  if (!fs.existsSync(srcPath)) return null
  fs.mkdirSync(COVER_DEST, { recursive: true })
  const destName = `seed-cover-${path.basename(srcPath)}`
  const destPath = path.join(COVER_DEST, destName)
  if (!fs.existsSync(destPath)) {
    fs.copyFileSync(srcPath, destPath)
  }
  return `podcasts/covers/${destName}`
}

async function main() {
  console.log('🎙️  Backfill podcast media — bắt đầu...\n')

  const records = await db.podcast.findMany({
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
  })
  console.log(`Tổng số podcast: ${records.length}`)

  const coverSources = listCoverSources()
  if (coverSources.length === 0) {
    console.warn('⚠  Không tìm thấy ảnh bìa nguồn trong Downloads — sẽ chỉ gắn audio.')
  }

  let updated = 0
  let skipped = 0

  for (let i = 0; i < records.length; i++) {
    const p = records[i]

    if (p.audioUrl && p.coverImageUrl) {
      console.log(`  ↩  Bỏ qua (đã có media): "${p.title.slice(0, 40)}"`)
      skipped++
      continue
    }

    const data: Record<string, unknown> = {}

    // --- Audio ---
    const audioFile = AUDIO_BY_ORDER[p.displayOrder] ?? AUDIO_BY_ORDER[i]
    if (!p.audioUrl && audioFile) {
      const audioAbs = path.join(AUDIO_DIR, audioFile)
      if (fs.existsSync(audioAbs)) {
        const relPath = `podcasts/audio/${audioFile}`
        data.audioPath = relPath
        data.audioUrl = `/uploads/${relPath}`
        data.fileSize = fs.statSync(audioAbs).size
        data.mimeType = 'audio/mp4'
      } else {
        console.warn(`  ⚠  Audio không tồn tại trên đĩa: ${audioFile}`)
      }
    }

    // --- Cover ---
    if (!p.coverImageUrl && coverSources.length > 0) {
      const src = coverSources[i % coverSources.length]
      const rel = ensureCover(src)
      if (rel) {
        data.coverImagePath = rel
        data.coverImageUrl = `/uploads/${rel}`
      }
    }

    if (Object.keys(data).length === 0) {
      console.warn(`  ⚠  Không có gì để cập nhật: "${p.title.slice(0, 40)}"`)
      skipped++
      continue
    }

    await db.podcast.update({ where: { id: p.id }, data })
    console.log(
      `  ✅ "${p.title.slice(0, 40)}" → audio=${data.audioUrl ?? '(giữ nguyên)'} cover=${data.coverImageUrl ?? '(giữ nguyên)'}`,
    )
    updated++
  }

  console.log(`\n🎉 Hoàn thành. Cập nhật ${updated}, bỏ qua ${skipped}.`)
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
