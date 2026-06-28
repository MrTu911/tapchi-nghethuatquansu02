import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit, AuditEventType } from '@/lib/audit-logger';
import { successResponse, errorResponse } from '@/lib/responses';
import { revalidatePath } from 'next/cache';
import { ISSUE_ARTICLE_COUNT_SELECT, getIssueArticleCount } from '@/lib/issue-utils';

/**
 * API để xuất bản một số tạp chí
 * POST /api/issues/publish
 * Body: { issueId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    // Chỉ EIC, SYSADMIN mới được phép xuất bản
    const allowedRoles = ['EIC', 'SYSADMIN'];
    if (!allowedRoles.includes(session.role)) {
      return errorResponse('Chỉ Tổng biên tập và Admin mới có quyền xuất bản', 403);
    }

    const { issueId } = await req.json();

    if (!issueId) {
      return errorResponse('issueId là bắt buộc', 400);
    }

    // Kiểm tra Issue tồn tại và lấy dữ liệu hiện tại
    const currentIssue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        volume: true,
        articles: {
          include: {
            submission: true,
          },
        },
        // Đếm cả bài số hóa (JournalArticle) để không chặn xuất bản các số chỉ
        // gồm bài nhập từ kho corpus.
        _count: {
          select: ISSUE_ARTICLE_COUNT_SELECT,
        },
      },
    });

    if (!currentIssue) {
      return errorResponse('Không tìm thấy số tạp chí', 404);
    }

    // Kiểm tra đã có bài báo chưa (gồm cả Article phản biện lẫn JournalArticle số hóa)
    if (getIssueArticleCount(currentIssue) === 0) {
      return errorResponse('Số tạp chí chưa có bài báo nào', 400);
    }

    // Kiểm tra đã được xuất bản chưa
    if (currentIssue.status === 'PUBLISHED') {
      return errorResponse('Số tạp chí đã được xuất bản rồi', 400);
    }

    // Xuất bản Issue
    const publishedIssue = await prisma.issue.update({
      where: { id: issueId },
      data: {
        status: 'PUBLISHED',
        publishDate: new Date(),
      },
    });

    // Cập nhật trạng thái tất cả các bài báo sang PUBLISHED
    const articleIds = currentIssue.articles.map((a) => a.id);
    await prisma.article.updateMany({
      where: { id: { in: articleIds } },
      data: {
        publishedAt: new Date(),
      },
    });

    // Cập nhật trạng thái Submission sang PUBLISHED
    const submissionIds = currentIssue.articles.map((a) => a.submissionId);
    await prisma.submission.updateMany({
      where: { id: { in: submissionIds } },
      data: {
        status: 'PUBLISHED',
      },
    });

    // Log audit
    await logAudit({
      actorId: session.uid,
      action: AuditEventType.ISSUE_PUBLISHED,
      object: 'Issue',
      before: { status: currentIssue.status, publishDate: currentIssue.publishDate },
      after: { 
        status: 'PUBLISHED', 
        publishDate: publishedIssue.publishDate,
        issueId,
        issueTitle: currentIssue.title,
        volumeNo: currentIssue.volume.volumeNo,
        issueNumber: currentIssue.number,
        articleCount: getIssueArticleCount(currentIssue),
      },
    });

    // Revalidate cache cho các trang public
    revalidatePath('/issues');
    revalidatePath(`/issues/${issueId}`);
    revalidatePath('/archive');
    revalidatePath('/issues/latest');
    revalidatePath('/');

    // Lấy dữ liệu Issue đầy đủ sau khi xuất bản
    const finalIssue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        volume: true,
        _count: {
          select: { articles: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Đã xuất bản số ${currentIssue.volume.volumeNo}.${currentIssue.number} với ${getIssueArticleCount(currentIssue)} bài báo`,
      data: {
        issue: finalIssue,
      },
    });
  } catch (error) {
    console.error('Error publishing issue:', error);
    return errorResponse('Lỗi khi xuất bản số tạp chí', 500);
  }
}
