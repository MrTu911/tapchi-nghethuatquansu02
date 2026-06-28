

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { auditLogger, AuditEventType, logAudit } from '@/lib/audit-logger';
import { saveFile, getFileUrl } from '@/lib/local-storage';
import { ISSUE_ARTICLE_COUNT_SELECT, getIssueArticleCount } from '@/lib/issue-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        volume: true,
        articles: {
          include: {
            submission: {
              include: {
                category: true,
                author: {
                  select: {
                    id: true,
                    fullName: true,
                    org: true
                  }
                }
              }
            }
          }
        },
        // Bài số hóa/nhập từ kho corpus — nguồn bài thứ hai của một số tạp chí.
        // Phải trả về cùng GET này để trang chi tiết hiển thị đủ danh sách bài.
        journalArticles: {
          orderBy: { pageStart: 'asc' },
          include: {
            authors: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                name: true,
                militaryRank: true,
                academicTitle: true,
                degree: true,
                organization: true,
                order: true,
              }
            },
            section: {
              select: { id: true, name: true, slug: true, order: true }
            }
          }
        },
        _count: {
          select: ISSUE_ARTICLE_COUNT_SELECT
        }
      }
    });

    if (!issue) {
      return NextResponse.json(
        { error: 'Không tìm thấy số tạp chí' },
        { status: 404 }
      );
    }

    // Convert stored file paths to accessible URLs
    const issueWithUrls = {
      ...issue,
      coverImage: issue.coverImage ? getFileUrl(issue.coverImage, true) : issue.coverImage,
      pdfUrl: issue.pdfUrl ? getFileUrl(issue.pdfUrl, true) : issue.pdfUrl,
    };

    return NextResponse.json({
      success: true,
      data: issueWithUrls,
      issue: issueWithUrls,
    });
  } catch (error) {
    console.error('Issue fetch error:', error);
    return NextResponse.json(
      { error: 'Lỗi tải số tạp chí' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'SYSADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Get old data for audit
    const oldIssue = await prisma.issue.findUnique({
      where: { id }
    });

    if (!oldIssue) {
      return NextResponse.json(
        { error: 'Không tìm thấy số tạp chí' },
        { status: 404 }
      );
    }

    const contentType = request.headers.get('content-type') || '';

    let volumeNo: number | undefined;
    let number: number | undefined;
    let year: number | undefined;
    let title: string | undefined;
    let description: string | undefined;
    let doi: string | undefined;
    let publishDate: Date | null | undefined;
    let status: string | undefined;
    let coverImagePath: string | undefined;
    let pdfPath: string | undefined;
    const uploadWarnings: string[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();

      const volumeNoStr = formData.get('volumeNo') as string;
      const numberStr = formData.get('number') as string;
      const yearStr = formData.get('year') as string;

      volumeNo = volumeNoStr ? parseInt(volumeNoStr) : undefined;
      number = numberStr ? parseInt(numberStr) : undefined;
      year = yearStr ? parseInt(yearStr) : undefined;
      title = (formData.get('title') as string) || undefined;
      description = (formData.get('description') as string) || undefined;
      doi = (formData.get('doi') as string) || undefined;
      status = (formData.get('status') as string) || undefined;

      const publishDateStr = formData.get('publishDate') as string;
      if (publishDateStr) publishDate = new Date(publishDateStr);

      const coverImageFile = formData.get('coverImage') as File | null;
      if (coverImageFile && coverImageFile.size > 0) {
        try {
          const result = await saveFile(coverImageFile, 'issue-cover', true);
          coverImagePath = result.filePath;
        } catch (err: any) {
          console.error('Cover image upload failed:', err);
          uploadWarnings.push('Ảnh bìa không lưu được: ' + (err.message || 'Lỗi không xác định'));
        }
      }

      const pdfFile = formData.get('pdfFile') as File | null;
      if (pdfFile && pdfFile.size > 0) {
        try {
          const result = await saveFile(pdfFile, 'issue-pdf', true);
          pdfPath = result.filePath;
        } catch (err: any) {
          console.error('PDF upload failed:', err);
          uploadWarnings.push('File PDF không lưu được: ' + (err.message || 'Lỗi không xác định'));
        }
      }
    } else {
      const body = await request.json();
      volumeNo = body.volumeNo;
      number = body.number;
      year = body.year;
      title = body.title;
      description = body.description;
      coverImagePath = body.coverImage;
      pdfPath = body.pdfUrl;
      doi = body.doi;
      publishDate = body.publishDate ? new Date(body.publishDate) : undefined;
      status = body.status;
    }

    // Find or create volume if volumeNo is provided
    let volumeId = oldIssue.volumeId;
    if (volumeNo) {
      let volume = await prisma.volume.findUnique({ where: { volumeNo } });
      if (!volume) {
        volume = await prisma.volume.create({
          data: { volumeNo, title: `Tập ${volumeNo}`, year: year || oldIssue.year }
        });
      }
      volumeId = volume.id;
    }

    const issue = await prisma.issue.update({
      where: { id },
      data: {
        volumeId,
        number: number !== undefined ? number : oldIssue.number,
        year: year !== undefined ? year : oldIssue.year,
        title: title !== undefined ? title : oldIssue.title,
        description: description !== undefined ? description : oldIssue.description,
        coverImage: coverImagePath !== undefined ? coverImagePath : oldIssue.coverImage,
        pdfUrl: pdfPath !== undefined ? pdfPath : oldIssue.pdfUrl,
        doi: doi !== undefined ? doi : oldIssue.doi,
        publishDate: publishDate !== undefined ? publishDate : oldIssue.publishDate,
        status: (status as 'DRAFT' | 'PUBLISHED' | undefined) || oldIssue.status,
      },
      include: { volume: true },
    });

    await logAudit({
      actorId: session.uid,
      action: 'ISSUE_UPDATE',
      object: `Issue:${issue.id}`,
      before: oldIssue,
      after: issue,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    return NextResponse.json({
      success: true,
      data: issue,
      issue,
      warnings: uploadWarnings.length > 0 ? uploadWarnings : undefined,
    });
  } catch (error) {
    console.error('Issue update error:', error);
    return NextResponse.json(
      { error: 'Lỗi cập nhật số tạp chí: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'SYSADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Check if issue has articles — đếm cả Article (peer-review) lẫn JournalArticle
    // (số hóa từ corpus). JournalArticle có onDelete: Cascade nên nếu không chặn,
    // việc xóa số sẽ xóa luôn hàng chục bài đã số hóa mà không cảnh báo.
    const issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        _count: {
          select: ISSUE_ARTICLE_COUNT_SELECT
        }
      }
    });

    if (!issue) {
      return NextResponse.json(
        { error: 'Không tìm thấy số tạp chí' },
        { status: 404 }
      );
    }

    if (getIssueArticleCount(issue) > 0) {
      return NextResponse.json(
        { error: 'Không thể xóa số tạp chí có bài báo. Vui lòng xóa bài báo trước.' },
        { status: 400 }
      );
    }

    await prisma.issue.delete({
      where: { id }
    });

    // Log audit
    await logAudit({
      actorId: session.uid,
      action: 'ISSUE_DELETE',
      object: `Issue:${id}`,
      before: issue,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    });

    return NextResponse.json({
      success: true,
      message: 'Xóa số tạp chí thành công'
    });
  } catch (error) {
    console.error('Issue deletion error:', error);
    return NextResponse.json(
      { error: 'Lỗi xóa số tạp chí' },
      { status: 500 }
    );
  }
}
