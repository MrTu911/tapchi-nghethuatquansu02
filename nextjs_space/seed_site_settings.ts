
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding site settings...');

  // Clear existing settings
  await prisma.siteSetting.deleteMany();
  console.log('✅ Cleared existing site settings');

  // Define default site settings organized by category
  const settings = [
    // ========== GENERAL SETTINGS ==========
    {
      category: 'general',
      key: 'site_name',
      value: 'Tạp chí Nghệ thuật Quân sự Việt Nam',
      label: 'Tên tạp chí (Tiếng Việt)',
      labelEn: 'Site Name (Vietnamese)',
      type: 'text',
      placeholder: 'Nhập tên tạp chí',
      helpText: 'Tên chính thức của tạp chí hiển thị trên toàn bộ website',
      order: 1,
    },
    {
      category: 'general',
      key: 'site_name_en',
      value: 'Journal of Vietnamese Military Art',
      label: 'Tên tạp chí (Tiếng Anh)',
      labelEn: 'Site Name (English)',
      type: 'text',
      placeholder: 'Enter journal name',
      helpText: 'Tên tạp chí bằng tiếng Anh',
      order: 2,
    },
    {
      category: 'general',
      key: 'site_description',
      value: 'Tạp chí Nghệ thuật Quân sự Việt Nam - Nơi công bố các công trình nghiên cứu khoa học về nghệ thuật quân sự',
      label: 'Mô tả tạp chí (Tiếng Việt)',
      labelEn: 'Site Description (Vietnamese)',
      type: 'textarea',
      placeholder: 'Nhập mô tả ngắn gọn',
      helpText: 'Mô tả ngắn về tạp chí (sử dụng cho SEO)',
      order: 3,
    },
    {
      category: 'general',
      key: 'site_description_en',
      value: 'Electronic Journal of Vietnamese Military Art - Publishing scientific research in military art and military science',
      label: 'Mô tả tạp chí (Tiếng Anh)',
      labelEn: 'Site Description (English)',
      type: 'textarea',
      placeholder: 'Enter description',
      helpText: 'Brief description of the journal (for SEO)',
      order: 4,
    },
    {
      category: 'general',
      key: 'site_logo',
      value: '/images/logo.png',
      label: 'Logo tạp chí',
      labelEn: 'Site Logo',
      type: 'image',
      placeholder: '/images/logo.png',
      helpText: 'URL của logo tạp chí (hiển thị ở header)',
      order: 5,
    },
    {
      category: 'general',
      key: 'site_favicon',
      value: '/favicon.svg',
      label: 'Favicon',
      labelEn: 'Favicon',
      type: 'image',
      placeholder: '/favicon.svg',
      helpText: 'Favicon của website (file .ico hoặc .svg)',
      order: 6,
    },
    {
      category: 'general',
      key: 'site_keywords',
      value: 'tạp chí, khoa học, nghệ thuật quân sự, nghiên cứu, quân đội',
      label: 'Từ khóa SEO',
      labelEn: 'SEO Keywords',
      type: 'text',
      placeholder: 'từ khóa 1, từ khóa 2, ...',
      helpText: 'Các từ khóa chính của tạp chí (phân cách bằng dấu phẩy)',
      order: 7,
    },

    // ========== CONTACT SETTINGS ==========
    {
      category: 'contact',
      key: 'contact_email',
      value: 'tapchintqsvn@gmail.com',
      label: 'Email liên hệ',
      labelEn: 'Contact Email',
      type: 'email',
      placeholder: 'email@domain.com',
      helpText: 'Email chính để liên hệ với tòa soạn',
      order: 1,
    },
    {
      category: 'contact',
      key: 'contact_phone',
      value: '+84 24 1234 5678',
      label: 'Số điện thoại',
      labelEn: 'Contact Phone',
      type: 'text',
      placeholder: '+84 24 xxxx xxxx',
      helpText: 'Số điện thoại liên hệ',
      order: 2,
    },
    {
      category: 'contact',
      key: 'contact_fax',
      value: '+84 24 1234 5679',
      label: 'Số Fax',
      labelEn: 'Fax Number',
      type: 'text',
      placeholder: '+84 24 xxxx xxxx',
      helpText: 'Số fax của tòa soạn',
      order: 3,
    },
    {
      category: 'contact',
      key: 'contact_address',
      value: 'Học viện Quốc phòng, Đường Hoàng Quốc Việt, Nghĩa Đô, Cầu Giấy, Hà Nội',
      label: 'Địa chỉ (Tiếng Việt)',
      labelEn: 'Address (Vietnamese)',
      type: 'textarea',
      placeholder: 'Nhập địa chỉ đầy đủ',
      helpText: 'Địa chỉ trụ sở tòa soạn',
      order: 4,
    },
    {
      category: 'contact',
      key: 'contact_address_en',
      value: 'National Defense Academy, 93 Hoang Quoc Viet Street, Nghia Do, Hanoi, Vietnam',
      label: 'Địa chỉ (Tiếng Anh)',
      labelEn: 'Address (English)',
      type: 'textarea',
      placeholder: 'Enter full address',
      helpText: 'Office address in English',
      order: 5,
    },
    {
      category: 'contact',
      key: 'contact_hours',
      value: 'Thứ 2 - Thứ 6: 8:00 - 17:00',
      label: 'Giờ làm việc',
      labelEn: 'Office Hours',
      type: 'text',
      placeholder: 'Thứ 2 - Thứ 6: 8:00 - 17:00',
      helpText: 'Giờ làm việc của tòa soạn',
      order: 6,
    },

    // ========== SOCIAL MEDIA SETTINGS ==========
    {
      category: 'social',
      key: 'social_facebook',
      value: 'https://facebook.com/tapchintqsvn',
      label: 'Facebook',
      labelEn: 'Facebook',
      type: 'url',
      placeholder: 'https://facebook.com/...',
      helpText: 'Link tới trang Facebook của tạp chí',
      order: 1,
    },
    {
      category: 'social',
      key: 'social_twitter',
      value: null,
      label: 'Twitter/X',
      labelEn: 'Twitter/X',
      type: 'url',
      placeholder: 'https://twitter.com/...',
      helpText: 'Link tới tài khoản Twitter/X',
      order: 2,
    },
    {
      category: 'social',
      key: 'social_linkedin',
      value: null,
      label: 'LinkedIn',
      labelEn: 'LinkedIn',
      type: 'url',
      placeholder: 'https://linkedin.com/...',
      helpText: 'Link tới trang LinkedIn',
      order: 3,
    },
    {
      category: 'social',
      key: 'social_youtube',
      value: 'https://youtube.com/@tapchintqsvn',
      label: 'YouTube',
      labelEn: 'YouTube',
      type: 'url',
      placeholder: 'https://youtube.com/...',
      helpText: 'Link tới kênh YouTube',
      order: 4,
    },
    {
      category: 'social',
      key: 'social_instagram',
      value: null,
      label: 'Instagram',
      labelEn: 'Instagram',
      type: 'url',
      placeholder: 'https://instagram.com/...',
      helpText: 'Link tới tài khoản Instagram',
      order: 5,
    },
    {
      category: 'social',
      key: 'social_zalo',
      value: null,
      label: 'Zalo',
      labelEn: 'Zalo',
      type: 'url',
      placeholder: 'https://zalo.me/...',
      helpText: 'Link tới Zalo OA',
      order: 6,
    },

    // ========== SEO SETTINGS ==========
    {
      category: 'seo',
      key: 'seo_meta_title',
      value: 'Tạp chí Nghệ thuật Quân sự Việt Nam - Nơi hội tụ tri thức',
      label: 'Meta Title (Tiếng Việt)',
      labelEn: 'Meta Title (Vietnamese)',
      type: 'text',
      placeholder: 'Nhập tiêu đề SEO',
      helpText: 'Tiêu đề mặc định cho các trang (SEO)',
      order: 1,
    },
    {
      category: 'seo',
      key: 'seo_meta_title_en',
      value: 'Journal of Vietnamese Military Art - Knowledge Hub',
      label: 'Meta Title (Tiếng Anh)',
      labelEn: 'Meta Title (English)',
      type: 'text',
      placeholder: 'Enter SEO title',
      helpText: 'Default page title in English (SEO)',
      order: 2,
    },
    {
      category: 'seo',
      key: 'seo_meta_description',
      value: 'Tạp chí Nghệ thuật Quân sự Việt Nam - Nơi công bố các công trình nghiên cứu khoa học chất lượng cao trong lĩnh vực nghệ thuật quân sự',
      label: 'Meta Description (Tiếng Việt)',
      labelEn: 'Meta Description (Vietnamese)',
      type: 'textarea',
      placeholder: 'Nhập mô tả SEO',
      helpText: 'Mô tả mặc định cho các trang (SEO)',
      order: 3,
    },
    {
      category: 'seo',
      key: 'seo_meta_description_en',
      value: 'Electronic Journal of Vietnamese Military Art - Publishing high-quality scientific research in military art and military science',
      label: 'Meta Description (Tiếng Anh)',
      labelEn: 'Meta Description (English)',
      type: 'textarea',
      placeholder: 'Enter SEO description',
      helpText: 'Default page description in English (SEO)',
      order: 4,
    },
    {
      category: 'seo',
      key: 'seo_meta_keywords',
      value: 'tạp chí khoa học, nghệ thuật quân sự, nghiên cứu khoa học, quốc phòng, an ninh',
      label: 'Meta Keywords',
      labelEn: 'Meta Keywords',
      type: 'text',
      placeholder: 'keyword1, keyword2, ...',
      helpText: 'Từ khóa SEO mặc định (phân cách bằng dấu phẩy)',
      order: 5,
    },
    {
      category: 'seo',
      key: 'seo_meta_author',
      value: 'Tạp chí Nghệ thuật Quân sự Việt Nam',
      label: 'Meta Author',
      labelEn: 'Meta Author',
      type: 'text',
      placeholder: 'Tên tác giả',
      helpText: 'Tác giả mặc định cho meta tags',
      order: 6,
    },
    {
      category: 'seo',
      key: 'seo_og_image',
      value: '/og-image.png',
      label: 'Open Graph Image',
      labelEn: 'Open Graph Image',
      type: 'image',
      placeholder: '/og-image.png',
      helpText: 'Hình ảnh hiển thị khi chia sẻ lên mạng xã hội',
      order: 7,
    },

    // ========== APPEARANCE SETTINGS ==========
    {
      category: 'appearance',
      key: 'appearance_primary_color',
      value: '#10b981',
      label: 'Màu chủ đạo',
      labelEn: 'Primary Color',
      type: 'color',
      placeholder: '#10b981',
      helpText: 'Màu chủ đạo của website (hex color)',
      order: 1,
    },
    {
      category: 'appearance',
      key: 'appearance_secondary_color',
      value: '#14b8a6',
      label: 'Màu phụ',
      labelEn: 'Secondary Color',
      type: 'color',
      placeholder: '#14b8a6',
      helpText: 'Màu phụ của website (hex color)',
      order: 2,
    },
    {
      category: 'appearance',
      key: 'appearance_accent_color',
      value: '#f59e0b',
      label: 'Màu nhấn',
      labelEn: 'Accent Color',
      type: 'color',
      placeholder: '#f59e0b',
      helpText: 'Màu nhấn cho các nút và liên kết (hex color)',
      order: 3,
    },
    {
      category: 'appearance',
      key: 'appearance_font_family',
      value: 'Inter, system-ui, sans-serif',
      label: 'Font chữ',
      labelEn: 'Font Family',
      type: 'text',
      placeholder: 'Inter, sans-serif',
      helpText: 'Font chữ chính của website',
      order: 4,
    },
    {
      category: 'appearance',
      key: 'appearance_header_style',
      value: 'modern',
      label: 'Kiểu Header',
      labelEn: 'Header Style',
      type: 'text',
      placeholder: 'modern',
      helpText: 'Kiểu hiển thị của header (modern, classic, minimal)',
      order: 5,
    },

    // ========== FOOTER SETTINGS ==========
    {
      category: 'footer',
      key: 'footer_text',
      value: 'Tạp chí Nghệ thuật Quân sự Việt Nam là ấn phẩm khoa học điện tử, xuất bản các công trình nghiên cứu chất lượng cao trong lĩnh vực nghệ thuật quân sự.',
      label: 'Nội dung Footer (Tiếng Việt)',
      labelEn: 'Footer Text (Vietnamese)',
      type: 'textarea',
      placeholder: 'Nhập nội dung giới thiệu',
      helpText: 'Nội dung giới thiệu ngắn trong footer',
      order: 1,
    },
    {
      category: 'footer',
      key: 'footer_text_en',
      value: 'The Journal of Vietnamese Military Art is an electronic scientific publication, publishing high-quality research in the field of military art and military science.',
      label: 'Nội dung Footer (Tiếng Anh)',
      labelEn: 'Footer Text (English)',
      type: 'textarea',
      placeholder: 'Enter footer text',
      helpText: 'Brief introduction text in footer (English)',
      order: 2,
    },
    {
      category: 'footer',
      key: 'footer_copyright',
      value: '© 2025 Tạp chí Nghệ thuật Quân sự Việt Nam. Bảo lưu mọi quyền.',
      label: 'Bản quyền (Tiếng Việt)',
      labelEn: 'Copyright (Vietnamese)',
      type: 'text',
      placeholder: '© 2025 ...',
      helpText: 'Thông tin bản quyền hiển thị ở footer',
      order: 3,
    },
    {
      category: 'footer',
      key: 'footer_copyright_en',
      value: '© 2025 Journal of Vietnamese Military Art. All rights reserved.',
      label: 'Bản quyền (Tiếng Anh)',
      labelEn: 'Copyright (English)',
      type: 'text',
      placeholder: '© 2025 ...',
      helpText: 'Copyright information in English',
      order: 4,
    },
    {
      category: 'footer',
      key: 'footer_logo',
      value: '/images/logo-white.png',
      label: 'Logo Footer',
      labelEn: 'Footer Logo',
      type: 'image',
      placeholder: '/images/logo-white.png',
      helpText: 'Logo hiển thị trong footer (có thể khác với logo header)',
      order: 5,
    },
  ];

  // Insert all settings
  for (const setting of settings) {
    await prisma.siteSetting.create({
      data: setting,
    });
    console.log(`✅ Created setting: ${setting.key} (${setting.category})`);
  }

  console.log(`\n✅ Successfully seeded ${settings.length} site settings!`);
  console.log('\nCategories:');
  console.log('  - general: 7 settings');
  console.log('  - contact: 6 settings');
  console.log('  - social: 6 settings');
  console.log('  - seo: 7 settings');
  console.log('  - appearance: 5 settings');
  console.log('  - footer: 5 settings');
  console.log('\n📝 Total: 36 site settings');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding site settings:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
