/**
 * Regression tests — POST /api/submissions/[id]/decision (khâu quyết định biên tập).
 *
 * Bảo vệ các sửa đổi 2026-06-14 (xem [[editor_flow_revamp]]):
 *  - ACCEPT → ACCEPTED (KHÔNG nhảy thẳng IN_PRODUCTION)
 *  - guard isValidTransition: ACCEPT từ REVISION bị chặn (409)
 *  - canMakeDecision: không ra quyết định trên bài NEW
 *  - two-person rule: bài SECRET cần đủ EIC + SECURITY_AUDITOR mới đổi trạng thái
 *  - MINOR/MAJOR tạo deadline REVISION_SUBMIT
 *  - cập nhật trạng thái atomic (where kèm DECISION_ELIGIBLE_STATUSES)
 *  - phân quyền: vai trò không có quyền quyết định bị 403
 */

// Giữ NGUYÊN (không mock) các module thuần: rbac, workflow (state machine).
jest.mock('@prisma/client', () => ({
  SubmissionStatus: {},
  Recommendation: {},
  Decision: {},
}))
jest.mock('@/lib/auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@/lib/notification-manager', () => ({ createNotification: jest.fn().mockResolvedValue(undefined) }))
jest.mock('@/lib/services/workflow-config.service', () => ({
  getStepConfig: jest.fn().mockResolvedValue({ deadlineDays: 14 }),
}))
jest.mock('@/lib/logger', () => ({ logger: { error: jest.fn(), info: jest.fn() } }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    submission: { findUnique: jest.fn(), update: jest.fn() },
    editorDecision: { create: jest.fn(), findMany: jest.fn() },
    deadline: { findFirst: jest.fn(), create: jest.fn() },
    auditLog: { create: jest.fn() },
  },
}))

import { POST } from '../../app/api/submissions/[id]/decision/route'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const mockSession = getServerSession as jest.Mock
const db = prisma as any

function makeRequest(body: any) {
  return {
    json: async () => body,
    headers: { get: () => 'test-ip' },
  } as any
}

const ctx = (id = 'sub-1') => ({ params: { id } })

function baseSubmission(overrides: Record<string, any> = {}) {
  return {
    id: 'sub-1',
    code: 'NTQS-001',
    title: 'Nghệ thuật chiến dịch',
    status: 'UNDER_REVIEW',
    securityLevel: 'INTERNAL',
    createdBy: 'author-1',
    author: { id: 'author-1' },
    assignedEditorId: 'ed-1', // mặc định phân công cho BTV chuyên mục ed-1 (qua scope)
    reviews: [],
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  db.submission.update.mockResolvedValue({})
  db.editorDecision.create.mockResolvedValue({ id: 'dec-1' })
  db.editorDecision.findMany.mockResolvedValue([])
  db.deadline.findFirst.mockResolvedValue(null)
  db.deadline.create.mockResolvedValue({})
  db.auditLog.create.mockResolvedValue({})
})

