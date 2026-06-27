/**
 * Regression tests — submitRevision (lib/services/revision-service.ts).
 *
 * Bảo vệ luồng "tác giả nộp bản chỉnh sửa":
 *   - Quyền sở hữu: chỉ tác giả của bài mới được nộp lại (createdBy) → 403.
 *   - Chỉ bài đang REVISION mới nộp lại được → 400.
 *   - versionNo tính ở SERVER = maxVersionNo + 1 (không tin client, không ghi đè bản cũ).
 *   - Chuyển REVISION → UNDER_REVIEW kèm tăng revisionRound (atomic guard where status=REVISION).
 *   - changelog bắt buộc; file sai loại bị chặn (400).
 */

jest.mock('@/lib/local-storage', () => ({
  saveFile: jest.fn().mockResolvedValue({ filePath: '/uploads/rev.pdf', mimeType: 'application/pdf', fileSize: 1234 }),
}))
jest.mock('@/lib/notification-manager', () => ({ createNotification: jest.fn().mockResolvedValue(undefined) }))
jest.mock('@/lib/audit-logger', () => ({
  auditLogger: { logSuccess: jest.fn().mockResolvedValue(undefined) },
  AuditEventType: { SUBMISSION_UPDATED: 'SUBMISSION_UPDATED' },
}))
jest.mock('@/lib/logger', () => ({ logger: { error: jest.fn(), info: jest.fn() } }))
// Giữ NGUYÊN lib/workflow (state machine thuần) để guard transition là thật.
jest.mock('@/lib/prisma', () => ({
  prisma: {
    submission: { findUnique: jest.fn(), update: jest.fn() },
    submissionVersion: { findFirst: jest.fn(), create: jest.fn() },
    uploadedFile: { create: jest.fn() },
    deadline: { updateMany: jest.fn() },
    user: { findMany: jest.fn().mockResolvedValue([]) },
    $transaction: jest.fn(),
  },
}))

import { submitRevision, RevisionError } from '@/lib/services/revision-service'
import { prisma } from '@/lib/prisma'

const db = prisma as any
const AUTHOR_ID = 'author-1'
const SUB_ID = 'sub-1'

const pdfFile = { name: 'revised.pdf', type: 'application/pdf', size: 2048 } as unknown as File

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    submissionId: SUB_ID,
    authorId: AUTHOR_ID,
    authorEmail: 'a@x',
    authorRole: 'AUTHOR',
    manuscriptFile: pdfFile,
    changelog: 'Đã sửa theo góp ý',
    ...overrides,
  } as any
}

/** $transaction(cb) chạy cb với 1 tx mock; trả về kết quả cb. */
function wireTransaction(versionNo: number, revisionRound = 2) {
  db.$transaction.mockImplementation(async (cb: any) =>
    cb({
      uploadedFile: { create: jest.fn().mockResolvedValue({ id: 'file-1' }) },
      submissionVersion: { create: jest.fn().mockResolvedValue({ id: 'ver-1', versionNo }) },
      submission: { update: jest.fn().mockResolvedValue({ revisionRound }) },
      deadline: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    }),
  )
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('submitRevision — luồng nộp bản chỉnh sửa của tác giả', () => {
  it('chặn người KHÔNG phải tác giả của bài (403)', async () => {
    db.submission.findUnique.mockResolvedValue({ id: SUB_ID, code: 'C1', title: 'T', status: 'REVISION', createdBy: 'someone-else' })
    await expect(submitRevision(baseInput())).rejects.toMatchObject({ status: 403 })
    expect(db.$transaction).not.toHaveBeenCalled()
  })

  it('chặn khi bài KHÔNG ở trạng thái REVISION (400)', async () => {
    db.submission.findUnique.mockResolvedValue({ id: SUB_ID, code: 'C1', title: 'T', status: 'UNDER_REVIEW', createdBy: AUTHOR_ID })
    await expect(submitRevision(baseInput())).rejects.toMatchObject({ status: 400 })
    expect(db.$transaction).not.toHaveBeenCalled()
  })

  it('bắt buộc có changelog (400)', async () => {
    await expect(submitRevision(baseInput({ changelog: '   ' }))).rejects.toBeInstanceOf(RevisionError)
    expect(db.submission.findUnique).not.toHaveBeenCalled()
  })

  it('chặn file sai định dạng (400)', async () => {
    const badFile = { name: 'x.exe', type: 'application/x-msdownload', size: 10 } as unknown as File
    await expect(submitRevision(baseInput({ manuscriptFile: badFile }))).rejects.toMatchObject({ status: 400 })
  })

  it('versionNo = maxVersionNo + 1 (không ghi đè) và chuyển REVISION → UNDER_REVIEW', async () => {
    db.submission.findUnique.mockResolvedValue({ id: SUB_ID, code: 'C1', title: 'T', status: 'REVISION', createdBy: AUTHOR_ID })
    db.submissionVersion.findFirst.mockResolvedValue({ versionNo: 2 }) // đã có v1, v2 → bản mới phải là v3
    let capturedUpdate: any
    db.$transaction.mockImplementation(async (cb: any) =>
      cb({
        uploadedFile: { create: jest.fn().mockResolvedValue({ id: 'file-1' }) },
        submissionVersion: { create: jest.fn().mockImplementation((args: any) => ({ id: 'ver', versionNo: args.data.versionNo })) },
        submission: { update: jest.fn().mockImplementation((args: any) => { capturedUpdate = args; return { revisionRound: 2 } }) },
        deadline: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      }),
    )

    const result = await submitRevision(baseInput())

    expect(result.versionNo).toBe(3)
    expect(capturedUpdate.where).toEqual({ id: SUB_ID, status: 'REVISION' }) // guard atomic
    expect(capturedUpdate.data.status).toBe('UNDER_REVIEW')
    expect(capturedUpdate.data.revisionRound).toEqual({ increment: 1 })
  })

  it('bản chỉnh sửa ĐẦU TIÊN (chưa có version) → versionNo = 1', async () => {
    db.submission.findUnique.mockResolvedValue({ id: SUB_ID, code: 'C1', title: 'T', status: 'REVISION', createdBy: AUTHOR_ID })
    db.submissionVersion.findFirst.mockResolvedValue(null)
    wireTransaction(1)
    const result = await submitRevision(baseInput())
    expect(result.versionNo).toBe(1)
  })
})
