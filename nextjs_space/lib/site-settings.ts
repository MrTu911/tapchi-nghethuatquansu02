
import { prisma } from '@/lib/prisma';
import { cache } from 'react';

/**
 * Site Setting interface matching Prisma model
 */
export interface SiteSetting {
  id: string;
  category: string;
  key: string;
  value: string | null;
  label: string;
  labelEn: string | null;
  type: string;
  placeholder: string | null;
  helpText: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get all site settings with caching
 */
export const getAllSettings = cache(async (): Promise<SiteSetting[]> => {
  try {
    const settings = await prisma.siteSetting.findMany({
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
    });
    return settings;
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return [];
  }
});

/**
 * Get settings by category with caching
 */
export const getSettingsByCategory = cache(async (category: string): Promise<SiteSetting[]> => {
  try {
    const settings = await prisma.siteSetting.findMany({
      where: { category },
      orderBy: { order: 'asc' },
    });
    return settings;
  } catch (error) {
    console.error(`Error fetching settings for category ${category}:`, error);
    return [];
  }
});

/**
 * Get a single setting value by key with caching
 */
export const getSetting = cache(async (key: string): Promise<string | null> => {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key },
    });
    return setting?.value || null;
  } catch (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return null;
  }
});

/**
 * Get a setting with a default fallback
 */
export const getSettingWithDefault = cache(async (key: string, defaultValue: string): Promise<string> => {
  const value = await getSetting(key);
  return value || defaultValue;
});

/**
 * Get a boolean setting
 */
export const getBooleanSetting = cache(async (key: string, defaultValue = false): Promise<boolean> => {
  const value = await getSetting(key);
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
});

/**
 * Get a JSON setting (parsed)
 */
export const getJsonSetting = cache(async <T = any>(key: string, defaultValue: T | null = null): Promise<T | null> => {
  const value = await getSetting(key);
  if (!value) return defaultValue;
  
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`Error parsing JSON setting ${key}:`, error);
    return defaultValue;
  }
});

/**
 * Get settings as a key-value map for easier access
 */
export const getSettingsMap = cache(async (): Promise<Record<string, string>> => {
  const settings = await getAllSettings();
  return settings.reduce((acc, setting) => {
    if (setting.value) {
      acc[setting.key] = setting.value;
    }
    return acc;
  }, {} as Record<string, string>);
});

/**
 * Get settings by category as a key-value map
 */
export const getCategorySettingsMap = cache(async (category: string): Promise<Record<string, string>> => {
  const settings = await getSettingsByCategory(category);
  return settings.reduce((acc, setting) => {
    if (setting.value) {
      acc[setting.key] = setting.value;
    }
    return acc;
  }, {} as Record<string, string>);
});

/**
 * Get general site information
 */
export const getSiteInfo = cache(async () => {
  const [
    siteName,
    siteNameEn,
    siteDescription,
    siteDescriptionEn,
    siteLogo,
    siteFavicon,
    siteKeywords,
  ] = await Promise.all([
    getSettingWithDefault('site_name', 'Tạp chí Nghệ thuật Quân sự Việt Nam'),
    getSettingWithDefault('site_name_en', 'Journal of Vietnamese Military Art'),
    getSettingWithDefault('site_description', 'Tạp chí điện tử Khoa học Nghệ thuật quân sự'),
    getSettingWithDefault('site_description_en', 'Electronic Journal of Vietnamese Military Art'),
    getSetting('site_logo'),
    getSetting('site_favicon'),
    getSetting('site_keywords'),
  ]);

  return {
    siteName,
    siteNameEn,
    siteDescription,
    siteDescriptionEn,
    siteLogo,
    siteFavicon,
    siteKeywords,
  };
});

/**
 * Get contact information
 */
export const getContactInfo = cache(async () => {
  const [
    contactEmail,
    contactPhone,
    contactAddress,
    contactAddressEn,
    contactFax,
    contactHours,
  ] = await Promise.all([
    getSetting('contact_email'),
    getSetting('contact_phone'),
    getSetting('contact_address'),
    getSetting('contact_address_en'),
    getSetting('contact_fax'),
    getSetting('contact_hours'),
  ]);

  return {
    contactEmail,
    contactPhone,
    contactAddress,
    contactAddressEn,
    contactFax,
    contactHours,
  };
});

/**
 * Get social media links
 */
export const getSocialLinks = cache(async () => {
  const [
    facebook,
    twitter,
    linkedin,
    youtube,
    instagram,
    zalo,
  ] = await Promise.all([
    getSetting('social_facebook'),
    getSetting('social_twitter'),
    getSetting('social_linkedin'),
    getSetting('social_youtube'),
    getSetting('social_instagram'),
    getSetting('social_zalo'),
  ]);

  return {
    facebook,
    twitter,
    linkedin,
    youtube,
    instagram,
    zalo,
  };
});

/**
 * Get footer content
 */
export const getFooterContent = cache(async () => {
  const [
    footerText,
    footerTextEn,
    footerCopyright,
    footerCopyrightEn,
    footerLogo,
  ] = await Promise.all([
    getSetting('footer_text'),
    getSetting('footer_text_en'),
    getSettingWithDefault('footer_copyright', '© 2025 Tạp chí Nghệ thuật Quân sự Việt Nam. All rights reserved.'),
    getSetting('footer_copyright_en'),
    getSetting('footer_logo'),
  ]);

  return {
    footerText,
    footerTextEn,
    footerCopyright,
    footerCopyrightEn,
    footerLogo,
  };
});

