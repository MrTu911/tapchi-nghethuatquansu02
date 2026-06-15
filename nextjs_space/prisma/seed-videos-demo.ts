/**
 * seed-videos-demo.ts — Tạp chí Nghệ thuật Quân sự Việt Nam
 *
 * Seed video demo từ file thật trong public/uploads/videos/video/.
 * Idempotent — upsert by videoUrl, KHÔNG xóa dữ liệu cũ.
 *
 * Run: npx tsx --require dotenv/config prisma/seed-videos-demo.ts
 */

import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const db = new PrismaClient()

type VideoSeed = {
  title: string
  description?: string
  videoType: 'upload'
  videoUrl: string
  cloudStoragePath: string
  category?: string
  tags: string[]
  isFeatured: boolean
  isActive: boolean
  displayOrder: number
  views: number
}

// Tất cả file nằm trong public/uploads/videos/video/
// videoUrl = cloudStoragePath = đường dẫn public browser có thể truy cập
const videoSeeds: VideoSeed[] = [
  {
    title: 'Giới thiệu Học viện Quốc phòng',
    description: 'Video giới thiệu tổng quan về Học viện Quốc phòng — lịch sử hình thành, sứ mệnh đào tạo và nghiên cứu nghệ thuật quân sự.',
    videoType: 'upload',
    videoUrl: '/uploads/videos/video/gioi-thieu-hoc-vien-quoc-phong.mp4',
    cloudStoragePath: '/uploads/videos/video/gioi-thieu-hoc-vien-quoc-phong.mp4',
    category: 'giới thiệu',
    tags: ['Học viện Quốc phòng', 'giới thiệu', 'HVQPh'],
    isFeatured: true,
    isActive: true,
    displayOrder: 1,
    views: 1240,
  },
  {
    title: 'Khúc ca Học viện Quốc phòng Anh hùng',
    description: 'Bài ca truyền thống về tinh thần anh hùng của Học viện Quốc phòng qua các thế hệ.',
    videoType: 'upload',
    videoUrl: '/uploads/videos/video/khuc-ca-hoc-vien-quoc-phong.mp4',
    cloudStoragePath: '/uploads/videos/video/khuc-ca-hoc-vien-quoc-phong.mp4',
    category: 'văn hóa',
    tags: ['Học viện Quốc phòng', 'bài ca', 'truyền thống'],
    isFeatured: true,
    isActive: true,
    displayOrder: 2,
    views: 2380,
  },
  {
    title: 'Khoa học Quân sự — Nghiên cứu phụng sự',
    description: 'Học viện Quốc phòng: nghiên cứu và ứng dụng khoa học quân sự phục vụ nhiệm vụ quốc phòng hiện đại.',
    videoType: 'upload',
    videoUrl: '/uploads/videos/video/khoa-hoc-quan-su-phung-su.mp4',
    cloudStoragePath: '/uploads/videos/video/khoa-hoc-quan-su-phung-su.mp4',
    category: 'khoa học',
    tags: ['khoa học quân sự', 'nghiên cứu', 'quốc phòng'],
    isFeatured: true,
    isActive: true,
    displayOrder: 3,
    views: 875,
  },
  {
    title: 'Nghệ thuật chiến dịch trong các chiến thắng lịch sử',
    description: 'Vai trò của nghệ thuật chiến dịch trong các chiến thắng lịch sử — từ Điện Biên Phủ đến Chiến dịch Hồ Chí Minh.',
    videoType: 'upload',
    videoUrl: '/uploads/videos/video/nghe-thuat-chien-dich-chien-thang.mp4',
    cloudStoragePath: '/uploads/videos/video/nghe-thuat-chien-dich-chien-thang.mp4',
    category: 'lịch sử',
    tags: ['nghệ thuật chiến dịch', 'lịch sử', 'chiến thắng', 'quân sự'],
    isFeatured: false,
    isActive: true,
    displayOrder: 4,
    views: 3150,
  },
  {
    title: 'Nghệ thuật quân sự trong chiến tranh tương lai',
    description: 'Phân tích chuyên sâu về nghệ thuật quân sự trong chiến tranh hiện đại — dữ liệu, tự động hóa và tác chiến thông minh.',
    videoType: 'upload',
    videoUrl: '/uploads/videos/video/nghe-thuat-quan-su-chien-tranh-tuong-lai.mp4',
    cloudStoragePath: '/uploads/videos/video/nghe-thuat-quan-su-chien-tranh-tuong-lai.mp4',
    category: 'phân tích',
    tags: ['nghệ thuật quân sự', 'chiến tranh tương lai', 'công nghệ', 'quân sự'],
    isFeatured: false,
    isActive: true,
    displayOrder: 5,
    views: 1890,
  },
  {
    title: 'Giải mã nghệ thuật quân sự',
    description: 'Tổng quan về nghệ thuật quân sự hiện đại: tư duy chiến lược, phương thức tác chiến và xu hướng phát triển.',
    videoType: 'upload',
    videoUrl: '/uploads/videos/video/giai-ma-nghe-thuat-quan-su.mp4',
    cloudStoragePath: '/uploads/videos/video/giai-ma-nghe-thuat-quan-su.mp4',
    category: 'phân tích',
    tags: ['nghệ thuật quân sự', 'quân sự', 'chiến lược', 'tác chiến'],
    isFeatured: false,
    isActive: true,
    displayOrder: 6,
    views: 2670,
  },
  {
    title: 'Chuyển đổi số trong lĩnh vực quân sự',
    description: 'Chuyển đổi số trong lĩnh vực quân sự: từ quản lý truyền thống đến nền tảng dữ liệu thời gian thực.',
    videoType: 'upload',
    videoUrl: '/uploads/videos/video/chuyen-doi-so-quan-su.mp4',
    cloudStoragePath: '/uploads/videos/video/chuyen-doi-so-quan-su.mp4',
    category: 'công nghệ',
    tags: ['chuyển đổi số', 'quân sự', 'dữ liệu', 'AI'],
    isFeatured: false,
    isActive: true,
    displayOrder: 7,
    views: 1430,
  },
  {
    title: 'Công nghệ trong chỉ huy tác chiến hiện đại',
    description: 'Các giải pháp công nghệ hiện đại đang thay đổi cách thức chỉ huy và tác chiến của quân đội.',
    videoType: 'upload',
    videoUrl: '/uploads/videos/video/cong-nghe-chi-huy-tac-chien.mp4',
    cloudStoragePath: '/uploads/videos/video/cong-nghe-chi-huy-tac-chien.mp4',
    category: 'công nghệ',
    tags: ['công nghệ', 'chỉ huy', 'tác chiến', 'quân sự'],
    isFeatured: false,
    isActive: true,
    displayOrder: 8,
    views: 980,
  },
]

