/**
 * seed-media-batch.ts — Tapchi-HCQS
 *
 * Seed đa dạng Media records cho thư viện media CMS.
 * Phủ đủ các category: banner, article, profile, general.
 * Tất cả cloudStoragePath trỏ đến file thật trong public/uploads/.
 * Idempotent — upsert by cloudStoragePath, KHÔNG xóa dữ liệu cũ.
 *
 * Run: npx tsx --require dotenv/config prisma/seed-media-batch.ts
 */

import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const db = new PrismaClient()

type MediaSeed = {
  fileName: string
  fileType: string
  fileSize: number
  cloudStoragePath: string
  altText?: string
  title?: string
  description?: string
  category: string
  width?: number
  height?: number
  isPublic: boolean
}

// Thực tế: public/uploads/images/banner/
const bannerImages: MediaSeed[] = [
  {
    fileName: 'Banner.png',
    fileType: 'image/png',
    fileSize: 340000,
    cloudStoragePath: '/uploads/images/banner/Banner.png',
    altText: 'Banner trang chủ tạp chí',
    title: 'Banner trang chủ',
    description: 'Banner chính hiển thị ở đầu trang',
    category: 'banner',
    width: 1280,
    height: 300,
    isPublic: true,
  },
  {
    fileName: 'Banner2.png',
    fileType: 'image/png',
    fileSize: 290000,
    cloudStoragePath: '/uploads/images/banner/Banner2.png',
    altText: 'Banner phiên bản 2',
    title: 'Banner phiên bản 2',
    category: 'banner',
    width: 1280,
    height: 300,
    isPublic: true,
  },
  {
    fileName: 'Banner04.png',
    fileType: 'image/png',
    fileSize: 310000,
    cloudStoragePath: '/uploads/images/banner/Banner04.png',
    altText: 'Banner số 4',
    title: 'Banner số 4',
    category: 'banner',
    width: 1280,
    height: 240,
    isPublic: true,
  },
  {
    fileName: 'Banner_1280.png',
    fileType: 'image/png',
    fileSize: 275000,
    cloudStoragePath: '/uploads/images/banner/Banner_1280.png',
    altText: 'Banner 1280px',
    title: 'Banner độ rộng 1280px',
    category: 'banner',
    width: 1280,
    height: 240,
    isPublic: true,
  },
  {
    fileName: 'Banner_1024.png',
    fileType: 'image/png',
    fileSize: 240000,
    cloudStoragePath: '/uploads/images/banner/Banner_1024.png',
    altText: 'Banner 1024px',
    title: 'Banner độ rộng 1024px',
    category: 'banner',
    width: 1024,
    height: 192,
    isPublic: true,
  },
]

