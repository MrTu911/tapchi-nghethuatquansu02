/**
 * seed-videos-demo.ts — Tapchi-HCQS
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

// Tất cả file đã copy vào public/uploads/videos/video/
// videoUrl = cloudStoragePath = đường dẫn public browser có thể truy cập
const videoSeeds: VideoSeed[] = [
  {
    title: 'Tạo Video Về Học Viện Quốc Phòng',
    description: 'Video giới thiệu tổng quan về Học viện Quốc phòng — lịch sử hình thành, sứ mệnh đào tạo và phát triển.',
    videoType: 'upload',
    videoUrl: '/uploads/videos/video/tao-video-hoc-vien-hau-can.mp4',
    cloudStoragePath: '/uploads/videos/video/tao-video-hoc-vien-hau-can.mp4',
    category: 'giới thiệu',
    tags: ['Học viện Quốc phòng', 'giới thiệu', 'HVQPh'],
    isFeatured: true,
    isActive: true,
    displayOrder: 1,
    views: 1240,
  },
  {
    title: 'Khúc Ca Học Viện Quốc Phòng Anh Hùng',
    description: 'Bài ca truyền thống về tinh thần anh hùng của Học viện Quốc phòng qua các thế hệ.',
    videoType: 'upload',
    videoUrl: '/uploads/videos/video/khuc-ca-hoc-vien-hau-can-anh-hung.mp4',
    cloudStoragePath: '/uploads/videos/video/khuc-ca-hoc-vien-hau-can-anh-hung.mp4',
    category: 'văn hóa',
    tags: ['Học viện Quốc phòng', 'bài ca', 'truyền thống'],
    isFeatured: true,
    isActive: true,
    displayOrder: 2,
    views: 2380,
  },
  {
    title: 'Viện KHHCQS — Khoa Học Phụng Sự',
    description: 'Học viện Quốc phòng: nghiên cứu và ứng dụng khoa học phục vụ nhiệm vụ quân sự hiện đại.',
    videoType: 'upload',
    videoUrl: '/uploads/videos/video/vien-khhcqs-khoa-hoc-phung-su.mp4',
    cloudStoragePath: '/uploads/videos/video/vien-khhcqs-khoa-hoc-phung-su.mp4',
    category: 'khoa học',
    tags: ['KHHCQS', 'nghiên cứu', 'khoa học quân sự'],
    isFeatured: true,
    isActive: true,
    displayOrder: 3,
    views: 875,
  },
  {
    title: 'Hậu Cần Của Chiến Thắng',
    description: 'Vai trò quyết định của hậu cần trong các chiến dịch lịch sử — từ Điện Biên Phủ đến Hồ Chí Minh.',
    videoType: 'upload',
    videoUrl: '/uploads/videos/video/hau-can-cua-chien-thang.mp4',
    cloudStoragePath: '/uploads/videos/video/hau-can-cua-chien-thang.mp4',
    category: 'lịch sử',
    tags: ['hậu cần', 'lịch sử', 'chiến thắng', 'quân sự'],
    isFeatured: false,
    isActive: true,
    displayOrder: 4,
    views: 3150,
  },
  {
    title: 'Vì Sao Hậu Cần Là "Huyết Mạch Số" Của Chiến Tranh Tương Lai',
    description: 'Phân tích chuyên sâu về vai trò của hậu cần số trong chiến tranh hiện đại — dữ liệu, tự động hóa và chuỗi cung ứng thông minh.',
    videoType: 'upload',
    videoUrl: '/uploads/videos/video/vi-sao-hau-can-la-huyet-mach-so.mp4',
    cloudStoragePath: '/uploads/videos/video/vi-sao-hau-can-la-huyet-mach-so.mp4',
    category: 'phân tích',
    tags: ['hậu cần số', 'chiến tranh tương lai', 'công nghệ', 'quân sự'],
    isFeatured: false,
    isActive: true,
    displayOrder: 5,
    views: 1890,
  },
  {
    title: 'Giải Mã Hậu Cần Quân Sự',
    description: 'Tổng quan hệ thống hậu cần quân sự hiện đại: cơ cấu tổ chức, phương thức vận hành và xu hướng phát triển.',
    videoType: 'upload',
    videoUrl: '/uploads/videos/video/giai-ma-nghe-thuat-quan-su.mp4',
    cloudStoragePath: '/uploads/videos/video/giai-ma-nghe-thuat-quan-su.mp4',
    category: 'phân tích',
    tags: ['hậu cần', 'quân sự', 'tổ chức', 'hệ thống'],
    isFeatured: false,
    isActive: true,
    displayOrder: 6,
    views: 2670,
  },
  {
    title: 'Huyết Mạch Số — Hậu Cần Kỹ Thuật Số',
    description: 'Chuyển đổi số trong hậu cần quân sự: từ quản lý giấy tờ đến nền tảng dữ liệu thời gian thực.',
    videoType: 'upload',
    videoUrl: '/uploads/videos/video/huyet-mach-so.mp4',
    cloudStoragePath: '/uploads/videos/video/huyet-mach-so.mp4',
    category: 'công nghệ',
    tags: ['chuyển đổi số', 'hậu cần kỹ thuật số', 'dữ liệu', 'AI'],
    isFeatured: false,
    isActive: true,
    displayOrder: 7,
    views: 1430,
  },
  {
    title: 'Phần Mềm Cách Mạng Hóa Hậu Cần',
    description: 'Các giải pháp phần mềm quản lý hậu cần hiện đại đang thay đổi cách thức vận hành quân đội toàn cầu.',
    videoType: 'upload',
    videoUrl: '/uploads/videos/video/phan-mem-cach-mang-hoa-hau-can.mp4',
    cloudStoragePath: '/uploads/videos/video/phan-mem-cach-mang-hoa-hau-can.mp4',
    category: 'công nghệ',
    tags: ['phần mềm', 'hậu cần', 'công nghệ', 'quản lý'],
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
