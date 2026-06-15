/**
 * seed-demo-podcasts.ts
 *
 * Seed podcast demo SẠCH cho Tạp chí Nghệ thuật Quân sự Việt Nam (chủ đề bám đúng
 * các chuyên mục NTQS: chiến lược, nghệ thuật tác chiến, chiến dịch, lịch sử quân sự...).
 * KHÔNG dùng prisma/seed-podcasts.ts cũ (còn nội dung "hậu cần" của tapchi-hcqs).
 *
 * Tạo bản ghi metadata để kiểm thử trang /podcasts, trang chi tiết và CMS quản trị.
 * audioUrl để trống — tải file âm thanh thật qua /dashboard/admin/cms/podcasts khi cần phát.
 *
 * Idempotent: upsert theo (title). Run: npx tsx --require dotenv/config prisma/seed-demo-podcasts.ts
 */

import 'dotenv/config'
import { prisma } from '@/lib/prisma'

const HOST = 'Tạp chí Nghệ thuật Quân sự Việt Nam'

interface PodcastSeed {
  title: string
  description: string
  category: string
  tags: string[]
  episodeNumber: number
  duration: number // giây
  isFeatured?: boolean
}

const EPISODES: PodcastSeed[] = [
  {
    title: 'Nghệ thuật quân sự Việt Nam trong chiến tranh nhân dân',
    description:
      'Phân tích những giá trị cốt lõi của nghệ thuật quân sự Việt Nam: lấy nhỏ thắng lớn, lấy ít địch nhiều, kết hợp đấu tranh vũ trang với chính trị, binh vận trong các cuộc chiến tranh giải phóng và bảo vệ Tổ quốc.',
    category: 'Nghệ thuật tác chiến',
    tags: ['nghệ thuật quân sự', 'chiến tranh nhân dân', 'lý luận'],
    episodeNumber: 1,
    duration: 1840,
    isFeatured: true,
  },
  {
    title: 'Tư duy chiến lược quân sự trong tình hình mới',
    description:
      'Bàn về yêu cầu đổi mới tư duy chiến lược bảo vệ Tổ quốc từ sớm, từ xa; giữ nước từ khi nước chưa nguy; xây dựng thế trận quốc phòng toàn dân gắn với thế trận an ninh nhân dân.',
    category: 'Chiến lược quân sự',
    tags: ['chiến lược', 'quốc phòng', 'bảo vệ Tổ quốc'],
    episodeNumber: 2,
    duration: 2100,
    isFeatured: true,
  },
  {
    title: 'Nghệ thuật chiến dịch trong các chiến dịch lớn',
    description:
      'Nhìn lại nghệ thuật tổ chức và thực hành chiến dịch qua Chiến dịch Điện Biên Phủ và Chiến dịch Hồ Chí Minh: chọn hướng, tạo thế, tập trung lực lượng và nắm thời cơ quyết chiến chiến lược.',
    category: 'Chiến dịch học',
    tags: ['chiến dịch', 'Điện Biên Phủ', 'lịch sử quân sự'],
    episodeNumber: 3,
    duration: 1975,
  },
  {
    title: 'Vận dụng chiến thuật trong tác chiến hiện đại',
    description:
      'Trao đổi về phát triển lý luận chiến thuật cấp phân đội trong điều kiện tác chiến công nghệ cao, tác chiến điện tử và yêu cầu huấn luyện sát thực tế chiến đấu.',
    category: 'Chiến thuật học',
    tags: ['chiến thuật', 'tác chiến hiện đại', 'huấn luyện'],
    episodeNumber: 4,
    duration: 1620,
  },
  {
    title: 'Bài học lịch sử quân sự và giá trị thời đại',
    description:
      'Khai thác kho tàng kinh nghiệm đánh giặc giữ nước của dân tộc; rút ra những bài học còn nguyên giá trị cho sự nghiệp xây dựng Quân đội và củng cố quốc phòng hôm nay.',
    category: 'Lịch sử quân sự',
    tags: ['lịch sử quân sự', 'truyền thống', 'bài học kinh nghiệm'],
    episodeNumber: 5,
    duration: 2250,
  },
  {
    title: 'Hợp tác quốc phòng và hội nhập quốc tế',
    description:
      'Thảo luận về đường lối đối ngoại quốc phòng “bốn không”, vai trò của hợp tác quốc phòng trong giữ vững môi trường hòa bình, ổn định để phát triển đất nước.',
    category: 'Hợp tác quốc phòng',
    tags: ['hợp tác quốc phòng', 'đối ngoại', 'an ninh khu vực'],
    episodeNumber: 6,
    duration: 1980,
  },
]

async function main(): Promise<void> {
  const admin = await prisma.user.findFirst({
    where: { role: 'SYSADMIN', isActive: true },
    select: { id: true },
  })

  let upserted = 0
  for (let i = 0; i < EPISODES.length; i++) {
    const ep = EPISODES[i]
    const existing = await prisma.podcast.findFirst({ where: { title: ep.title } })
    const data = {
      title: ep.title,
      description: ep.description,
      host: HOST,
      category: ep.category,
      tags: ep.tags,
      episodeNumber: ep.episodeNumber,
      seasonNumber: 1,
      duration: ep.duration,
      isFeatured: ep.isFeatured ?? false,
      isActive: true,
      displayOrder: i,
      publishedAt: new Date(),
      createdBy: admin?.id ?? null,
    }
    if (existing) {
      await prisma.podcast.update({ where: { id: existing.id }, data })
    } else {
      await prisma.podcast.create({ data })
    }
    upserted++
    console.log(`  ✓ [${ep.category}] ${ep.title}`)
  }

  console.log(`\n✅ Đã seed ${upserted} podcast NTQS (audio để trống — tải lên qua CMS khi cần phát).`)
  console.log('   → Xem công khai: /podcasts · Quản trị: /dashboard/admin/cms/podcasts')
}

main()
  .catch((error) => {
    console.error('❌ Lỗi seed podcast:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