async function seedVideosDemo() {
  console.log('🚀 Bắt đầu seed video demo...\n')

  let created = 0
  let updated = 0

  for (const item of videoSeeds) {
    const existing = await db.video.findFirst({ where: { videoUrl: item.videoUrl } })

    if (existing) {
      await db.video.update({
        where: { id: existing.id },
        data: {
          title: item.title,
          description: item.description,
          category: item.category,
          tags: item.tags,
          isFeatured: item.isFeatured,
          isActive: item.isActive,
          displayOrder: item.displayOrder,
        },
      })
      updated++
      console.log(`  ↺  ${item.title}`)
    } else {
      await db.video.create({
        data: {
          title: item.title,
          description: item.description ?? null,
          videoType: item.videoType,
          videoUrl: item.videoUrl,
          cloudStoragePath: item.cloudStoragePath,
          category: item.category ?? null,
          tags: item.tags,
          isFeatured: item.isFeatured,
          isActive: item.isActive,
          displayOrder: item.displayOrder,
          views: item.views,
          publishedAt: new Date(),
        },
      })
      created++
      console.log(`  ✅ ${item.title}`)
    }
  }

  console.log(`\n📊 Tổng: ${videoSeeds.length} videos (tạo mới: ${created}, cập nhật: ${updated})`)
}

async function main() {
  try {
    await seedVideosDemo()
    console.log('\n🎉 Seed video demo hoàn tất!')
  } catch (e) {
    console.error('❌ Seed thất bại:', e)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

main()
