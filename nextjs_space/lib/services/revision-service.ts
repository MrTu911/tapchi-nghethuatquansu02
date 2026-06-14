/**
 * Revision Service — nghiệp vụ "gửi lại bản chỉnh sửa" của tác giả.
 *
 * Tách khỏi route để giữ business logic ở service layer (architecture rule).
 * Khắc phục các lỗi của luồng cũ:
 *  - versionNo tính ở SERVER (không tin client) → tránh va chạm @@unique.
 *  - File "thư trả lời phản biện" + bản thảo chỉnh sửa lưu thành UploadedFile
 *    (gắn submissionId) → biên tập viên/tác giả truy xuất được qua /api/files/[id]/content.
 *  - coverLetter lưu vào SubmissionVersion (trước đây bị bỏ).
 *  - Tăng revisionRound; chuyển trạng thái REVISION → UNDER_REVIEW qua workflow guard.
 *  - Đóng deadline REVISION_SUBMIT; notification dùng đúng type REVISION_SUBMITTED.
 */
import type { SubmissionVersion } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { saveFile, type SaveFileResult } from '@/lib/local-storage'
import { createNotification } from '@/lib/notification-manager'
import { auditLogger, AuditEventType } from '@/lib/audit-logger'
import { isValidTransition } from '@/lib/workflow'
import { logger } from '@/lib/logger'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

/** Lỗi nghiệp vụ có kèm HTTP status để route map sang response chuẩn. */
export class RevisionError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'RevisionError'
  }
}

export interface SubmitRevisionInput {
  submissionId: string
  authorId: string
  authorEmail?: string | null
  authorRole?: string | null
  manuscriptFile: File
  responseFile?: File | null
  changelog: string
  coverLetter?: string | null
  ipAddress?: string | null
}

export interface SubmitRevisionResult {
  version: SubmissionVersion
  revisionRound: number
  versionNo: number
}

function validateUpload(file: File, label: string): void {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new RevisionError(`${label}: chỉ chấp nhận file PDF, DOC, DOCX`, 400)
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new RevisionError(`${label}: kích thước vượt quá 10MB`, 400)
  }
}

/**
 * Nộp một bản chỉnh sửa cho bài đang ở trạng thái REVISION.
 * Trả về version vừa tạo + số vòng chỉnh sửa hiện tại.
 */
