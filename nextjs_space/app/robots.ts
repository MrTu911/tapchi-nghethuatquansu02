
import { MetadataRoute } from 'next';

/**
 * Dynamic robots.txt Generation
 * Hướng dẫn các công cụ tìm kiếm index nội dung
 */
export default function robots(): MetadataRoute.Robots {
  // Production deploy phải set NEXT_PUBLIC_BASE_URL (domain thật của tạp chí NTQS)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/api/',
          '/auth/',
          '/_next/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/api/',
          '/auth/',
        ],
      },
      {
        userAgent: 'Googlebot-Scholar',
        allow: '/',
        crawlDelay: 1,
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
