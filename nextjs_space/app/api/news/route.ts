
import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/responses';
import { logAudit } from '@/lib/audit-logger';
import { getSignedImageUrl } from '@/lib/image-utils';
import { generateUniqueNewsSlug } from '@/lib/news-slug';

/** Map tham số sort của client sang orderBy của Prisma. */
function buildNewsOrderBy(sort: string | null): Prisma.NewsOrderByWithRelationInput[] {
  switch (sort) {
    case 'oldest':
      return [{ createdAt: 'asc' }];
    case 'most_viewed':
      return [{ views: 'desc' }, { createdAt: 'desc' }];
    case 'title':
      return [{ title: 'asc' }];
    case 'newest':
      return [{ createdAt: 'desc' }];
    default:
      // Mặc định: ưu tiên tin nổi bật, rồi ngày xuất bản (giữ tương thích public site)
      return [{ isFeatured: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }];
  }
}

/**
 * GET /api/news - Lấy danh sách tin tức
 * Query params: category, categories, isFeatured, isPublished, keyword, sort, page, limit
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const categories = searchParams.get('categories'); // comma-separated, e.g. "announcement,event"
    const isFeatured = searchParams.get('isFeatured');
    const isPublished = searchParams.get('isPublished');
    const keyword = searchParams.get('keyword')?.trim();
    const sort = searchParams.get('sort');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.NewsWhereInput = {};

    if (categories) {
      where.category = { in: categories.split(',').map(s => s.trim()).filter(Boolean) };
    } else if (category) {
      where.category = category;
    }
    if (isFeatured !== null) where.isFeatured = isFeatured === 'true';
    if (isPublished !== null) where.isPublished = isPublished === 'true';

    // Tìm kiếm theo tiêu đề (VI/EN) và tóm tắt — chạy ở DB, không lọc phía client
    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { titleEn: { contains: keyword, mode: 'insensitive' } },
        { summary: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [news, total] = await Promise.all([
      prisma.news.findMany({
        where,
        orderBy: buildNewsOrderBy(sort),
        take: limit,
        skip,
        include: {
          author: {
            select: {
              id: true,
              fullName: true,
              email: true,
              org: true
            }
          }
        }
      }),
      prisma.news.count({ where })
    ]);

    // Add signed URLs for cover images
    const newsWithSignedUrls = await Promise.all(
      news.map(async (item) => ({
        ...item,
        coverImageSigned: item.coverImage 
          ? await getSignedImageUrl(item.coverImage, true) 
          : null
      }))
    );

    return successResponse({
      news: newsWithSignedUrls,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    return errorResponse('Lỗi khi lấy danh sách tin tức', 500, error.message);
  }
}

/**
 * POST /api/news - Tạo tin tức mới (chỉ admin/editor)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return errorResponse('Chưa đăng nhập', 401);
    }

    // Kiểm tra quyền (chỉ admin, EIC, managing editor, section editor)
    const allowedRoles = ['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR'];
    if (!allowedRoles.includes(session.role)) {
      return errorResponse('Không có quyền tạo tin tức', 403);
    }

    const body = await req.json();
    const {
      title,
      titleEn,
      summary,
      summaryEn,
      content,
      contentEn,
      coverImage,
      category,
      tags,
      slug: slugInput,
      isPublished,
      isFeatured,
      publishedAt
    } = body;

    // Validate required fields
    if (!title || !content) {
      return errorResponse('Thiếu tiêu đề hoặc nội dung', 400);
    }

    // Slug: ưu tiên slug người dùng nhập, nếu trống thì sinh từ tiêu đề (dedupe)
    const finalSlug = await generateUniqueNewsSlug(
      slugInput && String(slugInput).trim() ? String(slugInput) : title,
    );

    const news = await prisma.news.create({
      data: {
        slug: finalSlug,
        title,
        titleEn: titleEn || null,
        summary: summary || null,
        summaryEn: summaryEn || null,
        content,
        contentEn: contentEn || null,
        coverImage: coverImage || null,
        category: category || null,
        tags: tags || [],
        isPublished: isPublished || false,
        isFeatured: isFeatured || false,
        publishedAt: publishedAt ? new Date(publishedAt) : (isPublished ? new Date() : null),
        authorId: session.uid,
        views: 0
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            email: true,
            org: true
          }
        }
      }
    });

    // Audit log
    await logAudit({
      actorId: session.uid,
      action: 'NEWS_CREATED',
      object: `News:${news.id}`,
      after: { title: news.title, category: news.category, isPublished: news.isPublished },
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined
    });

    // Chuẩn response nhất quán với GET/PUT/PATCH: data.news
    return successResponse({ news }, 'Tạo tin tức thành công', 201);
  } catch (error: any) {
    return errorResponse('Lỗi khi tạo tin tức', 500, error.message);
  }
}
