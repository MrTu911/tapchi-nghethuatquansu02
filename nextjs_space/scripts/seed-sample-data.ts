import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const newsImages = [
  '/uploads/images/news/5300.jpg',
  '/uploads/images/news/1740.jpg', 
  '/uploads/images/news/2586.jpg',
  '/uploads/images/news/1815.jpg',
  '/uploads/images/news/4394.jpg',
  '/uploads/images/news/4396.jpg',
  '/uploads/images/news/1739.jpg',
  '/uploads/images/news/1914.jpg',
  '/uploads/images/news/1059.jpg',
  '/uploads/images/news/12130.jpg',
  '/uploads/images/news/16104.jpg',
  '/uploads/images/news/111110.jpg',
  '/uploads/images/news/111210.jpg',
  '/uploads/images/news/2.jpg',
  '/uploads/images/news/3.jpg',
];

const newsTitles = [
  'Đại hội Đại biểu Đảng bộ Học viện Quốc phòng lần thứ XXIII nhiệm kỳ 2025-2030',
  'Hội nghị rút kinh nghiệm kiểm tra chuyên đề về hoạt động chuyên môn năm học 2025-2026',
  'Gặp mặt tân sinh viên năm học 2025-2026 tại Học viện Quốc phòng',
  'Hội nghị tổng kết công tác nghiên cứu khoa học năm 2024',
  'Lễ khai giảng năm học mới 2025-2026 tại Học viện Quốc phòng',
  'Hội thảo khoa học "Đổi mới công tác hậu cần trong tình hình mới"',
  'Tập huấn công tác bảo đảm hậu cần cho các đơn vị toàn quân',
  'Kỷ niệm 80 năm ngày thành lập Quân đội nhân dân Việt Nam',
  'Hội nghị triển khai nhiệm vụ công tác năm 2026',
  'Lễ trao bằng tiến sĩ và thạc sĩ năm 2025',
  'Hội thi giảng viên giỏi cấp Học viện năm 2025',
  'Tọa đàm khoa học về công nghệ số trong quản lý hậu cần',
  'Diễn tập thực hành bảo đảm hậu cần trong tình huống khẩn cấp',
  'Hợp tác quốc tế về đào tạo và nghiên cứu khoa học quân sự',
  'Chương trình tình nguyện hè năm 2025 của sinh viên Học viện',
  'Hội nghị sơ kết học kỳ I năm học 2025-2026',
  'Lễ kết nạp Đảng viên mới đợt 22/12',
  'Hội thao quân sự năm 2025 tại Học viện Quốc phòng',
  'Trao học bổng cho sinh viên có thành tích xuất sắc',
  'Hội nghị cán bộ viên chức và người lao động năm 2026',
];

const affiliations = [
  'Học viện Quốc phòng',
  'Bộ Tham mưu - Tổng cục Hậu cần',
  'Cục Quân nhu',
  'Cục Vận tải',
  'Cục Xăng dầu',
  'Cục Quân y',
  'Trường Sĩ quan Hậu cần',
  'Viện Nghiên cứu Khoa học Hậu cần',
];

async function main() {
  console.log('🚀 Starting seed...');

  const hashedPassword = await bcrypt.hash('password123', 10);
  
  // 1. Create users
  console.log('📝 Creating users...');
  const usersData = [];
  const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Vũ', 'Võ', 'Đặng', 'Bùi'];
  const middleNames = ['Văn', 'Thị', 'Đức', 'Minh', 'Quang', 'Hữu', 'Thanh', 'Xuân', 'Kim', 'Ngọc'];
  const lastNames = ['An', 'Bình', 'Cường', 'Dũng', 'Hà', 'Hùng', 'Hương', 'Lan', 'Long', 'Minh'];

  for (let i = 1; i <= 100; i++) {
    usersData.push({
      email: `author${i}@hcqs.edu.vn`,
      passwordHash: hashedPassword,
      fullName: `${firstNames[i % 10]} ${middleNames[Math.floor(i / 10) % 10]} ${lastNames[i % 10]}`,
      role: Role.AUTHOR,
      org: affiliations[i % affiliations.length],
      phone: `09${String(i).padStart(8, '0')}`,
      isActive: true,
      emailVerified: true,
    });
  }

  for (let i = 1; i <= 20; i++) {
    usersData.push({
      email: `reviewer${i}@hcqs.edu.vn`,
      passwordHash: hashedPassword,
      fullName: `PGS.TS. Reviewer ${i}`,
      role: Role.REVIEWER,
      org: affiliations[i % affiliations.length],
      isActive: true,
      emailVerified: true,
    });
  }

  await prisma.user.createMany({ data: usersData, skipDuplicates: true });
  console.log(`✅ Created ${usersData.length} users`);

  // 2. Create news
  console.log('📝 Creating news...');
  await prisma.news.deleteMany({});
  
  for (let i = 0; i < 20; i++) {
    const publishDate = new Date();
    publishDate.setDate(publishDate.getDate() - i * 3);

    await prisma.news.create({
      data: {
        title: newsTitles[i],
        slug: `tin-${i + 1}-${Date.now()}`,
        summary: `${newsTitles[i]}. Đây là tin tức quan trọng của Học viện Quốc phòng.`,
        content: `<p><strong>${newsTitles[i]}</strong></p><p>Nội dung chi tiết của bài viết...</p>`,
        coverImage: newsImages[i % newsImages.length],
        isPublished: true,
        isFeatured: i < 5,
        publishedAt: publishDate,
        views: Math.floor(Math.random() * 500) + 50,
      },
    });
  }
  console.log('✅ Created 20 news articles');

  // 3. Create banner
  console.log('📝 Creating banner...');
  await prisma.banner.deleteMany({});
  await prisma.banner.create({
    data: {
      title: 'Banner Học viện Quốc phòng',
      imageUrl: '/uploads/images/banner/Banner_1280.png',
      linkUrl: '/',
      isActive: true,
      position: 1,
    },
  });
  console.log('✅ Banner created');

  // 4. Create media
  console.log('📝 Creating media...');
  await prisma.media.deleteMany({});
  
  for (let i = 0; i < newsImages.length; i++) {
    await prisma.media.create({
      data: {
        title: `Ảnh hoạt động ${i + 1}`,
        fileName: `image-${i + 1}.jpg`,
        fileType: 'image/jpeg',
        fileSize: 500000 + Math.floor(Math.random() * 500000),
        cloudStoragePath: newsImages[i],
        category: 'news',
        isPublic: true,
      },
    });
  }
  console.log(`✅ Created ${newsImages.length} media items`);

  console.log('\n🎉 Seed completed successfully!');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