describe('POST /api/submissions/[id]/decision', () => {
  it('ACCEPT (không mật) từ UNDER_REVIEW → cập nhật trạng thái ACCEPTED, không nhảy IN_PRODUCTION', async () => {
    mockSession.mockResolvedValue({ uid: 'eic-1', role: 'EIC', email: 'eic@ntqs.vn' })
    db.submission.findUnique.mockResolvedValue(baseSubmission())

    const res = await POST(makeRequest({ decision: 'ACCEPT', roundNo: 1 }), ctx())
    expect(res.status).toBe(200)

    expect(db.submission.update).toHaveBeenCalledTimes(1)
    const arg = db.submission.update.mock.calls[0][0]
    expect(arg.data.status).toBe('ACCEPTED')
    expect(arg.data.status).not.toBe('IN_PRODUCTION')
    // Atomic guard: where kèm danh sách trạng thái cho phép ra quyết định
    expect(arg.where.status.in).toEqual(expect.arrayContaining(['UNDER_REVIEW', 'REVISION']))
  })

  it('MAJOR từ UNDER_REVIEW → REVISION và tạo deadline REVISION_SUBMIT', async () => {
    mockSession.mockResolvedValue({ uid: 'ed-1', role: 'SECTION_EDITOR', email: 'ed@ntqs.vn' })
    db.submission.findUnique.mockResolvedValue(baseSubmission())

    const res = await POST(makeRequest({ decision: 'MAJOR', roundNo: 1 }), ctx())
    expect(res.status).toBe(200)

    expect(db.submission.update.mock.calls[0][0].data.status).toBe('REVISION')
    expect(db.deadline.create).toHaveBeenCalledTimes(1)
    expect(db.deadline.create.mock.calls[0][0].data.type).toBe('REVISION_SUBMIT')
    expect(db.deadline.create.mock.calls[0][0].data.assignedTo).toBe('author-1')
  })

  it('không tạo deadline trùng nếu đã có REVISION_SUBMIT chưa hoàn thành', async () => {
    mockSession.mockResolvedValue({ uid: 'ed-1', role: 'SECTION_EDITOR', email: 'ed@ntqs.vn' })
    db.submission.findUnique.mockResolvedValue(baseSubmission())
    db.deadline.findFirst.mockResolvedValue({ id: 'dl-existing' })

    await POST(makeRequest({ decision: 'MINOR', roundNo: 1 }), ctx())
    expect(db.deadline.create).not.toHaveBeenCalled()
  })

  it('ACCEPT từ REVISION bị guard transition chặn (409), không đổi trạng thái', async () => {
    mockSession.mockResolvedValue({ uid: 'eic-1', role: 'EIC', email: 'eic@ntqs.vn' })
    db.submission.findUnique.mockResolvedValue(baseSubmission({ status: 'REVISION' }))

    const res = await POST(makeRequest({ decision: 'ACCEPT', roundNo: 1 }), ctx())
    expect(res.status).toBe(409)
    expect(db.submission.update).not.toHaveBeenCalled()
  })

  it('REJECT từ REVISION hợp lệ → REJECTED', async () => {
    mockSession.mockResolvedValue({ uid: 'eic-1', role: 'EIC', email: 'eic@ntqs.vn' })
    db.submission.findUnique.mockResolvedValue(baseSubmission({ status: 'REVISION' }))

    const res = await POST(makeRequest({ decision: 'REJECT', roundNo: 2 }), ctx())
    expect(res.status).toBe(200)
    expect(db.submission.update.mock.calls[0][0].data.status).toBe('REJECTED')
  })

  it('không cho ra quyết định trên bài NEW (chưa phản biện) → 409', async () => {
    mockSession.mockResolvedValue({ uid: 'eic-1', role: 'EIC', email: 'eic@ntqs.vn' })
    db.submission.findUnique.mockResolvedValue(baseSubmission({ status: 'NEW' }))

    const res = await POST(makeRequest({ decision: 'ACCEPT', roundNo: 1 }), ctx())
    expect(res.status).toBe(409)
    expect(db.submission.update).not.toHaveBeenCalled()
  })

  it('vai trò không có quyền quyết định (AUTHOR) → 403', async () => {
    mockSession.mockResolvedValue({ uid: 'a-1', role: 'AUTHOR', email: 'a@ntqs.vn' })
    db.submission.findUnique.mockResolvedValue(baseSubmission())

    const res = await POST(makeRequest({ decision: 'ACCEPT', roundNo: 1 }), ctx())
    expect(res.status).toBe(403)
    expect(db.submission.update).not.toHaveBeenCalled()
  })

  it('SCOPE: BTV chuyên mục không quyết định bài KHÔNG phân công cho mình → 403', async () => {
    mockSession.mockResolvedValue({ uid: 'ed-OTHER', role: 'SECTION_EDITOR', email: 'other@ntqs.vn' })
    db.submission.findUnique.mockResolvedValue(baseSubmission({ assignedEditorId: 'ed-1' }))

    const res = await POST(makeRequest({ decision: 'ACCEPT', roundNo: 1 }), ctx())
    expect(res.status).toBe(403)
    expect(db.submission.update).not.toHaveBeenCalled()
  })

  it('SCOPE: EIC quyết định được bài phân công cho người khác (giám sát toàn bộ)', async () => {
    mockSession.mockResolvedValue({ uid: 'eic-1', role: 'EIC', email: 'eic@ntqs.vn' })
    db.submission.findUnique.mockResolvedValue(baseSubmission({ assignedEditorId: 'ed-1' }))

    const res = await POST(makeRequest({ decision: 'ACCEPT', roundNo: 1 }), ctx())
    expect(res.status).toBe(200)
  })

  describe('two-person rule cho bài SECRET', () => {
    it('ACCEPT bài SECRET chỉ mới EIC ký → CHƯA đổi trạng thái (chờ SECURITY_AUDITOR)', async () => {
      mockSession.mockResolvedValue({ uid: 'eic-1', role: 'EIC', email: 'eic@ntqs.vn' })
      db.submission.findUnique.mockResolvedValue(baseSubmission({ securityLevel: 'SECRET' }))
      db.editorDecision.findMany.mockResolvedValue([{ editor: { role: 'EIC' } }])

      const res = await POST(makeRequest({ decision: 'ACCEPT', roundNo: 1 }), ctx())
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.requiresAdditionalApproval).toBe(true)
      expect(db.submission.update).not.toHaveBeenCalled()
    })

    it('ACCEPT bài SECRET đủ EIC + SECURITY_AUDITOR → đổi sang ACCEPTED', async () => {
      mockSession.mockResolvedValue({ uid: 'sec-1', role: 'SECURITY_AUDITOR', email: 'sec@ntqs.vn' })
      db.submission.findUnique.mockResolvedValue(baseSubmission({ securityLevel: 'SECRET' }))
      db.editorDecision.findMany.mockResolvedValue([
        { editor: { role: 'EIC' } },
        { editor: { role: 'SECURITY_AUDITOR' } },
      ])

      const res = await POST(makeRequest({ decision: 'ACCEPT', roundNo: 1 }), ctx())
      expect(res.status).toBe(200)
      expect(db.submission.update).toHaveBeenCalledTimes(1)
      expect(db.submission.update.mock.calls[0][0].data.status).toBe('ACCEPTED')
    })
  })

  it('cập nhật atomic thất bại (P2025) → 409', async () => {
    mockSession.mockResolvedValue({ uid: 'eic-1', role: 'EIC', email: 'eic@ntqs.vn' })
    db.submission.findUnique.mockResolvedValue(baseSubmission())
    db.submission.update.mockRejectedValue({ code: 'P2025' })

    const res = await POST(makeRequest({ decision: 'REJECT', roundNo: 1 }), ctx())
    expect(res.status).toBe(409)
  })
})
