import { NextRequest, NextResponse } from 'next/server';
// No need to import
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Zod validation schema
const publishSchema = z.object({
  productionId: z.string().uuid(),
  issueId: z.string().uuid().optional(),
});

/**
 * POST /api/production/publish
 * Xuất bản bài viết chính thức
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Chỉ EIC và SYSADMIN mới được xuất bản
    if (!['EIC', 'SYSADMIN'].includes(session.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden - only EIC or SYSADMIN can publish' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validated = publishSchema.parse(body);

    // Lấy production record với thông tin đầy đủ
    const production = await prisma.production.findUnique({
      where: { id: validated.productionId },
      include: {
        article: {
          include: {
            submission: {
              include: {
                reviews: true,
              },
            },
            copyedits: {
              orderBy: { version: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!production) {
      return NextResponse.json(
        { success: false, message: 'Production not found' },
        { status: 404 }
      );
    }

    // Kiểm tra xem đã xuất bản chưa
    if (production.published) {
      return NextResponse.json(
        { success: false, message: 'Article already published' },
        { status: 400 }
      );
    }

    // Article phải ở trạng thái ACCEPTED hoặc IN_PRODUCTION mới được xuất bản
    if (!['ACCEPTED', 'IN_PRODUCTION'].includes(production.article.submission.status)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Article must be accepted or in production before publishing',
          details: `Current status: ${production.article.submission.status}`,
        },
        { status: 400 }
      );
    }

    // 🆕 Kiểm tra ràng buộc: Review phải hoàn thành
    const pendingReviews = production.article.submission.reviews.filter(
      (r: any) => r.status === 'pending' || r.status === 'in_progress'
    );
    if (pendingReviews.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'All reviews must be completed before publishing',
          details: `${pendingReviews.length} reviews still pending`,
        },
        { status: 400 }
      );
    }

    // 🆕 Kiểm tra ràng buộc: Copyediting phải hoàn thành (nếu có)
    if (production.article.copyedits.length > 0) {
      const latestCopyedit = production.article.copyedits[0];
      if (latestCopyedit.status !== 'completed') {
        return NextResponse.json(
          {
            success: false,
            message: 'Copyediting must be completed before publishing',
            details: `Latest copyedit status: ${latestCopyedit.status}`,
          },
          { status: 400 }
        );
      }
    }

    // Cập nhật production
    const updated = await prisma.production.update({
      where: { id: validated.productionId },
      data: {
        published: true,
        publishedAt: new Date(),
        approvedBy: session.uid,
        ...(validated.issueId && { issueId: validated.issueId }),
      },
      include: {
        article: {
          include: {
            submission: true,
          },
        },
        issue: {
          include: {
            volume: true,
          },
        },
      },
    });

    // Cập nhật trạng thái submission sang PUBLISHED
    await prisma.submission.update({
      where: { id: production.article.submissionId },
      data: { status: 'PUBLISHED' },
    });

    // Cập nhật article publishedAt
    await prisma.article.update({
      where: { id: production.articleId },
      data: { publishedAt: new Date() },
    });

    // Ghi lại vào status history
    await prisma.articleStatusHistory.create({
      data: {
        articleId: production.articleId,
        status: 'PUBLISHED',
        changedBy: session.uid,
        notes: 'Article published successfully',
      },
    });

    // 🆕 Gửi notification chi tiết cho tác giả chính
    const issueInfo = updated.issue
      ? ` trong Số ${updated.issue.number}/${updated.issue.year}`
      : '';

    await prisma.notification.create({
      data: {
        userId: production.article.submission.createdBy,
        type: 'ARTICLE_PUBLISHED',
        title: '🎉 Bài viết đã xuất bản',
        message: `Chúc mừng! Bài viết "${production.article.submission.title}" đã được xuất bản chính thức${issueInfo}. Bài viết của bạn hiện đã được công bố và có thể truy cập công khai.`,
        link: `/articles/${production.articleId}`,
      },
    });

    // Note: Co-author notifications can be added here when the co-author schema is implemented.

    return NextResponse.json({
      success: true,
      message: 'Article published successfully',
      data: updated,
    });
  } catch (error: any) {
    console.error('POST /api/production/publish error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
