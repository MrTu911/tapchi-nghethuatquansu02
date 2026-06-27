/**
 * Submissions API Route
 * Enhanced with error handling, validation, and logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { handleError, ValidationError, assertExists } from '@/lib/error-handler';
import { requireAuth, requireAuthor } from '@/lib/api-guards';
import { createSubmissionSchema } from '@/lib/validators';
import { createNotification, createBulkNotifications } from '@/lib/notification-manager';

/**
 * POST /api/submissions
 * Create a new submission
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate and authorize
    const session = await requireAuthor(request);
    
    logger.api('POST', '/api/submissions', { userId: session.user.id });

    // 2. Validate content-type
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      throw new ValidationError('Yêu cầu multipart/form-data để tải lên file');
    }

    // 3. Parse form data
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const abstractVn = formData.get('abstractVn') as string;
    const abstractEn = formData.get('abstractEn') as string;
    const keywords = formData.get('keywords') as string;
    const categoryId = formData.get('categoryId') as string;
    const securityLevel = (formData.get('securityLevel') as string) || 'PUBLIC';
    const file = formData.get('file') as File;

    // 4. Validate with Zod schema
    const validatedData = createSubmissionSchema.parse({
      title,
      abstract: abstractVn,
      abstractEn,
      keywords,
      categoryId,
      securityLevel,
    });

    logger.debug({
      context: 'SUBMISSION_CREATE',
      userId: session.user.id,
      title: title?.substring(0, 50),
    });

    // 5. Validate file
    if (!file) {
      throw new ValidationError('Vui lòng tải lên file bản thảo');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new ValidationError('Kích thước file vượt quá 10MB');
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type)) {
      throw new ValidationError('Chỉ chấp nhận file PDF, DOC, DOCX');
    }

    // 6. Generate submission code — count per year to avoid race condition duplicates
    const year = new Date().getFullYear();
    const yearStart = new Date(`${year}-01-01T00:00:00.000Z`);
    const yearEnd = new Date(`${year + 1}-01-01T00:00:00.000Z`);
    const countThisYear = await prisma.submission.count({
      where: { createdAt: { gte: yearStart, lt: yearEnd } },
    });
    // Pad with enough digits to survive uniqueness check in create below.
    // The unique constraint on Submission.code is the final race-condition guard.
    const code = `MS-${year}-${String(countThisYear + 1).padStart(4, '0')}`;

    // 7. Parse keywords
    const keywordArray = keywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    // 8. Handle file upload (upload to S3 first, then link to submission)
    let cloudStoragePath: string | null = null;
    let fileName: string = '';
    let fileSize: number = 0;
    let mimeType: string = '';
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { saveFile } = await import('@/lib/storage');
      const savedFile = await saveFile(buffer, file.name, file.type);

      cloudStoragePath = savedFile.key;
      fileName = file.name;
      fileSize = file.size;
      mimeType = file.type;
      
      logger.info({
        context: 'FILE_UPLOAD',
        cloudStoragePath,
        fileName,
        fileSize,
        userId: session.user.id,
      });
    } catch (fileError) {
      logger.error({
        context: 'FILE_UPLOAD_ERROR',
        error: fileError instanceof Error ? fileError.message : String(fileError),
        userId: session.user.id,
      });
      throw new ValidationError('Không thể tải lên file. Vui lòng thử lại.');
    }

    // 9. Create submission with nested file creation
    const submission = await prisma.submission.create({
      data: {
        code,
        title: validatedData.title,
        abstractVn: validatedData.abstract,
        abstractEn: validatedData.abstractEn && validatedData.abstractEn.length > 0 
          ? validatedData.abstractEn 
          : null,
        keywords: keywordArray,
        status: 'NEW',
        securityLevel: validatedData.securityLevel as any,
        categoryId: validatedData.categoryId,
        createdBy: session.user.id,
        files: cloudStoragePath
          ? {
              create: {
                originalName: fileName,
                cloudStoragePath: cloudStoragePath,
                fileType: 'MANUSCRIPT',
                mimeType: mimeType,
                fileSize: fileSize,
                uploadedBy: session.user.id,
                description: 'Bản thảo bài viết',
              },
            }
          : undefined,
      },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        files: true,
      },
    });

    // 9b. Tạo bản ghi phiên bản v1 cho bản thảo gốc → lịch sử phiên bản đầy đủ
    //     (trước đây version chỉ được tạo khi tác giả nộp bản chỉnh sửa).
    if (cloudStoragePath) {
      try {
        await prisma.submissionVersion.create({
          data: {
            submissionId: submission.id,
            versionNo: 1,
            filesetId: cloudStoragePath,
            changelog: 'Bản thảo gốc',
          },
        });
      } catch (versionError) {
        logger.error({
          context: 'SUBMISSION_VERSION_V1_ERROR',
          submissionId: submission.id,
          error: versionError instanceof Error ? versionError.message : String(versionError),
        });
        // Non-critical: không chặn việc nộp bài
      }
    }

    // 10. Create audit log
    try {
      await prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          action: 'CREATE_SUBMISSION',
          object: `submission:${submission.id}`,
          after: submission as any,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        },
      });
    } catch (auditError) {
      logger.error({
        context: 'AUDIT_LOG_ERROR',
        error: auditError instanceof Error ? auditError.message : String(auditError),
      });
      // Non-critical, continue
    }

    logger.info({
      context: 'SUBMISSION_CREATED',
      submissionId: submission.id,
      code: submission.code,
      userId: session.user.id,
    });

    // Fire-and-forget: gửi thông báo không ảnh hưởng response
    void (async () => {
      try {
        const submissionLink = `/dashboard/submissions/${submission.id}`;

        // Thông báo xác nhận cho tác giả
        await createNotification({
          userId: session.user.id,
          type: 'SUBMISSION_RECEIVED',
          title: 'Bài viết đã được nhận',
          message: `Bài viết "${submission.title}" (${submission.code}) đã được nhận và đang chờ xét duyệt.`,
          link: submissionLink,
          sendEmail: false,
        });

        // Thông báo cho toàn bộ editors
        const editors = await prisma.user.findMany({
          where: { role: { in: ['MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'SECTION_EDITOR'] } },
          select: { id: true },
        });
        if (editors.length > 0) {
          await createBulkNotifications(
            editors.map(e => e.id),
            {
              type: 'SUBMISSION_RECEIVED',
              title: 'Bài viết mới cần xét duyệt',
              message: `"${submission.title}" (${submission.code}) đã được nộp và chờ phân công phản biện.`,
              link: `/dashboard/editor/submissions/${submission.id}`,
              sendEmail: false,
            }
          );
        }
      } catch (err) {
        logger.error({ context: 'NOTIFICATION_ERROR', action: 'SUBMISSION_RECEIVED', error: String(err) });
      }
    })();

    // Fire-and-forget: tự động kiểm tra đạo văn khi nộp bài (tự nuốt lỗi, không chặn response).
    // Dynamic import: chỉ nạp engine (kèm phụ thuộc nặng) khi cần, không ở module-load.
    void import('@/lib/plagiarism')
      .then((m) => m.runAutoPlagiarismCheck(submission.id, 'ON_SUBMIT'))
      .catch((err) => logger.error({ context: 'SUBMISSION_AUTO_PLAGIARISM_ERROR', error: String(err) }));

    return NextResponse.json({
      success: true,
      data: submission,
    });
  } catch (error) {
    return handleError(error, 'API_SUBMISSIONS_POST');
  }
}

/**
 * GET /api/submissions
 * List submissions with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate
    const session = await requireAuth(request);

    logger.api('GET', '/api/submissions', { userId: session.user.id });

    // 2. Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const categoryId = searchParams.get('categoryId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));

    // 3. Phạm vi theo vai trò (RBAC scope) — chống rò danh sách bài nộp + danh tính tác giả.
    //    Trước đây chỉ AUTHOR bị giới hạn; mọi vai trò khác nhận TOÀN BỘ bài nộp kèm
    //    PII tác giả — vừa lộ bài chưa xuất bản, vừa phá phản biện kín. Xem
    //    tests/unit/submission-list-scope-route.test.ts.
    // Full-access (xem toàn bộ): MANAGING_EDITOR, DEPUTY_EIC, EIC, SYSADMIN — không cần nhánh riêng.
    const role = session.user.role;
    const NO_LIST_ACCESS_ROLES = ['READER', 'COMMANDER', 'SECURITY_AUDITOR'];
    const LAYOUT_VISIBLE_STATUSES = ['ACCEPTED', 'IN_PRODUCTION', 'PUBLISHED'];

    // Các vai trò này không có nghiệp vụ liệt kê bài nộp cá nhân ở endpoint này.
    if (NO_LIST_ACCESS_ROLES.includes(role)) {
      return NextResponse.json({
        success: true,
        submissions: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      });
    }

    const where: any = {};

    if (role === 'AUTHOR') {
      where.createdBy = session.user.id; // chỉ bài của mình
    } else if (role === 'REVIEWER') {
      where.reviews = { some: { reviewerId: session.user.id } }; // chỉ bài được phân công phản biện
    } else if (role === 'SECTION_EDITOR') {
      where.assignedEditorId = session.user.id; // chỉ bài được phân công biên tập
    } else if (role === 'LAYOUT_EDITOR') {
      where.status = { in: LAYOUT_VISIBLE_STATUSES }; // chỉ bài đã chấp nhận/đang sản xuất/đã xuất bản
    }
    // FULL_ACCESS_ROLES: không thêm giới hạn cơ sở (xem toàn bộ).

    // Bộ lọc status từ query chỉ được THU HẸP trong phạm vi vai trò, không mở rộng.
    if (status) {
      if (role === 'LAYOUT_EDITOR') {
        where.status = LAYOUT_VISIBLE_STATUSES.includes(status) ? status : { in: LAYOUT_VISIBLE_STATUSES };
      } else {
        where.status = status;
      }
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    // 4. Fetch submissions with pagination
    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        include: {
          category: true,
          author: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          reviews: true,
          decisions: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.submission.count({ where }),
    ]);

    logger.debug({
      context: 'SUBMISSIONS_FETCHED',
      userId: session.user.id,
      count: submissions.length,
      total,
    });

    return NextResponse.json({
      success: true,
      submissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleError(error, 'API_SUBMISSIONS_GET');
  }
}
