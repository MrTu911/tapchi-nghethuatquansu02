/**
 * Regression tests — POST /api/submissions/[id]/assign-reviewers.
 *
 * Bảo vệ các sửa đổi 2026-06-14 (xem [[editor_flow_revamp]]):
 *  - Vai trò đủ điều kiện phản biện = REVIEWER_ELIGIBLE_ROLES (gồm cả biên tập viên),
 *    khớp với TRANG chọn phản biện — không còn lệch UI↔API (chỉ chấp nhận REVIEWER).
 *  - Vòng phản biện suy từ submission.revisionRound (+1), KHÔNG phải maxRound+1 →
 *    "Cập nhật phản biện" không còn nhân đôi vòng/người.
 *  - Tạo review kèm deadline.
 *  - Chặn tác giả tự phản biện (COI), tối thiểu 2 phản biện, RBAC.
 */

jest.mock('@prisma/client', () => ({ SubmissionStatus: {}, Recommendation: {} }))
jest.mock('@/lib/auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@/lib/logger', () => ({ logger: { error: jest.fn(), info: jest.fn() } }))
jest.mock('@/lib/notification-manager', () => ({ createNotification: jest.fn().mockResolvedValue(undefined) }))
jest.mock('@/lib/services/workflow-config.service', () => ({
  getStepConfig: jest.fn().mockResolvedValue({ deadlineDays: 14 }),
}))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    submission: { findUnique: jest.fn(), update: jest.fn() },
    user: { findMany: jest.fn() },
    review: { deleteMany: jest.fn(), createMany: jest.fn(), findMany: jest.fn() },
    auditLog: { create: jest.fn() },
  },
}))

import { POST } from '../../app/api/submissions/[id]/assign-reviewers/route'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { REVIEWER_ELIGIBLE_ROLES } from '@/lib/rbac'

const mockSession = getServerSession as jest.Mock
const db = prisma as any

function makeRequest(body: any) {
  return { json: async () => body, headers: { get: () => 'test-ip' } } as any
}
const ctx = (id = 'sub-1') => ({ params: { id } })

function baseSubmission(overrides: Record<string, any> = {}) {
  return {
    id: 'sub-1',
    code: 'NTQS-001',
    title: 'Nghệ thuật tác chiến',
    status: 'NEW',
    createdBy: 'author-1',
    assignedEditorId: 'ed-1', // mặc định phân công cho BTV chuyên mục ed-1
    revisionRound: 0,
    reviews: [],
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockSession.mockResolvedValue({ uid: 'ed-1', role: 'SECTION_EDITOR', email: 'ed@ntqs.vn' })
  // Mặc định: mọi id yêu cầu đều là phản biện viên hợp lệ
  db.user.findMany.mockImplementation(async (args: any) =>
    (args.where.id.in as string[]).map((id) => ({ id })),
  )
  db.review.deleteMany.mockResolvedValue({ count: 0 })
  db.review.createMany.mockResolvedValue({ count: 0 })
  db.review.findMany.mockResolvedValue([])
  db.submission.update.mockResolvedValue({})
  db.auditLog.create.mockResolvedValue({})
})