export async function submitRevision(input: SubmitRevisionInput): Promise<SubmitRevisionResult> {
  // 1. Validate input
  if (!input.manuscriptFile) {
    throw new RevisionError('Vui lòng tải lên bản thảo đã chỉnh sửa', 400)
  }
  if (!input.changelog?.trim()) {
    throw new RevisionError('Vui lòng mô tả những thay đổi chính', 400)
  }
  validateUpload(input.manuscriptFile, 'Bản thảo chỉnh sửa')
  if (input.responseFile) {
    validateUpload(input.responseFile, 'Thư trả lời phản biện')
  }

  // 2. Load submission + ownership + status guard
  const submission = await prisma.submission.findUnique({
    where: { id: input.submissionId },
    select: { id: true, code: true, title: true, status: true, createdBy: true },
  })

  if (!submission) {
    throw new RevisionError('Không tìm thấy bài nộp', 404)
  }
  if (submission.createdBy !== input.authorId) {
    throw new RevisionError('Bạn không có quyền chỉnh sửa bài nộp này', 403)
  }
  if (submission.status !== 'REVISION') {
    throw new RevisionError('Bài viết không ở trạng thái cần chỉnh sửa', 400)
  }
  // Workflow guard (defensive — đảm bảo REVISION → UNDER_REVIEW hợp lệ)
  if (!isValidTransition('REVISION', 'UNDER_REVIEW')) {
    throw new RevisionError('Chuyển trạng thái không hợp lệ', 500)
  }

  // 3. Tính versionNo ở SERVER (không tin client)
  const lastVersion = await prisma.submissionVersion.findFirst({
    where: { submissionId: input.submissionId },
    orderBy: { versionNo: 'desc' },
    select: { versionNo: true },
  })
  const nextVersionNo = (lastVersion?.versionNo ?? 0) + 1

  // 4. Lưu file ra disk (ngoài transaction — IO không nên nằm trong tx)
  let manuscriptSaved: SaveFileResult
  let responseSaved: SaveFileResult | null = null
  try {
    manuscriptSaved = await saveFile(input.manuscriptFile, 'manuscript', false)
    if (input.responseFile) {
      responseSaved = await saveFile(input.responseFile, 'review-file', false)
    }
  } catch (err) {
    logger.error({ context: 'REVISION_FILE_SAVE_ERROR', submissionId: input.submissionId, error: String(err) })
    throw new RevisionError('Không thể lưu file tải lên. Vui lòng thử lại.', 400)
  }

  // 5. Ghi DB trong transaction (atomic guard chống race trạng thái)
  let result: SubmitRevisionResult
  try {
    result = await prisma.$transaction(async (tx) => {
      // Bản thảo chỉnh sửa → UploadedFile (hiển thị trong danh sách file của bài)
      await tx.uploadedFile.create({
        data: {
          originalName: input.manuscriptFile.name,
          cloudStoragePath: manuscriptSaved.filePath,
          fileType: 'MANUSCRIPT',
          mimeType: manuscriptSaved.mimeType,
          fileSize: manuscriptSaved.fileSize,
          uploadedBy: input.authorId,
          submissionId: input.submissionId,
          description: `Bản thảo chỉnh sửa - phiên bản ${nextVersionNo}`,
        },
      })

      // Thư trả lời phản biện (nếu có) → UploadedFile loại REVIEW_ATTACHMENT
      let responseFileId: string | null = null
      if (responseSaved && input.responseFile) {
        const responseUpload = await tx.uploadedFile.create({
          data: {
            originalName: input.responseFile.name,
            cloudStoragePath: responseSaved.filePath,
            fileType: 'REVIEW_ATTACHMENT',
            mimeType: responseSaved.mimeType,
            fileSize: responseSaved.fileSize,
            uploadedBy: input.authorId,
            submissionId: input.submissionId,
            description: `Thư trả lời phản biện - phiên bản ${nextVersionNo}`,
          },
        })
        responseFileId = responseUpload.id
      }

      // Bản ghi version
      const version = await tx.submissionVersion.create({
        data: {
          submissionId: input.submissionId,
          versionNo: nextVersionNo,
          filesetId: manuscriptSaved.filePath,
          changelog: input.changelog.trim(),
          coverLetter: input.coverLetter?.trim() || null,
          responseFileId,
        },
      })

      // Chuyển trạng thái với atomic guard: chỉ update nếu vẫn là REVISION
      const updated = await tx.submission.update({
        where: { id: input.submissionId, status: 'REVISION' },
        data: {
          status: 'UNDER_REVIEW',
          lastStatusChangeAt: new Date(),
          revisionRound: { increment: 1 },
        },
        select: { revisionRound: true },
      })

      // Đóng deadline nộp bản chỉnh sửa
      await tx.deadline.updateMany({
        where: { submissionId: input.submissionId, type: 'REVISION_SUBMIT', completedAt: null },
        data: { completedAt: new Date() },
      })

      return { version, revisionRound: updated.revisionRound, versionNo: nextVersionNo }
    })
  } catch (err: any) {
    // P2025: record-to-update không còn khớp where (status đã đổi giữa chừng)
    if (err?.code === 'P2025') {
      throw new RevisionError('Trạng thái bài viết vừa thay đổi, vui lòng tải lại trang', 409)
    }
    throw err
  }

  // 6. Audit log (sau khi commit)
  await auditLogger.logSuccess(AuditEventType.SUBMISSION_UPDATED, {
    userId: input.authorId,
    userEmail: input.authorEmail ?? undefined,
    userRole: input.authorRole ?? undefined,
    ipAddress: input.ipAddress ?? undefined,
    details: {
      action: 'REVISION_SUBMITTED',
      submissionId: submission.id,
      submissionCode: submission.code,
      versionNo: result.versionNo,
      revisionRound: result.revisionRound,
      hasCoverLetter: !!input.coverLetter?.trim(),
      hasResponseFile: !!responseSaved,
    },
  })

  // 7. Thông báo cho biên tập viên (đúng type REVISION_SUBMITTED)
  await notifyEditorsOfRevision(submission.id, submission.title, submission.code)

  return result
}

/** Gửi notification cho các biên tập viên đang hoạt động. */
async function notifyEditorsOfRevision(
  submissionId: string,
  title: string,
  code: string,
): Promise<void> {
  try {
    const editors = await prisma.user.findMany({
      where: { role: { in: ['EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR'] }, isActive: true },
      select: { id: true },
    })
    await Promise.all(
      editors.map((editor) =>
        createNotification({
          userId: editor.id,
          type: 'REVISION_SUBMITTED',
          title: 'Bản chỉnh sửa mới đã được nộp',
          message: `Tác giả đã nộp bản chỉnh sửa cho bài "${title}" (${code})`,
          link: `/dashboard/editor/submissions/${submissionId}`,
          sendEmail: false,
        }),
      ),
    )
  } catch (err) {
    // Non-critical: không chặn luồng nộp bản chỉnh sửa
    logger.error({ context: 'REVISION_NOTIFY_ERROR', submissionId, error: String(err) })
  }
}
