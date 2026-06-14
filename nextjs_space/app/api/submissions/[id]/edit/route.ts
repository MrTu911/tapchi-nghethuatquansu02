/**
 * POST /api/submissions/[id]/edit
 *
 * Tác giả sửa bài đã nộp, chỉ được phép khi status = NEW (chưa xử lý).
 * Hỗ trợ cập nhật metadata và thay thế file bản thảo (tùy chọn).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SubmissionStatus } from '@prisma/client';
import { getServerSession } from '@/lib/auth';
import { saveFile } from '@/lib/local-storage';
import { logger } from '@/lib/logger';
import { logAudit } from '@/lib/audit-logger';

const EDITABLE_STATUSES: SubmissionStatus[] = [SubmissionStatus.NEW];

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function parseKeywords(raw: string): string[] {
  return raw
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // 1. Load submission
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        files: {
          where: { fileType: 'MANUSCRIPT' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Không tìm thấy bài nộp' }, { status: 404 });
    }

    // 2. Ownership check
    if (submission.createdBy !== session.uid) {
      return NextResponse.json({ error: 'Không có quyền sửa bài này' }, { status: 403 });
    }

    // 3. Status guard — chỉ sửa khi NEW
    if (!EDITABLE_STATUSES.includes(submission.status)) {
      return NextResponse.json(
        {
          error: `Không thể sửa bài ở trạng thái "${submission.status}". Chỉ được sửa khi bài vừa nộp (NEW).`,
        },
        { status: 422 }
      );
    }

    // 4. Parse multipart form
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Yêu cầu multipart/form-data' },
        { status: 400 }
      );
    }

    const formData = await request.formData();

    const title = (formData.get('title') as string | null)?.trim();
    const abstractVn = (formData.get('abstractVn') as string | null)?.trim();
    const abstractEn = (formData.get('abstractEn') as string | null)?.trim() || null;
    const keywordsRaw = (formData.get('keywords') as string | null)?.trim();
    const categoryId = (formData.get('categoryId') as string | null) || undefined;
    const securityLevel = (formData.get('securityLevel') as string | null) || undefined;
    const newFile = formData.get('file') as File | null;

    // 5. Validate required text fields
    const errors: string[] = [];
    if (!title || title.length < 5) errors.push('Tiêu đề cần ít nhất 5 ký tự');
    if (!abstractVn || abstractVn.length < 30) errors.push('Tóm tắt tiếng Việt cần ít nhất 30 ký tự');
    if (!keywordsRaw || keywordsRaw.length < 3) errors.push('Từ khóa cần ít nhất 3 ký tự');

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join('; ') }, { status: 400 });
    }

    // 6. Validate & save new file (if provided)
    let newManuscriptPath: string | null = null;
    let newFileName: string | null = null;
    let newFileSize: number | null = null;
    let newMimeType: string | null = null;

    if (newFile && newFile.size > 0) {
      if (newFile.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'File quá lớn. Tối đa 10MB.' },
          { status: 400 }
        );
      }
      if (!ALLOWED_MIME_TYPES.includes(newFile.type)) {
        return NextResponse.json(
          { error: 'Chỉ chấp nhận file PDF, DOC, DOCX.' },
          { status: 400 }
        );
      }

      try {
        const saved = await saveFile(newFile, 'manuscript', false);
        newManuscriptPath = saved.filePath;
        newFileName = saved.fileName;
        newFileSize = saved.fileSize;
        newMimeType = saved.mimeType;
      } catch (err: any) {
        logger.error({ context: 'SUBMISSION_EDIT_FILE', error: err?.message });
        return NextResponse.json(
          { error: 'Không thể lưu file bản thảo. Vui lòng thử lại.' },
          { status: 500 }
        );
      }
    }

    // 7. Update submission metadata in a transaction
    // The `where` clause includes status to make the status-guard atomic:
    // if another actor changed the status between our check and this update,
    // Prisma throws RecordNotFound and we return 422 instead of silently overwriting.
    const updatedSubmission = await prisma.$transaction(async (tx) => {
      // 7a. Update core fields — status guard is part of the WHERE clause
      const updated = await tx.submission.update({
        where: { id, status: { in: EDITABLE_STATUSES } },
        data: {
          title: title!,
          abstractVn: abstractVn!,
          abstractEn: abstractEn && abstractEn.length > 0 ? abstractEn : null,
          keywords: parseKeywords(keywordsRaw!),
          ...(categoryId && { categoryId }),
          ...(securityLevel && { securityLevel: securityLevel as any }),
        },
      });

      // 7b. Replace manuscript file if a new one was uploaded
      if (newManuscriptPath) {
        const oldManuscript = submission.files[0];

        // Add new file record
        await tx.uploadedFile.create({
          data: {
            submissionId: id,
            originalName: newFileName!,
            cloudStoragePath: newManuscriptPath,
            fileType: 'MANUSCRIPT',
            mimeType: newMimeType!,
            fileSize: newFileSize!,
            uploadedBy: session.uid,
            description: 'Bản thảo đã chỉnh sửa trước khi biên tập',
          },
        });

        // Soft-flag old manuscript as superseded (keep for audit trail)
        // Đổi fileType sang OTHER để không bị lấy nhầm làm bản thảo hiện tại
        if (oldManuscript) {
          await tx.uploadedFile.update({
            where: { id: oldManuscript.id },
            data: {
              description: '[Superseded - thay thế bởi tác giả] ' + (oldManuscript.description || ''),
              fileType: 'OTHER',
            },
          });
        }
      }

      return updated;
    });

    // 8. Audit log
    await logAudit({
      actorId: session.uid,
      action: 'SUBMISSION_EDITED',
      object: `Submission:${id}`,
      before: {
        title: submission.title,
        abstractVn: submission.abstractVn,
        keywords: submission.keywords,
        categoryId: submission.categoryId,
        securityLevel: submission.securityLevel,
      },
      after: {
        title: updatedSubmission.title,
        abstractVn: updatedSubmission.abstractVn,
        keywords: updatedSubmission.keywords,
        categoryId: updatedSubmission.categoryId,
        securityLevel: updatedSubmission.securityLevel,
        fileReplaced: !!newManuscriptPath,
      },
    });

    logger.info({
      context: 'SUBMISSION_EDITED',
      submissionId: id,
      userId: session.uid,
      fileReplaced: !!newManuscriptPath,
    });

    return NextResponse.json({
      success: true,
      data: updatedSubmission,
    });
  } catch (error: any) {
    logger.error({ context: 'SUBMISSION_EDIT_ERROR', error: error?.message });
    // Prisma P2025 = record not found — means status changed concurrently
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Bài viết đã được xử lý bởi người khác. Vui lòng tải lại trang.' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Lỗi máy chủ. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