describe('POST /api/submissions/[id]/assign-reviewers', () => {
  it('REGRESSION: truy vấn phản biện viên theo REVIEWER_ELIGIBLE_ROLES (gồm biên tập viên), không chỉ REVIEWER', async () => {
    db.submission.findUnique.mockResolvedValue(baseSubmission())

    const res = await POST(makeRequest({ reviewerIds: ['r1', 'r2'] }), ctx())
    expect(res.status).toBe(200)

    const roleFilter = db.user.findMany.mock.calls[0][0].where.role
    expect(roleFilter.in).toEqual(REVIEWER_ELIGIBLE_ROLES)
    expect(roleFilter.in).toContain('SECTION_EDITOR')
    expect(roleFilter.in).not.toBe('REVIEWER') // không còn lọc cứng 1 role
  })

  it('REGRESSION: vòng đầu (revisionRound=0) → tạo review roundNo=1 kèm deadline', async () => {
    db.submission.findUnique.mockResolvedValue(baseSubmission({ revisionRound: 0, reviews: [] }))

    await POST(makeRequest({ reviewerIds: ['r1', 'r2'] }), ctx())

    const data = db.review.createMany.mock.calls[0][0].data
    expect(data).toHaveLength(2)
    expect(data.every((d: any) => d.roundNo === 1)).toBe(true)
    expect(data.every((d: any) => d.deadline instanceof Date)).toBe(true)
  })

  it('REGRESSION: thêm phản biện ở vòng 1 KHÔNG nhảy sang vòng 2 (chống nhân đôi)', async () => {
    db.submission.findUnique.mockResolvedValue(
      baseSubmission({
        status: 'UNDER_REVIEW',
        revisionRound: 0,
        reviews: [
          { reviewerId: 'r1', roundNo: 1, submittedAt: null },
          { reviewerId: 'r2', roundNo: 1, submittedAt: null },
        ],
      }),
    )

    await POST(makeRequest({ reviewerIds: ['r1', 'r2', 'r3'] }), ctx())

    const data = db.review.createMany.mock.calls[0][0].data
    // Chỉ thêm r3, vẫn ở vòng 1 (không tạo lại r1/r2 ở vòng mới)
    expect(data).toHaveLength(1)
    expect(data[0].reviewerId).toBe('r3')
    expect(data[0].roundNo).toBe(1)
  })

  it('sau revision (revisionRound=1) → review mới ở roundNo=2', async () => {
    db.submission.findUnique.mockResolvedValue(
      baseSubmission({
        status: 'UNDER_REVIEW',
        revisionRound: 1,
        reviews: [{ reviewerId: 'r1', roundNo: 1, submittedAt: new Date() }],
      }),
    )

    await POST(makeRequest({ reviewerIds: ['r1', 'r3'] }), ctx())

    const data = db.review.createMany.mock.calls[0][0].data
    expect(data.every((d: any) => d.roundNo === 2)).toBe(true)
  })

  it('bỏ chọn một phản biện đang chờ → xoá review pending của vòng hiện tại', async () => {
    db.submission.findUnique.mockResolvedValue(
      baseSubmission({
        status: 'UNDER_REVIEW',
        revisionRound: 0,
        reviews: [
          { reviewerId: 'r1', roundNo: 1, submittedAt: null },
          { reviewerId: 'r2', roundNo: 1, submittedAt: null },
        ],
      }),
    )

    await POST(makeRequest({ reviewerIds: ['r1', 'r3'] }), ctx())

    expect(db.review.deleteMany).toHaveBeenCalledTimes(1)
    const where = db.review.deleteMany.mock.calls[0][0].where
    expect(where.reviewerId.in).toEqual(['r2'])
    expect(where.submittedAt).toBeNull()
    expect(where.roundNo).toBe(1)
  })

  it('COI: không cho gán tác giả làm phản biện → 400, không tạo review', async () => {
    db.submission.findUnique.mockResolvedValue(baseSubmission({ createdBy: 'author-1' }))

    const res = await POST(makeRequest({ reviewerIds: ['author-1', 'r2'] }), ctx())
    expect(res.status).toBe(400)
    expect(db.review.createMany).not.toHaveBeenCalled()
  })

  it('cần tối thiểu 2 phản biện → 400', async () => {
    db.submission.findUnique.mockResolvedValue(baseSubmission())
    const res = await POST(makeRequest({ reviewerIds: ['r1'] }), ctx())
    expect(res.status).toBe(400)
  })

  it('người không hợp lệ (không đủ điều kiện) → 400', async () => {
    db.submission.findUnique.mockResolvedValue(baseSubmission())
    // chỉ r1 hợp lệ, r2 bị loại (vd. không active / sai role)
    db.user.findMany.mockResolvedValue([{ id: 'r1' }])

    const res = await POST(makeRequest({ reviewerIds: ['r1', 'r2'] }), ctx())
    expect(res.status).toBe(400)
    expect(db.review.createMany).not.toHaveBeenCalled()
  })

  it('RBAC: vai trò không có quyền gán (AUTHOR) → 403', async () => {
    mockSession.mockResolvedValue({ uid: 'a-1', role: 'AUTHOR', email: 'a@ntqs.vn' })
    db.submission.findUnique.mockResolvedValue(baseSubmission())

    const res = await POST(makeRequest({ reviewerIds: ['r1', 'r2'] }), ctx())
    expect(res.status).toBe(403)
  })

  it('SCOPE: BTV chuyên mục không gán phản biện cho bài KHÔNG phân công → 403', async () => {
    mockSession.mockResolvedValue({ uid: 'ed-OTHER', role: 'SECTION_EDITOR', email: 'other@ntqs.vn' })
    db.submission.findUnique.mockResolvedValue(baseSubmission({ assignedEditorId: 'ed-1' }))

    const res = await POST(makeRequest({ reviewerIds: ['r1', 'r2'] }), ctx())
    expect(res.status).toBe(403)
    expect(db.review.createMany).not.toHaveBeenCalled()
  })

  it('chuyển NEW → UNDER_REVIEW với guard atomic (where.status=NEW)', async () => {
    db.submission.findUnique.mockResolvedValue(baseSubmission({ status: 'NEW' }))

    await POST(makeRequest({ reviewerIds: ['r1', 'r2'] }), ctx())

    expect(db.submission.update).toHaveBeenCalledTimes(1)
    const arg = db.submission.update.mock.calls[0][0]
    expect(arg.where.status).toBe('NEW')
    expect(arg.data.status).toBe('UNDER_REVIEW')
  })
})