// Thực tế: public/uploads/images/news/ — dùng làm ảnh bìa bài viết
const articleImages: MediaSeed[] = [
  {
    fileName: '5300.jpg',
    fileType: 'image/jpeg',
    fileSize: 520000,
    cloudStoragePath: '/uploads/images/news/5300.jpg',
    altText: 'Hội nghị Học viện Quốc phòng',
    title: 'Hội nghị Học viện',
    category: 'article',
    width: 1200,
    height: 675,
    isPublic: true,
  },
  {
    fileName: '1740.jpg',
    fileType: 'image/jpeg',
    fileSize: 480000,
    cloudStoragePath: '/uploads/images/news/1740.jpg',
    altText: 'Hoạt động nghiên cứu khoa học',
    title: 'Nghiên cứu khoa học',
    category: 'article',
    width: 1200,
    height: 675,
    isPublic: true,
  },
  {
    fileName: '2586.jpg',
    fileType: 'image/jpeg',
    fileSize: 450000,
    cloudStoragePath: '/uploads/images/news/2586.jpg',
    altText: 'Đào tạo sĩ quan hậu cần',
    title: 'Đào tạo sĩ quan',
    category: 'article',
    width: 1200,
    height: 675,
    isPublic: true,
  },
  {
    fileName: '1815.jpg',
    fileType: 'image/jpeg',
    fileSize: 490000,
    cloudStoragePath: '/uploads/images/news/1815.jpg',
    altText: 'Hội thảo khoa học quân sự',
    title: 'Hội thảo khoa học',
    category: 'article',
    width: 1200,
    height: 675,
    isPublic: true,
  },
  {
    fileName: '4394.jpg',
    fileType: 'image/jpeg',
    fileSize: 510000,
    cloudStoragePath: '/uploads/images/news/4394.jpg',
    altText: 'Lễ khai giảng năm học mới',
    title: 'Khai giảng năm học',
    category: 'article',
    width: 1200,
    height: 675,
    isPublic: true,
  },
  {
    fileName: '4396.jpg',
    fileType: 'image/jpeg',
    fileSize: 470000,
    cloudStoragePath: '/uploads/images/news/4396.jpg',
    altText: 'Tập huấn kỹ năng thực hành',
    title: 'Tập huấn kỹ năng',
    category: 'article',
    width: 1200,
    height: 675,
    isPublic: true,
  },
  {
    fileName: '1739.jpg',
    fileType: 'image/jpeg',
    fileSize: 460000,
    cloudStoragePath: '/uploads/images/news/1739.jpg',
    altText: 'Diễn tập thực hành bảo đảm hậu cần',
    title: 'Diễn tập thực hành',
    category: 'article',
    width: 1200,
    height: 675,
    isPublic: true,
  },
  {
    fileName: '1914.jpg',
    fileType: 'image/jpeg',
    fileSize: 500000,
    cloudStoragePath: '/uploads/images/news/1914.jpg',
    altText: 'Lễ trao bằng tốt nghiệp',
    title: 'Lễ tốt nghiệp',
    category: 'article',
    width: 1200,
    height: 675,
    isPublic: true,
  },
]

// Thực tế: public/uploads/images/media/ + news/
const profileImages: MediaSeed[] = [
  {
    fileName: '2.jpg',
    fileType: 'image/jpeg',
    fileSize: 180000,
    cloudStoragePath: '/uploads/images/media/2.jpg',
    altText: 'Ảnh đại diện tác giả',
    title: 'Ảnh tác giả',
    category: 'profile',
    width: 400,
    height: 400,
    isPublic: true,
  },
  {
    fileName: '3.jpg',
    fileType: 'image/jpeg',
    fileSize: 175000,
    cloudStoragePath: '/uploads/images/media/3.jpg',
    altText: 'Ảnh đại diện phản biện',
    title: 'Ảnh phản biện',
    category: 'profile',
    width: 400,
    height: 400,
    isPublic: false,
  },
  {
    fileName: '1059.jpg',
    fileType: 'image/jpeg',
    fileSize: 195000,
    cloudStoragePath: '/uploads/images/news/1059.jpg',
    altText: 'Ảnh cán bộ giảng viên',
    title: 'Ảnh giảng viên',
    category: 'profile',
    width: 400,
    height: 500,
    isPublic: true,
  },
  {
    fileName: '12130.jpg',
    fileType: 'image/jpeg',
    fileSize: 210000,
    cloudStoragePath: '/uploads/images/news/12130.jpg',
    altText: 'Ảnh ban biên tập',
    title: 'Ảnh ban biên tập',
    category: 'profile',
    width: 400,
    height: 400,
    isPublic: true,
  },
  {
    fileName: '16104.jpg',
    fileType: 'image/jpeg',
    fileSize: 185000,
    cloudStoragePath: '/uploads/images/news/16104.jpg',
    altText: 'Ảnh hội đồng biên tập',
    title: 'Hội đồng biên tập',
    category: 'profile',
    width: 400,
    height: 400,
    isPublic: true,
  },
  {
    fileName: '111110.jpg',
    fileType: 'image/jpeg',
    fileSize: 200000,
    cloudStoragePath: '/uploads/images/news/111110.jpg',
    altText: 'Ảnh nghiên cứu sinh',
    title: 'Ảnh nghiên cứu sinh',
    category: 'profile',
    width: 400,
    height: 500,
    isPublic: false,
  },
]

