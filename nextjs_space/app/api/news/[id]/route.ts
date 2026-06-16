
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/responses';
import { logAudit } from '@/lib/audit-logger';
import { getSignedImageUrl } from '@/lib/image-utils';
import { generateUniqueNewsSlug } from '@/lib/news-slug';

const EDITOR_ROLES = ['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR'];

/**
 * GET /api/news/[id] - Lấy chi tiết tin tức
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const news = await prisma.news.findUnique({
      where: { id: params.id },
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

    if (!news) {
      return errorResponse('Không tìm thấy tin tức', 404);
    }

    // Tăng views nếu tin đã publish
    if (news.isPublished) {
      await prisma.news.update({
        where: { id: params.id },
        data: { views: { increment: 1 } }
      });
    }

    // Add signed URL for cover image
    const newsWithSignedUrl = {
      ...news,
      coverImageSigned: news.coverImage 
        ? await getSignedImageUrl(news.coverImage, true) 
        : null
    };

    return successResponse({ news: newsWithSignedUrl });
  } catch (error: any) {
    return errorResponse('Lỗi khi lấy tin tức', 500, error.message);
  }
}

/**
 * PUT /api/news/[id] - Cập nhật tin tức (chỉ admin/editor hoặc author)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return errorResponse('Chưa đăng nhập', 401);
    }

    const existingNews = await prisma.news.findUnique({
      where: { id: params.id }
    });

    if (!existingNews) {
      return errorResponse('Không tìm thấy tin tức', 404);
    }

    // Kiểm tra quyền: admin/editor hoặc tác giả
    const isEditor = EDITOR_ROLES.includes(session.role);
    const isAuthor = existingNews.authorId === session.uid;

    if (!isEditor && !isAuthor) {
      return errorResponse('Không có quyền chỉnh sửa tin tức này', 403);
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

    // Cập nhật slug khi người dùng nhập slug mới, hoặc khi tiêu đề thay đổi
    let slug = existingNews.slug;
    const trimmedSlugInput = slugInput !== undefined ? String(slugInput).trim() : '';
    if (trimmedSlugInput) {
      slug = await generateUniqueNewsSlug(trimmedSlugInput, params.id);
    } else if (title && title !== existingNews.title) {
      slug = await generateUniqueNewsSlug(title, params.id);
    }


    const updatedNews = await prisma.news.update({
      where: { id: params.id },
      data: {
        slug,
        title: title || existingNews.title,
        titleEn: titleEn !== undefined ? titleEn : existingNews.titleEn,
        summary: summary !== undefined ? summary : existingNews.summary,
        summaryEn: summaryEn !== undefined ? summaryEn : existingNews.summaryEn,
        content: content || existingNews.content,
        contentEn: contentEn !== undefined ? contentEn : existingNews.contentEn,
        coverImage: coverImage !== undefined ? coverImage : existingNews.coverImage,
        category: category !== undefined ? category : existingNews.category,
        tags: tags !== undefined ? tags : existingNews.tags,
        isPublished: isPublished !== undefined ? isPublished : existingNews.isPublished,
        isFeatured: isFeatured !== undefined ? isFeatured : existingNews.isFeatured,
        publishedAt: publishedAt !== undefined 
          ? (publishedAt ? new Date(publishedAt) : null)
          : existingNews.publishedAt,
        updatedAt: new Date()
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
      action: 'NEWS_UPDATED',
      object: `News:${updatedNews.id}`,
      after: { title: updatedNews.title },
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined
    });

    return successResponse({ news: updatedNews });
  } catch (error: any) {
    return errorResponse('Lỗi khi cập nhật tin tức', 500, error.message);
  }
}

/**
 * PATCH /api/news/[id] - Cập nhật một phần (quick toggle nổi bật / xuất bản, đổi danh mục...).
 * Chỉ cập nhật các field được gửi lên, dùng cho thao tác nhanh ở trang quản lý.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return errorResponse('Chưa đăng nhập', 401);
    }

    const existingNews = await prisma.news.findUnique({
      where: { id: params.id }
    });

    if (!existingNews) {
      return errorResponse('Không tìm thấy tin tức', 404);
    }

    // Quyền: admin/editor hoặc chính tác giả
    const isEditor = EDITOR_ROLES.includes(session.role);
    const isAuthor = existingNews.authorId === session.uid;
    if (!isEditor && !isAuthor) {
      return errorResponse('Không có quyền cập nhật tin tức này', 403);
    }

    const body = await req.json();
    const data: Record<string, unknown> = {};

    // Chỉ nhận các field hợp lệ, chỉ set field thực sự được gửi lên
    if (body.title !== undefined) data.title = body.title;
    if (body.titleEn !== undefined) data.titleEn = body.titleEn;
    if (body.summary !== undefined) data.summary = body.summary;
    if (body.summaryEn !== undefined) data.summaryEn = body.summaryEn;
    if (body.content !== undefined) data.content = body.content;
    if (body.contentEn !== undefined) data.contentEn = body.contentEn;
    if (body.coverImage !== undefined) data.coverImage = body.coverImage;
    if (body.category !== undefined) data.category = body.category;
    if (body.tags !== undefined) data.tags = body.tags;
    if (body.isFeatured !== undefined) data.isFeatured = Boolean(body.isFeatured);

    if (body.slug !== undefined && String(body.slug).trim()) {
      data.slug = await generateUniqueNewsSlug(String(body.slug), params.id);
    }

    // Khi bật xuất bản mà chưa có ngày xuất bản → đặt ngày hiện tại
    if (body.isPublished !== undefined) {
      const willPublish = Boolean(body.isPublished);
      data.isPublished = willPublish;
      if (body.publishedAt !== undefined) {
        data.publishedAt = body.publishedAt ? new Date(body.publishedAt) : null;
      } else if (willPublish && !existingNews.publishedAt) {
        data.publishedAt = new Date();
      }
    } else if (body.publishedAt !== undefined) {
      data.publishedAt = body.publishedAt ? new Date(body.publishedAt) : null;
    }

    if (Object.keys(data).length === 0) {
      return errorResponse('Không có dữ liệu cập nhật', 400);
    }

    const updatedNews = await prisma.news.update({
      where: { id: params.id },
      data,
      include: {
        author: { select: { id: true, fullName: true, email: true, org: true } }
      }
    });

    await logAudit({
      actorId: session.uid,
      action: 'NEWS_UPDATED',
      object: `News:${updatedNews.id}`,
      after: { fields: Object.keys(data), title: updatedNews.title },
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined
    });

    return successResponse({ news: updatedNews });
  } catch (error: any) {
    return errorResponse('Lỗi khi cập nhật tin tức', 500, error.message);
  }
}

/**
 * DELETE /api/news/[id] - Xóa tin tức (chỉ admin/editor)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return errorResponse('Chưa đăng nhập', 401);
    }

    // Chỉ admin/editor mới được xóa
    const allowedRoles = ['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR'];
    if (!allowedRoles.includes(session.role)) {
      return errorResponse('Không có quyền xóa tin tức', 403);
    }

    const existingNews = await prisma.news.findUnique({
      where: { id: params.id }
    });

    if (!existingNews) {
      return errorResponse('Không tìm thấy tin tức', 404);
    }

    await prisma.news.delete({
      where: { id: params.id }
    });

    // Audit log
    await logAudit({
      actorId: session.uid,
      action: 'NEWS_DELETED',
      object: `News:${params.id}`,
      after: { title: existingNews.title, category: existingNews.category },
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined
    });

    return successResponse({ message: 'Đã xóa tin tức thành công' });
  } catch (error: any) {
    return errorResponse('Lỗi khi xóa tin tức', 500, error.message);
  }
}
