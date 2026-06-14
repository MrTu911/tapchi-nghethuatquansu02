
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding homepage sections...\n');

  // Delete existing sections
  await prisma.homepageSection.deleteMany({});
  console.log('✅ Cleared existing homepage sections\n');

  // Define homepage sections matching current homepage structure
  const sections = [
    {
      key: 'hero_banner',
      type: 'hero',
      title: 'Banner Chính',
      titleEn: 'Hero Banner',
      subtitle: 'Slider banner lớn ở đầu trang',
      subtitleEn: 'Main slider at the top of the page',
      content: null,
      imageUrl: null,
      linkUrl: null,
      linkText: null,
      settings: {
        autoPlay: true,
        interval: 6000,
        showControls: true,
        showIndicators: true,
      },
      order: 0,
      isActive: true,
    },
    {
      key: 'latest_issue',
      type: 'issues',
      title: 'Số mới nhất',
      titleEn: 'Latest Issue',
      subtitle: 'Hiển thị số báo mới nhất trong sidebar phải',
      subtitleEn: 'Display the latest issue in the right sidebar',
      content: null,
      imageUrl: null,
      linkUrl: '/issues/latest',
      linkText: 'Xem chi tiết',
      linkTextEn: 'View Details',
      settings: {
        limit: 1,
        showCoverImage: true,
        showMetadata: true,
      },
      order: 1,
      isActive: true,
    },
    {
      key: 'featured_news',
      type: 'news',
      title: 'Tin nổi bật',
      titleEn: 'Featured News',
      subtitle: 'Hiển thị các tin tức nổi bật',
      subtitleEn: 'Display featured news articles',
      content: null,
      imageUrl: null,
      linkUrl: '/news',
      linkText: 'Xem tất cả tin',
      linkTextEn: 'View All News',
      settings: {
        limit: 3,
        featured: true,
        layout: 'grid',
      },
      order: 2,
      isActive: true,
    },
    {
      key: 'latest_news',
      type: 'news',
      title: 'Tin mới',
      titleEn: 'Latest News',
      subtitle: 'Hiển thị các tin tức mới nhất',
      subtitleEn: 'Display latest news articles',
      content: null,
      imageUrl: null,
      linkUrl: '/news',
      linkText: 'Xem tất cả tin',
      linkTextEn: 'View All News',
      settings: {
        limit: 3,
        featured: false,
        layout: 'grid',
      },
      order: 3,
      isActive: true,
    },
    {
      key: 'special_news',
      type: 'news',
      title: 'Tin chuyên ngành',
      titleEn: 'Special News',
      subtitle: 'Hiển thị tin tức chuyên ngành',
      subtitleEn: 'Display specialized news',
      content: null,
      imageUrl: null,
      linkUrl: '/news',
      linkText: 'Xem thêm',
      linkTextEn: 'Read More',
      settings: {
        limit: 3,
        categories: ['khoa-hoc-ky-thuat', 'lich-su-truyen-thong'],
        layout: 'grid',
      },
      order: 4,
      isActive: true,
    },
    {
      key: 'latest_research',
      type: 'articles',
      title: 'Bài nghiên cứu mới nhất',
      titleEn: 'Latest Research',
      subtitle: 'Hiển thị bài viết nghiên cứu mới nhất',
      subtitleEn: 'Display the latest research article',
      content: null,
      imageUrl: null,
      linkUrl: '/archive',
      linkText: 'Xem tất cả bài viết',
      linkTextEn: 'View All Articles',
      settings: {
        limit: 1,
        showAbstract: true,
        showAuthor: true,
      },
      order: 5,
      isActive: true,
    },
    {
      key: 'video_media',
      type: 'text',
      title: 'Video – Media khoa học',
      titleEn: 'Video – Scientific Media',
      subtitle: 'Khu vực video và media khoa học',
      subtitleEn: 'Scientific video and media section',
      content: '<div class="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-3"><p class="text-sm text-muted-foreground">Video khoa học sẽ được cập nhật</p></div><p class="text-sm italic text-muted-foreground">Chuyên đề: "Ứng dụng công nghệ số trong nghệ thuật quân sự hiện đại"</p>',
      imageUrl: null,
      linkUrl: null,
      settings: {
        type: 'video',
        embedUrl: null,
      },
      order: 6,
      isActive: false, // Disabled by default as placeholder
    },
    {
      key: 'search_widget',
      type: 'widget',
      title: 'Tìm kiếm',
      titleEn: 'Search',
      subtitle: 'Widget tìm kiếm nhanh',
      subtitleEn: 'Quick search widget',
      content: null,
      imageUrl: null,
      linkUrl: '/search',
      settings: {
        placeholder: 'Tìm kiếm bài viết, tác giả...',
        showAdvancedLink: true,
      },
      order: 7,
      isActive: true,
    },
    {
      key: 'featured_authors',
      type: 'widget',
      title: 'Tác giả tiêu biểu',
      titleEn: 'Featured Authors',
      subtitle: 'Hiển thị các tác giả nổi bật',
      subtitleEn: 'Display featured authors',
      content: null,
      imageUrl: null,
      linkUrl: null,
      settings: {
        limit: 5,
        sortBy: 'publications',
      },
      order: 8,
      isActive: true,
    },
    {
      key: 'trending_topics',
      type: 'widget',
      title: 'Chủ đề nổi bật',
      titleEn: 'Trending Topics',
      subtitle: 'Hiển thị các chủ đề đang được quan tâm',
      subtitleEn: 'Display trending topics',
      content: null,
      imageUrl: null,
      linkUrl: null,
      settings: {
        limit: 10,
        source: 'keywords',
      },
      order: 9,
      isActive: true,
    },
    {
      key: 'call_for_papers',
      type: 'widget',
      title: 'Thông báo – Tuyển bài',
      titleEn: 'Call for Papers',
      subtitle: 'Thông báo tuyển bài viết',
      subtitleEn: 'Call for paper submissions',
      content: '<p>Tạp chí đang nhận bài viết cho số đặc biệt về <strong>Công nghệ số trong Nghệ thuật Quân sự</strong>.</p><ul><li>Hạn nộp: 31/12/2025</li><li>Xuất bản dự kiến: Q1/2026</li></ul>',
      imageUrl: null,
      linkUrl: '/dashboard/author',
      linkText: 'Gửi bài ngay',
      linkTextEn: 'Submit Now',
      settings: {
        deadline: '2025-12-31',
        special: true,
      },
      order: 10,
      isActive: true,
    },
    {
      key: 'featured_issue_widget',
      type: 'widget',
      title: 'Số tạp chí mới phát hành',
      titleEn: 'Featured Issue',
      subtitle: 'Widget hiển thị số báo nổi bật',
      subtitleEn: 'Featured issue widget',
      content: null,
      imageUrl: null,
      linkUrl: '/issues/latest',
      linkText: 'Xem số mới nhất',
      linkTextEn: 'View Latest Issue',
      settings: {
        showCoverImage: true,
        showMetadata: true,
        showDownloadLink: true,
      },
      order: 11,
      isActive: true,
    },
    {
      key: 'topic_cards',
      type: 'cards',
      title: '4 Khối Chủ Đề Nổi Bật',
      titleEn: '4 Featured Topic Cards',
      subtitle: '4 khối chủ đề chính của tạp chí',
      subtitleEn: 'Four main topic areas of the journal',
      content: null,
      imageUrl: null,
      linkUrl: '/categories',
      linkText: 'Xem tất cả chuyên mục',
      linkTextEn: 'View All Categories',
      settings: {
        limit: 4,
        showIcon: true,
        showArticleCount: true,
        layout: 'grid-4',
      },
      order: 12,
      isActive: true,
    },
  ];

  // Create all sections
  for (const section of sections) {
    const created = await prisma.homepageSection.create({
      data: section,
    });
    console.log(`✅ Created section: ${created.key} (Order: ${created.order})`);
  }

  console.log(`\n✨ Successfully seeded ${sections.length} homepage sections!`);
}

main()
  .catch((error) => {
    console.error('❌ Error seeding homepage sections:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
