/**
 * Seed script: Khởi tạo dữ liệu mặc định cho bảng SiteSetting
 * Chạy: npx ts-node prisma/seed-site-settings.ts
 * Hoặc: npx tsx prisma/seed-site-settings.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultSettings = [
  // ─── GENERAL ────────────────────────────────────────────────────────────────
  {
    category: 'general',
    key: 'site_name',
    value: 'Tạp chí Nghệ thuật Quân sự Việt Nam',
    label: 'Tên tạp chí',
    labelEn: 'Journal Name',
    type: 'text',
    placeholder: 'Nhập tên tạp chí...',
    helpText: 'Tên hiển thị chính thức của tạp chí trên website và tài liệu.',
    order: 1,
  },
  {
    category: 'general',
    key: 'site_name_short',
    value: 'NTQS',
    label: 'Tên viết tắt',
    labelEn: 'Journal Abbreviation',
    type: 'text',
    placeholder: 'VD: NTQS',
    helpText: 'Viết tắt dùng trong DOI, trích dẫn và tiêu đề ngắn.',
    order: 2,
  },
  {
    category: 'general',
    key: 'site_description',
    value: 'Tạp chí khoa học chuyên ngành nghệ thuật quân sự, công bố các công trình nghiên cứu khoa học có giá trị lý luận và thực tiễn về nghệ thuật quân sự Việt Nam.',
    label: 'Mô tả tạp chí',
    labelEn: 'Journal Description',
    type: 'textarea',
    placeholder: 'Mô tả ngắn về tạp chí...',
    helpText: 'Dùng cho meta description và phần giới thiệu trên trang chủ.',
    order: 3,
  },
  {
    category: 'general',
    key: 'site_logo',
    value: '/images/logo.png',
    label: 'Logo tạp chí',
    labelEn: 'Journal Logo',
    type: 'image',
    placeholder: '/images/logo.png',
    helpText: 'Đường dẫn tới file logo (PNG/SVG, nền trong suốt). Kích thước tối ưu: 200×60px.',
    order: 4,
  },
  {
    category: 'general',
    key: 'site_favicon',
    value: '/favicon.ico',
    label: 'Favicon',
    labelEn: 'Favicon',
    type: 'image',
    placeholder: '/favicon.ico',
    helpText: 'Icon hiển thị trên tab trình duyệt. Kích thước chuẩn: 32×32px.',
    order: 5,
  },
  {
    category: 'general',
    key: 'site_issn',
    value: '1859-0454',
    label: 'ISSN (bản in)',
    labelEn: 'Print ISSN',
    type: 'text',
    placeholder: 'XXXX-XXXX',
    helpText: 'Mã số chuẩn quốc tế cho xuất bản phẩm nhiều kỳ bản in.',
    order: 6,
  },
  {
    category: 'general',
    key: 'site_eissn',
    value: '',
    label: 'eISSN (điện tử)',
    labelEn: 'Electronic ISSN',
    type: 'text',
    placeholder: 'XXXX-XXXX',
    helpText: 'Mã ISSN cho bản điện tử.',
    order: 7,
  },
  {
    category: 'general',
    key: 'site_publisher',
    value: 'Học viện Quốc phòng',
    label: 'Đơn vị xuất bản',
    labelEn: 'Publisher',
    type: 'text',
    placeholder: 'Tên đơn vị xuất bản...',
    helpText: 'Đơn vị chủ quản / nhà xuất bản của tạp chí.',
    order: 8,
  },
  {
    category: 'general',
    key: 'submission_open',
    value: 'true',
    label: 'Nhận bài nộp',
    labelEn: 'Submissions Open',
    type: 'boolean',
    placeholder: '',
    helpText: 'Khi tắt, tác giả không thể nộp bài mới.',
    order: 9,
  },
  {
    category: 'general',
    key: 'maintenance_mode',
    value: 'false',
    label: 'Chế độ bảo trì',
    labelEn: 'Maintenance Mode',
    type: 'boolean',
    placeholder: '',
    helpText: 'Bật để hiển thị trang thông báo bảo trì thay vì trang chính.',
    order: 10,
  },

  // ─── CONTACT ────────────────────────────────────────────────────────────────
  {
    category: 'contact',
    key: 'contact_email',
    value: 'tapchintqsvn@gmail.com',
    label: 'Email liên hệ chính',
    labelEn: 'Main Contact Email',
    type: 'email',
    placeholder: 'tapchi@example.vn',
    helpText: 'Email hiển thị công khai trên trang liên hệ.',
    order: 1,
  },
  {
    category: 'contact',
    key: 'contact_email_editorial',
    value: '',
    label: 'Email Ban biên tập',
    labelEn: 'Editorial Email',
    type: 'email',
    placeholder: 'bbt@example.vn',
    helpText: 'Email nội bộ cho các vấn đề biên tập.',
    order: 2,
  },
  {
    category: 'contact',
    key: 'contact_phone',
    value: '(069) 556 635',
    label: 'Số điện thoại',
    labelEn: 'Phone Number',
    type: 'text',
    placeholder: '024 XXXX XXXX',
    helpText: 'Số điện thoại văn phòng tòa soạn.',
    order: 3,
  },
  {
    category: 'contact',
    key: 'contact_address',
    value: '93 Hoàng Quốc Việt, Nghĩa Đô, Hà Nội. Hòm thư 2EA6',
    label: 'Địa chỉ',
    labelEn: 'Address',
    type: 'textarea',
    placeholder: 'Địa chỉ đầy đủ...',
    helpText: 'Địa chỉ tòa soạn hiển thị trên trang liên hệ và footer.',
    order: 4,
  },
  {
    category: 'contact',
    key: 'contact_working_hours',
    value: 'Thứ 2 – Thứ 6: 8:00 – 17:00',
    label: 'Giờ làm việc',
    labelEn: 'Working Hours',
    type: 'text',
    placeholder: 'Thứ 2 – Thứ 6: 8:00 – 17:00',
    helpText: 'Giờ làm việc của tòa soạn.',
    order: 5,
  },

  // ─── SOCIAL ─────────────────────────────────────────────────────────────────
  {
    category: 'social',
    key: 'social_facebook',
    value: '',
    label: 'Facebook',
    labelEn: 'Facebook',
    type: 'url',
    placeholder: 'https://facebook.com/...',
    helpText: 'Đường dẫn trang Facebook của tạp chí.',
    order: 1,
  },
  {
    category: 'social',
    key: 'social_youtube',
    value: '',
    label: 'YouTube',
    labelEn: 'YouTube',
    type: 'url',
    placeholder: 'https://youtube.com/...',
    helpText: 'Kênh YouTube của tạp chí (nếu có).',
    order: 2,
  },
  {
    category: 'social',
    key: 'social_zalo',
    value: '',
    label: 'Zalo OA',
    labelEn: 'Zalo Official Account',
    type: 'url',
    placeholder: 'https://zalo.me/...',
    helpText: 'Tài khoản Zalo Official Account.',
    order: 3,
  },
  {
    category: 'social',
    key: 'social_google_scholar',
    value: '',
    label: 'Google Scholar',
    labelEn: 'Google Scholar Profile',
    type: 'url',
    placeholder: 'https://scholar.google.com/...',
    helpText: 'Trang Google Scholar của tạp chí.',
    order: 4,
  },

  // ─── SEO ────────────────────────────────────────────────────────────────────
  {
    category: 'seo',
    key: 'seo_title_template',
    value: '%s | Tạp chí Nghệ thuật Quân sự Việt Nam',
    label: 'Template tiêu đề trang',
    labelEn: 'Page Title Template',
    type: 'text',
    placeholder: '%s | Tên tạp chí',
    helpText: 'Template title cho các trang. Dùng %s cho tên trang cụ thể.',
    order: 1,
  },
  {
    category: 'seo',
    key: 'seo_meta_description',
    value: 'Tạp chí Nghệ thuật Quân sự Việt Nam - Học viện Quốc phòng. Công bố các công trình nghiên cứu khoa học về nghệ thuật quân sự, chiến lược quốc phòng và lịch sử quân sự Việt Nam.',
    label: 'Meta Description mặc định',
    labelEn: 'Default Meta Description',
    type: 'textarea',
    placeholder: 'Mô tả ngắn hiển thị trên kết quả tìm kiếm...',
    helpText: 'Dùng khi trang không có description riêng. Tối ưu 150–160 ký tự.',
    order: 2,
  },
  {
    category: 'seo',
    key: 'seo_keywords',
    value: 'nghệ thuật quân sự, chiến lược quân sự, lịch sử quân sự, Học viện Quốc phòng, tạp chí khoa học quân sự',
    label: 'Từ khóa mặc định',
    labelEn: 'Default Keywords',
    type: 'text',
    placeholder: 'từ khóa 1, từ khóa 2, ...',
    helpText: 'Các từ khóa mặc định cho meta keywords, cách nhau bằng dấu phẩy.',
    order: 3,
  },
  {
    category: 'seo',
    key: 'seo_og_image',
    value: '/images/og-image.png',
    label: 'Ảnh OG mặc định',
    labelEn: 'Default OG Image',
    type: 'image',
    placeholder: '/images/og-image.png',
    helpText: 'Ảnh hiển thị khi chia sẻ link trên mạng xã hội. Kích thước: 1200×630px.',
    order: 4,
  },
  {
    category: 'seo',
    key: 'seo_google_analytics',
    value: '',
    label: 'Google Analytics ID',
    labelEn: 'Google Analytics Tracking ID',
    type: 'text',
    placeholder: 'G-XXXXXXXXXX',
    helpText: 'ID theo dõi Google Analytics 4 (GA4).',
    order: 5,
  },
  {
    category: 'seo',
    key: 'seo_google_verification',
    value: '',
    label: 'Google Site Verification',
    labelEn: 'Google Search Console Verification',
    type: 'text',
    placeholder: 'google-site-verification=...',
    helpText: 'Mã xác minh quyền sở hữu từ Google Search Console.',
    order: 6,
  },

  // ─── APPEARANCE ─────────────────────────────────────────────────────────────
  {
    category: 'appearance',
    key: 'appearance_primary_color',
    value: '#1E3924',
    label: 'Màu chủ đạo',
    labelEn: 'Primary Color',
    type: 'color',
    placeholder: '#1E3924',
    helpText: 'Màu chính dùng cho nút, liên kết và các yếu tố nhấn mạnh.',
    order: 1,
  },
  {
    category: 'appearance',
    key: 'appearance_secondary_color',
    value: '#E5C86E',
    label: 'Màu phụ',
    labelEn: 'Secondary Color',
    type: 'color',
    placeholder: '#E5C86E',
    helpText: 'Màu thứ cấp dùng cho gradient và accent.',
    order: 2,
  },
  {
    category: 'appearance',
    key: 'appearance_header_banner',
    value: '',
    label: 'Banner tiêu đề trang chủ',
    labelEn: 'Homepage Header Banner',
    type: 'image',
    placeholder: '/images/header-banner.jpg',
    helpText: 'Ảnh banner lớn ở đầu trang chủ. Kích thước tối ưu: 1920×400px.',
    order: 3,
  },
  {
    category: 'appearance',
    key: 'appearance_articles_per_page',
    value: '10',
    label: 'Số bài hiển thị mỗi trang',
    labelEn: 'Articles Per Page',
    type: 'text',
    placeholder: '10',
    helpText: 'Số bài viết hiển thị trên các trang danh sách (mặc định: 10).',
    order: 4,
  },

  // ─── FOOTER ─────────────────────────────────────────────────────────────────
  {
    category: 'footer',
    key: 'footer_copyright',
    value: '© 2025 Tạp chí Nghệ thuật Quân sự Việt Nam - Học viện Quốc phòng. Bảo lưu mọi quyền.',
    label: 'Dòng bản quyền',
    labelEn: 'Copyright Text',
    type: 'text',
    placeholder: '© 2025 Tên tạp chí. Bảo lưu mọi quyền.',
    helpText: 'Dòng bản quyền hiển thị ở footer.',
    order: 1,
  },
  {
    category: 'footer',
    key: 'footer_tagline',
    value: 'Trí tuệ – Bản lĩnh – Sáng tạo',
    label: 'Slogan / tagline',
    labelEn: 'Tagline',
    type: 'text',
    placeholder: 'Slogan ngắn của tạp chí...',
    helpText: 'Câu slogan ngắn hiển thị dưới logo trong footer.',
    order: 2,
  },
  {
    category: 'footer',
    key: 'footer_about_text',
    value: 'Tạp chí Nghệ thuật Quân sự Việt Nam là diễn đàn khoa học của Học viện Quốc phòng, nơi công bố các công trình nghiên cứu có giá trị lý luận và thực tiễn về nghệ thuật quân sự, chiến lược và khoa học quân sự.',
    label: 'Giới thiệu ngắn (footer)',
    labelEn: 'Footer About Text',
    type: 'textarea',
    placeholder: 'Giới thiệu ngắn về tạp chí...',
    helpText: 'Đoạn mô tả ngắn hiển thị trong cột giới thiệu ở footer.',
    order: 3,
  },
  {
    category: 'footer',
    key: 'footer_show_quick_links',
    value: 'true',
    label: 'Hiển thị liên kết nhanh',
    labelEn: 'Show Quick Links',
    type: 'boolean',
    placeholder: '',
    helpText: 'Bật/tắt cột liên kết nhanh trong footer.',
    order: 4,
  },

  // ─── EXTERNAL LINKS ──────────────────────────────────────────────────────────
  {
    category: 'external_links',
    key: 'external_links',
    value: JSON.stringify([
      { title: 'Học viện Quốc phòng', url: 'https://www.nda.edu.vn', icon: 'School', order: 1, isActive: true },
      { title: 'Bộ Quốc phòng', url: 'https://www.mod.gov.vn', icon: 'Shield', order: 2, isActive: true },
      { title: 'Quân Đội Nhân Dân Việt Nam', url: 'https://www.qdnd.vn', icon: 'Newspaper', order: 3, isActive: true },
      { title: 'Cổng Thông tin Chính phủ', url: 'https://chinhphu.vn', icon: 'Globe', order: 4, isActive: true },
      { title: 'Đảng Cộng Sản Việt Nam', url: 'http://dangcongsan.vn', icon: 'Globe', order: 5, isActive: true },
      { title: 'Tạp chí Quốc phòng toàn dân', url: 'https://tapchiqptd.vn', icon: 'BookOpen', order: 6, isActive: true },
    ]),
    label: 'Danh sách liên kết trang',
    labelEn: 'External Links',
    type: 'json',
    placeholder: '',
    helpText: 'Danh sách liên kết trang đối tác hiển thị trên website. Quản lý qua tab Liên kết ngoài.',
    order: 1,
  },
];

async function main() {
  console.log('Seeding SiteSettings...');

  let created = 0;
  let skipped = 0;

  for (const setting of defaultSettings) {
    const existing = await prisma.siteSetting.findUnique({
      where: { key: setting.key },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.siteSetting.create({ data: setting });
    created++;
  }

  console.log(`Done. Created: ${created}, Skipped (already exists): ${skipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
