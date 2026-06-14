/**
 * Regression tests — POST /api/managing-editor/assign (phân công BTV phụ trách).
 *
 * Bảo vệ sửa đổi 2026-06-14: API nay GHI assignedEditorId (first-class) trong
 * transaction cùng deadline, thông báo cho BTV; RBAC chỉ Thư ký tòa soạn/EIC/SYSADMIN.
 */

jest.mock('@/lib/auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@/lib/audit-logger', () => ({ logAudit: jest.fn().mockResolvedValue(undefined) }))
jest.mock('@/lib/notification-manager', () => ({ createNotification: jest.fn().mockResolvedValue(undefined) }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    submission: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  },
}))

import { POST } from '../../app/api/managing-editor/assign/route'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notification-manager'

const mockSession = getServerSession as jest.Mock
const db = prisma as any
const mockNotify = createNotification as jest.Mock

const txMock = {
  submission: { update: jest.fn() },
  deadline: { create: jest.fn() },
}

function makeRequest(body: any) {
  return { json: async () => body } as any
}

beforeEach(() => {
  jest.clearAllMocks()
  txMock.submission.update.mockResolvedValue({})
  txMock.deadline.create.mockResolvedValue({ id: 'dl-1' })
  db.$transaction.mockImplementation(async (cb: any) => cb(txMock))
  db.submission.findUnique.mockResolvedValue({ id: 'sub-1', title: 'Chiến dịch', code: 'NTQS-001' })
  db.user.findUnique.mockResolvedValue({ id: 'ed-2', role: 'SECTION_EDITOR' })
})

describe('POST /api/managing-editor/assign', () => {
  it('Thư ký tòa soạn phân công → 200, ghi assignedEditorId + tạo deadline + thông báo', async () => {
    mockSession.mockResolvedValue({ uid: 'me-1', role: 'MANAGING_EDITOR', email: 'me@ntqs.vn' })

    const res = await POST(makeRequest({ submissionId: 'sub-1', editorId: 'ed-2' }))
    expect(res.status).toBe(200)

    expect(txMock.submission.update).toHaveBeenCalledTimes(1)
    expect(txMock.submission.update.mock.calls[0][0]).toMatchObject({
      where: { id: 'sub-1' },
      data: { assignedEditorId: 'ed-2' },
    })
    expect(txMock.deadline.create).toHaveBeenCalledTimes(1)
    expect(txMock.deadline.create.mock.calls[0][0].data.type).toBe('EDITOR_DECISION')
    expect(mockNotify).toHaveBeenCalledTimes(1)
    expect(mockNotify.mock.calls[0][0].userId).toBe('ed-2')
  })

  it('vai trò không đủ quyền (SECTION_EDITOR) → 403', async () => {
    mockSession.mockResolvedValue({ uid: 'ed-1', role: 'SECTION_EDITOR', email: 'ed@ntqs.vn' })
    const res = await POST(makeRequest({ submissionId: 'sub-1', editorId: 'ed-2' }))
    expect(res.status).toBe(403)
    expect(db.$transaction).not.toHaveBeenCalled()
  })

  it('thiếu trường bắt buộc → 400', async () => {
    mockSession.mockResolvedValue({ uid: 'me-1', role: 'EIC', email: 'me@ntqs.vn' })
    const res = await POST(makeRequest({ submissionId: 'sub-1' }))
    expect(res.status).toBe(400)
  })

  it('bài không tồn tại → 404', async () => {
    mockSession.mockResolvedValue({ uid: 'me-1', role: 'EIC', email: 'me@ntqs.vn' })
    db.submission.findUnique.mockResolvedValue(null)
    const res = await POST(makeRequest({ submissionId: 'x', editorId: 'ed-2' }))
    expect(res.status).toBe(404)
  })

  it('người được phân công không phải biên tập → 400', async () => {
    mockSession.mockResolvedValue({ uid: 'me-1', role: 'EIC', email: 'me@ntqs.vn' })
    db.user.findUnique.mockResolvedValue({ id: 'r-1', role: 'REVIEWER' })
    const res = await POST(makeRequest({ submissionId: 'sub-1', editorId: 'r-1' }))
    expect(res.status).toBe(400)
    expect(db.$transaction).not.toHaveBeenCalled()
  })

  it('chưa đăng nhập → 401', async () => {
    mockSession.mockResolvedValue(null)
    const res = await POST(makeRequest({ submissionId: 'sub-1', editorId: 'ed-2' }))
    expect(res.status).toBe(401)
  })
})
