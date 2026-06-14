import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkSubmissionPlagiarism, savePlagiarismReport } from '@/lib/plagiarism';
import { z } from 'zod';

// Zod validation schema
const checkPlagiarismSchema = z.object({
  articleId: z.string().uuid(),
});

/**
 * GET /api/plagiarism?articleId=xxx
 * Lấy kết quả kiểm tra đạo văn
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const articleId = searchParams.get('articleId');

    if (!articleId) {
      return NextResponse.json(
        { success: false, message: 'articleId is required' },
        { status: 400 }
      );
    }

    const reports = await prisma.plagiarismReport.findMany({
      where: { articleId },
      include: {
        checker: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        checkedAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: reports,
    });
  } catch (error: any) {
    console.error('GET /api/plagiarism error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/plagiarism
 * Tạo mới kiểm tra đạo văn (giả lập similarity check)
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

    // Chỉ cho phép editor, managing editor, EIC, sysadmin kiểm tra
    const allowedRoles = ['SECTION_EDITOR', 'MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'SYSADMIN'];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validated = checkPlagiarismSchema.parse(body);

    // Kiểm tra xem article có tồn tại không
    const article = await prisma.article.findUnique({
      where: { id: validated.articleId },
      include: {
        submission: true,
      },
    });

    if (!article) {
      return NextResponse.json(
        { success: false, message: 'Article not found' },
        { status: 404 }
      );
    }

    // Thực hiện kiểm tra đạo văn bằng service nội bộ (cosine similarity)
    const result = await checkSubmissionPlagiarism(article.submissionId, 'cosine');

    // Lưu kết quả vào DB (gắn cả submissionId và articleId)
    const savedReport = await savePlagiarismReport(article.submissionId, result, session.uid);

    // Cập nhật articleId vào report vừa lưu (savePlagiarismReport chỉ lưu submissionId)
    const report = await prisma.plagiarismReport.update({
      where: { id: savedReport.id },
      data: { articleId: validated.articleId },
      include: {
        checker: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    // Gửi cảnh báo nếu similarity cao
    if (result.score > 30) {
      await prisma.notification.create({
        data: {
          userId: article.submission.createdBy,
          type: 'DEADLINE_APPROACHING',
          title: 'Cảnh báo kiểm tra tương đồng nội dung',
          message: `Bài viết "${article.submission.title}" có độ tương đồng ${result.score.toFixed(1)}%. Vui lòng kiểm tra lại.`,
          link: `/dashboard/author/submissions/${article.submissionId}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Plagiarism check completed',
      data: report,
    });
  } catch (error: any) {
    console.error('POST /api/plagiarism error:', error);
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
