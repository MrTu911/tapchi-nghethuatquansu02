/**
 * Regression tests — POST /api/submissions (tác giả nộp bài).
 *
 * Chốt quyền nộp bài (lib/api-guards.ts requireAuthor): chỉ
 *   AUTHOR, MANAGING_EDITOR, DEPUTY_EIC, EIC, SYSADMIN
 * mới được tạo bài nộp. READER và REVIEWER (cùng SECTION/LAYOUT/SECURITY/COMMANDER)
 * KHÔNG được nộp — phải bị 403 ở cổng RBAC, trước cả khi chạm tới xử lý file.
 *
 * Giữ NGUYÊN (không mock) api-guards + error-handler để kiểm tra guard thật;
 * chỉ mock getServerSession để điều khiển vai trò phiên.
 */

jest.mock('@/lib/auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@/lib/notification-manager', () => ({
  createNotification: jest.fn(),
  createBulkNotifications: jest.fn(),
}))
jest.mock('@/lib/logger', () => ({
  logger: { api: jest.fn(), debug: jest.fn(), info: jest.fn(), error: jest.fn(), security: jest.fn() },
}))
jest.mock('@/lib/prisma', () => ({
  prisma: { submission: { count: jest.fn(), create: jest.fn() }, submissionVersion: { create: jest.fn() }, auditLog: { create: jest.fn() } },
}))

import { POST } from '../../app/api/submissions/route'
import { getServerSession } from '@/lib/auth'

const mockSession = getServerSession as jest.Mock

function makeRequest(contentType = 'application/json') {
  return {
    url: 'http://localhost:3001/api/submissions',
    headers: new Headers({ 'content-type': contentType }),
    formData: async () => new Map() as any,
    json: async () => ({}),
  } as any
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('POST /api/submissions — quyền nộp bài', () => {
  it('chưa đăng nhập → 401', async () => {
    mockSession.mockResolvedValue(null)
    const res = await POST(makeRequest())
    expect(res.status).toBe(401)
  })

  it.each(['READER', 'REVIEWER', 'SECTION_EDITOR', 'LAYOUT_EDITOR', 'SECURITY_AUDITOR', 'COMMANDER'])(
    '%s KHÔNG được nộp bài → 403 (chặn ở cổng RBAC trước xử lý file)',
    async (role) => {
      mockSession.mockResolvedValue({ uid: 'u-1', role, email: 'x@x', fullName: 'X' })
      const res = await POST(makeRequest())
      expect(res.status).toBe(403)
    },
  )

  it.each(['AUTHOR', 'MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'SYSADMIN'])(
    '%s vượt qua cổng RBAC (không 401/403; thiếu multipart → 400 validation)',
    async (role) => {
      mockSession.mockResolvedValue({ uid: 'u-2', role, email: 'y@y', fullName: 'Y' })
      const res = await POST(makeRequest('application/json'))
      expect(res.status).not.toBe(401)
      expect(res.status).not.toBe(403)
      expect(res.status).toBe(400) // ValidationError: yêu cầu multipart/form-data
    },
  )
})