// Thực tế: public/uploads/images/cover/ — ảnh bìa số tạp chí
const generalImages: MediaSeed[] = [
  {
    fileName: 'Bia01.2025.png',
    fileType: 'image/png',
    fileSize: 620000,
    cloudStoragePath: '/uploads/images/cover/Bia01.2025.png',
    altText: 'Bìa tạp chí số 01/2025',
    title: 'Bìa tạp chí số 01/2025',
    description: 'Ảnh bìa số 1 năm 2025',
    category: 'general',
    width: 800,
    height: 1130,
    isPublic: true,
  },
  {
    fileName: 'Bia02.2025.png',
    fileType: 'image/png',
    fileSize: 590000,
    cloudStoragePath: '/uploads/images/cover/Bia02.2025.png',
    altText: 'Bìa tạp chí số 02/2025',
    title: 'Bìa tạp chí số 02/2025',
    description: 'Ảnh bìa số 2 năm 2025',
    category: 'general',
    width: 800,
    height: 1130,
    isPublic: true,
  },
  {
    fileName: 'Bia03.2025.png',
    fileType: 'image/png',
    fileSize: 610000,
    cloudStoragePath: '/uploads/images/cover/Bia03.2025.png',
    altText: 'Bìa tạp chí số 03/2025',
    title: 'Bìa tạp chí số 03/2025',
    description: 'Ảnh bìa số 3 năm 2025',
    category: 'general',
    width: 800,
    height: 1130,
    isPublic: true,
  },
  {
    fileName: 'Bia04.2025.png',
    fileType: 'image/png',
    fileSize: 580000,
    cloudStoragePath: '/uploads/images/cover/Bia04.2025.png',
    altText: 'Bìa tạp chí số 04/2025',
    title: 'Bìa tạp chí số 04/2025',
    description: 'Ảnh bìa số 4 năm 2025',
    category: 'general',
    width: 800,
    height: 1130,
    isPublic: true,
  },
  {
    fileName: 'Bia05.2025.png',
    fileType: 'image/png',
    fileSize: 600000,
    cloudStoragePath: '/uploads/images/cover/Bia05.2025.png',
    altText: 'Bìa tạp chí số 05/2025',
    title: 'Bìa tạp chí số 05/2025',
    description: 'Ảnh bìa số 5 năm 2025',
    category: 'general',
    width: 800,
    height: 1130,
    isPublic: true,
  },
]

async function seedMediaBatch() {
  console.log('🚀 Bắt đầu seed media batch...\n')

  const allItems: MediaSeed[] = [
    ...bannerImages,
    ...articleImages,
    ...profileImages,
    ...generalImages,
  ]

  let created = 0
  let updated = 0

  for (const item of allItems) {
    const existing = await db.media.findUnique({ where: { cloudStoragePath: item.cloudStoragePath } })

    await db.media.upsert({
      where: { cloudStoragePath: item.cloudStoragePath },
      update: {
        fileName: item.fileName,
        fileType: item.fileType,
        fileSize: item.fileSize,
        altText: item.altText ?? null,
        title: item.title ?? null,
        description: item.description ?? null,
        category: item.category,
        width: item.width ?? null,
        height: item.height ?? null,
        isPublic: item.isPublic,
      },
      create: {
        fileName: item.fileName,
        fileType: item.fileType,
        fileSize: item.fileSize,
        cloudStoragePath: item.cloudStoragePath,
        altText: item.altText ?? null,
        title: item.title ?? null,
        description: item.description ?? null,
        category: item.category,
        width: item.width ?? null,
        height: item.height ?? null,
        isPublic: item.isPublic,
        usageCount: 0,
      },
    })

    if (existing) { updated++ } else { created++ }
  }

  console.log(`✅ Banner:  ${bannerImages.length} items`)
  console.log(`✅ Article: ${articleImages.length} items`)
  console.log(`✅ Profile: ${profileImages.length} items`)
  console.log(`✅ General: ${generalImages.length} items`)
  console.log(`\n📊 Tổng: ${allItems.length} records (tạo mới: ${created}, cập nhật: ${updated})`)
}

async function main() {
  try {
    await seedMediaBatch()
    console.log('\n🎉 Seed media batch hoàn tất!')
  } catch (e) {
    console.error('❌ Seed thất bại:', e)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

main()