/**
 * Liên kết chuyên mục hiển thị ở chân trang.
 */
export interface FooterCategoryLink {
  label: string;
  href: string;
}

// Giá trị mặc định = đúng nội dung đang hiển thị (identity NTQS), dùng làm fallback
// khi setting chưa được cấu hình trong DB.
const DEFAULT_FOOTER_CATEGORIES: FooterCategoryLink[] = [
  { label: 'Nghệ thuật quân sự', href: '/categories/nghe-thuat-quan-su' },
  { label: 'Nghiên cứu khoa học', href: '/categories/nckh' },
  { label: 'Đào tạo & Giáo dục', href: '/categories/dao-tao' },
  { label: 'Tin tức Học viện', href: '/news' },
  { label: 'Thông báo', href: '/news?category=thong_bao' },
  { label: 'Hợp tác quốc tế', href: '/news?category=hop_tac_quoc_te' },
];

/**
 * Toàn bộ nội dung thương hiệu hiển thị ở chân trang (DB-driven, có fallback NTQS).
 * Cho phép chỉnh tên tạp chí, ISSN, giấy phép, địa chỉ, liên hệ, mạng xã hội,
 * danh sách chuyên mục... từ giao diện Cài đặt mà không phải sửa code.
 */
export const getFooterBranding = cache(async () => {
  const [
    siteName,
    aboutText,
    issn,
    licenseText,
    printText,
    poBoxText,
    address,
    phone,
    email,
    hours,
    publisher,
    facebook,
    youtube,
    zalo,
    categories,
  ] = await Promise.all([
    getSettingWithDefault('site_name', 'Tạp chí Nghệ thuật Quân sự Việt Nam'),
    getSettingWithDefault(
      'footer_about_text',
      'Diễn đàn khoa học uy tín về nghệ thuật quân sự, công bố các công trình nghiên cứu có giá trị khoa học và thực tiễn cao.'
    ),
    getSettingWithDefault('site_issn', '1859-0454'),
    getSettingWithDefault(
      'footer_license_text',
      'Giấy phép hoạt động báo chí số 619/GP-BTTTT do Bộ Thông tin và Truyền thông cấp ngày 23-12-2020.'
    ),
    getSettingWithDefault('footer_print_text', 'In tại Xưởng in Học viện Quốc phòng.'),
    getSettingWithDefault('footer_pobox_text', 'Hòm thư: 2EA6 – Hà Nội.'),
    getSettingWithDefault(
      'contact_address',
      'Học viện Quốc phòng, 93 Hoàng Quốc Việt, Nghĩa Đô, Hà Nội'
    ),
    getSettingWithDefault('contact_phone', '(069) 556 635'),
    getSettingWithDefault('contact_email', 'tapchintqsvn@gmail.com'),
    getSettingWithDefault('contact_working_hours', 'Thứ 2 – Thứ 6: 8:00 – 17:00'),
    getSettingWithDefault('site_publisher', 'Học viện Quốc phòng'),
    getSettingWithDefault('social_facebook', 'https://facebook.com'),
    getSettingWithDefault('social_youtube', 'https://youtube.com'),
    getSettingWithDefault('social_zalo', 'https://zalo.me'),
    getJsonSetting<FooterCategoryLink[]>('footer_categories', DEFAULT_FOOTER_CATEGORIES),
  ]);

  return {
    siteName,
    aboutText,
    issn,
    licenseText,
    printText,
    poBoxText,
    address,
    phone,
    email,
    hours,
    publisher,
    facebook,
    youtube,
    zalo,
    categories:
      categories && categories.length > 0 ? categories : DEFAULT_FOOTER_CATEGORIES,
  };
});

/**
 * Ảnh banner header theo từng thiết bị (DB-driven, fallback về ảnh tĩnh hiện có).
 */
export const getHeaderBanners = cache(async () => {
  const [desktop, tablet, mobile] = await Promise.all([
    getSettingWithDefault('appearance_banner_desktop', '/banner-pc.png'),
    getSettingWithDefault('appearance_banner_tablet', '/banner-tablet.png'),
    getSettingWithDefault('appearance_banner_mobile', '/banner-mobile.png'),
  ]);
  return { desktop, tablet, mobile };
});

/**
 * Get SEO metadata
 */
export const getSeoMetadata = cache(async () => {
  const [
    metaTitle,
    metaTitleEn,
    metaDescription,
    metaDescriptionEn,
    metaKeywords,
    metaAuthor,
    ogImage,
  ] = await Promise.all([
    getSetting('seo_meta_title'),
    getSetting('seo_meta_title_en'),
    getSetting('seo_meta_description'),
    getSetting('seo_meta_description_en'),
    getSetting('seo_meta_keywords'),
    getSetting('seo_meta_author'),
    getSetting('seo_og_image'),
  ]);

  return {
    metaTitle,
    metaTitleEn,
    metaDescription,
    metaDescriptionEn,
    metaKeywords,
    metaAuthor,
    ogImage,
  };
});

/**
 * Get appearance settings
 */
export const getAppearanceSettings = cache(async () => {
  const [
    primaryColor,
    secondaryColor,
    accentColor,
    fontFamily,
    headerStyle,
  ] = await Promise.all([
    getSetting('appearance_primary_color'),
    getSetting('appearance_secondary_color'),
    getSetting('appearance_accent_color'),
    getSetting('appearance_font_family'),
    getSetting('appearance_header_style'),
  ]);

  return {
    primaryColor,
    secondaryColor,
    accentColor,
    fontFamily,
    headerStyle,
  };
});
