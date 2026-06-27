/**
 * Regression tests — POST /api/reviews/[id]/respond (phản biện viên đồng ý/từ chối lời mời).
 *
 * Bảo vệ:
 *   - Vai trò không có quyền phản biện → 403.
 *   - Quyền sở hữu: chỉ phản biện viên ĐƯỢC MỜI mới phản hồi (reviewerId) → 403 với người khác.
 *   - action không hợp lệ → 400.
 *   - Đã nộp phản biện rồi thì không đổi phản hồi lời mời → 409.
 *   - ACCEPT đặt acceptedAt; DECLINE đặt declinedAt.
 */

jest.mock('@/lib/api-guards', () => ({ requireAuth: jest.fn() }))
jest.mock('@/lib/notification-manager', () => ({ createBulkNotifications: jest.fn().mockResolvedValue(undefined) }))
jest.mock('@/lib/logger', () => ({ logger: { error: jest.fn(), info: jest.fn() } }))
// can.review giữ NGUYÊN (thuần) từ @/lib/rbac.
jest.mock('@/lib/prisma', () => ({
  prisma: {
    review: { findUnique: jest.fn(), update: jest.fn() },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
    user: { findMany: jest.fn().mockResolvedValue([]) },
  },
}))

import { POST } from '../../app/api/reviews/[id]/respond/route'
import { requireAuth } from '@/lib/api-guards'
import { prisma } from '@/lib/prisma'

const mockRequireAuth = requireAuth as jest.Mock
const db = prisma as any
const REVIEW_ID = 'rev-1'
const REVIEWER_ID = 'reviewer-1'

function makeReq(body: unknown) {
  return { json: async () => body, headers: new Headers() } as any
}
const ctx = { params: { id: REVIEW_ID } }

beforeEach(() => {
  jest.clearAllMocks()
  db.review.update.mockImplementation(async ({ data }: any) => ({ id: REVIEW_ID, ...data }))
})

describe('POST /api/reviews/[id]/respond', () => {
  it('vai trò không phải phản biện → 403', async () => {
    mockRequireAuth.mockResolvedValue({ user: { id: 'a-1', role: 'AUTHOR' } })
    const res = await POST(makeReq({ action: 'ACCEPT' }), ctx)
    expect(res.status).toBe(403)
    expect(db.review.findUnique).not.toHaveBeenCalled()
  })

  it('phản biện viên KHÁC (không sở hữu lời mời) → 403', async () => {
    mockRequireAuth.mockResolvedValue({ user: { id: 'other-rev', role: 'REVIEWER' } })
    db.review.findUnique.mockResolvedValue({ id: REVIEW_ID, reviewerId: REVIEWER_ID, submittedAt: null, declinedAt: null, submission: {}, reviewer: {} })
    const res = await POST(makeReq({ action: 'ACCEPT' }), ctx)
    expect(res.status).toBe(403)
    expect(db.review.update).not.toHaveBeenCalled()
  })

  it('action không hợp lệ → 400', async () => {
    mockRequireAuth.mockResolvedValue({ user: { id: REVIEWER_ID, role: 'REVIEWER' } })
    const res = await POST(makeReq({ action: 'MAYBE' }), ctx)
    expect(res.status).toBe(400)
  })

  it('đã nộp phản biện rồi → không đổi phản hồi lời mời (409)', async () => {
    mockRequireAuth.mockResolvedValue({ user: { id: REVIEWER_ID, role: 'REVIEWER' } })
    db.review.findUnique.mockResolvedValue({ id: REVIEW_ID, reviewerId: REVIEWER_ID, submittedAt: new Date(), declinedAt: null, submission: {}, reviewer: {} })
    const res = await POST(makeReq({ action: 'ACCEPT' }), ctx)
    expect(res.status).toBe(409)
    expect(db.review.update).not.toHaveBeenCalled()
  })

  it('ACCEPT hợp lệ → đặt acceptedAt', async () => {
    mockRequireAuth.mockResolvedValue({ user: { id: REVIEWER_ID, role: 'REVIEWER' } })
    db.review.findUnique.mockResolvedValue({ id: REVIEW_ID, reviewerId: REVIEWER_ID, submittedAt: null, declinedAt: null, submission: {}, reviewer: {} })
    const res = await POST(makeReq({ action: 'ACCEPT' }), ctx)
    expect(res.status).toBe(200)
    const updateArg = db.review.update.mock.calls[0][0]
    expect(updateArg.data.acceptedAt).toBeInstanceOf(Date)
    expect(updateArg.data.declinedAt).toBeNull()
  })

  it('DECLINE hợp lệ → đặt declinedAt', async () => {
    mockRequireAuth.mockResolvedValue({ user: { id: REVIEWER_ID, role: 'REVIEWER' } })
    db.review.findUnique.mockResolvedValue({ id: REVIEW_ID, reviewerId: REVIEWER_ID, submittedAt: null, declinedAt: null, submission: { id: 's1' }, reviewer: { fullName: 'PB' } })
    const res = await POST(makeReq({ action: 'DECLINE', reason: 'bận' }), ctx)
    expect(res.status).toBe(200)
    const updateArg = db.review.update.mock.calls[0][0]
    expect(updateArg.data.declinedAt).toBeInstanceOf(Date)
    expect(updateArg.data.acceptedAt).toBeNull()
  })
})
