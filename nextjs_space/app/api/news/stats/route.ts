import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/responses';

/**
 * GET /api/news/stats - Thống kê nhanh cho trang quản lý tin tức.
 *
 * Gộp các phép đếm vào 1 request thay vì gọi 4 lần list (mỗi lần limit=1),
 * giúp trang quản trị nhẹ hơn khi refresh sau mỗi thao tác toggle.
 * Chỉ trả về số đếm tổng hợp, không lộ dữ liệu chi tiết.
 */
export async function GET(_req: NextRequest) {
  try {
    const [total, published, featured] = await Promise.all([
      prisma.news.count(),
      prisma.news.count({ where: { isPublished: true } }),
      prisma.news.count({ where: { isFeatured: true } }),
    ]);

    return successResponse({
      total,
      published,
      draft: total - published,
      featured,
    });
  } catch (error: any) {
    return errorResponse('Lỗi khi lấy thống kê tin tức', 500, error.message);
  }
}
