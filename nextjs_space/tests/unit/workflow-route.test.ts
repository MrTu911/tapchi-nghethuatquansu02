/**
 * Regression tests — POST /api/workflow (chuyển GIAI ĐOẠN bài nộp).
 *
 * Bảo vệ các sửa đổi 2026-06-14 (xem [[editor_flow_revamp]]):
 *  - KHÔNG tin `newStatus` từ client: trạng thái đích suy ra ở server theo action
 *  - các action quyết định (accept/reject/request_revision) bị từ chối (đã chuyển
 *    sang /api/submissions/[id]/decision)
 *  - ràng buộc trạng thái nguồn + vai trò + transition hợp lệ
 *  - cập nhật atomic (where kèm trạng thái kỳ vọng) chống race
 */

jest.mock('@prisma/client', () => ({ SubmissionStatus: {} }))
jest.mock('@/lib/auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@/lib/audit-logger', () => ({ logAudit: jest.fn().mockResolvedValue(undefined) }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    submission: { findUnique: jest.fn(), update: jest.fn() },
    notification: { create: jest.fn() },
  },
}))

import { POST } from '../../app/api/workflow/route'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const mockSession = getServerSession as jest.Mock
const db = prisma as any

function makeRequest(body: any) {
  return { json: async () => body } as any
}

function submission(overrides: Record<string, any> = {}) {
  return {
    id: 'sub-1',
    status: 'NEW',
    title: 'Chiến lược quốc phòng',
    createdBy: 'author-1',
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  db.submission.update.mockResolvedValue({})
  db.notification.create.mockResolvedValue({})
})

describe('POST /api/workflow — stage transitions', () => {
  it('SECURITY: bỏ qua newStatus client — start_production luôn set IN_PRODUCTION dù client gửi PUBLISHED', async () => {
    mockSession.mockResolvedValue({ uid: 'me-1', role: 'MANAGING_EDITOR' })
    db.submission.findUnique.mockResolvedValue(submission({ status: 'ACCEPTED' }))

    const res = await POST(makeRequest({
      submissionId: 'sub-1',
      action: 'start_production',
      newStatus: 'PUBLISHED', // client cố tình tiêm trạng thái sai
    }))

    expect(res.status).toBe(200)
    expect(db.submission.update).toHaveBeenCalledTimes(1)
    expect(db.submission.update.mock.calls[0][0].data.status).toBe('IN_PRODUCTION')
    expect(db.submission.update.mock.calls[0][0].data.status).not.toBe('PUBLISHED')
  })

  it('từ chối action quyết định "accept" (đã chuyển sang API quyết định) → 400, không update', async () => {
    mockSession.mockResolvedValue({ uid: 'me-1', role: 'MANAGING_EDITOR' })
    db.submission.findUnique.mockResolvedValue(submission({ status: 'UNDER_REVIEW' }))

    const res = await POST(makeRequest({ submissionId: 'sub-1', action: 'accept', newStatus: 'ACCEPTED' }))
    expect(res.status).toBe(400)
    expect(db.submission.update).not.toHaveBeenCalled()
  })

  it.each(['reject', 'request_revision'])('từ chối action quyết định "%s" → 400', async (action) => {
    mockSession.mockResolvedValue({ uid: 'me-1', role: 'MANAGING_EDITOR' })
    db.submission.findUnique.mockResolvedValue(submission({ status: 'UNDER_REVIEW' }))

    const res = await POST(makeRequest({ submissionId: 'sub-1', action }))
    expect(res.status).toBe(400)
    expect(db.submission.update).not.toHaveBeenCalled()
  })

  it('send_to_review hợp lệ từ NEW (SECTION_EDITOR) → UNDER_REVIEW + audit', async () => {
    mockSession.mockResolvedValue({ uid: 'ed-1', role: 'SECTION_EDITOR' })
    db.submission.findUnique.mockResolvedValue(submission({ status: 'NEW' }))

    const res = await POST(makeRequest({ submissionId: 'sub-1', action: 'send_to_review' }))
    expect(res.status).toBe(200)
    expect(db.submission.update.mock.calls[0][0].data.status).toBe('UNDER_REVIEW')
  })

  it('publish cần EIC — SECTION_EDITOR bị 403', async () => {
    mockSession.mockResolvedValue({ uid: 'ed-1', role: 'SECTION_EDITOR' })
    db.submission.findUnique.mockResolvedValue(submission({ status: 'IN_PRODUCTION' }))

    const res = await POST(makeRequest({ submissionId: 'sub-1', action: 'publish' }))
    expect(res.status).toBe(403)
    expect(db.submission.update).not.toHaveBeenCalled()
  })

  it('send_to_review trên trạng thái sai (UNDER_REVIEW) → 409', async () => {
    mockSession.mockResolvedValue({ uid: 'ed-1', role: 'SECTION_EDITOR' })
    db.submission.findUnique.mockResolvedValue(submission({ status: 'UNDER_REVIEW' }))

    const res = await POST(makeRequest({ submissionId: 'sub-1', action: 'send_to_review' }))
    expect(res.status).toBe(409)
    expect(db.submission.update).not.toHaveBeenCalled()
  })

  it('action không hợp lệ → 400', async () => {
    mockSession.mockResolvedValue({ uid: 'ed-1', role: 'SECTION_EDITOR' })
    db.submission.findUnique.mockResolvedValue(submission({ status: 'NEW' }))

    const res = await POST(makeRequest({ submissionId: 'sub-1', action: 'do_something' }))
    expect(res.status).toBe(400)
  })

  it('cập nhật atomic thất bại (P2025) → 409', async () => {
    mockSession.mockResolvedValue({ uid: 'me-1', role: 'MANAGING_EDITOR' })
    db.submission.findUnique.mockResolvedValue(submission({ status: 'ACCEPTED' }))
    db.submission.update.mockRejectedValue({ code: 'P2025' })

    const res = await POST(makeRequest({ submissionId: 'sub-1', action: 'start_production' }))
    expect(res.status).toBe(409)
  })
})
