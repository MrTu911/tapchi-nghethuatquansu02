/**
 * Regression tests — POST /api/production/publish (xuất bản chính thức).
 *
 * Then chốt nghiệp vụ (xem [[leadership_flow_revamp]]): quyền KÝ XUẤT BẢN cuối
 * chỉ thuộc EIC + SYSADMIN. Phó Tổng biên tập (DEPUTY_EIC) và Thư ký tòa soạn
 * (MANAGING_EDITOR) tuy điều hành toàn bộ workflow nhưng KHÔNG được publish.
 */

jest.mock('@/lib/auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@/lib/prisma', () => ({
  prisma: { production: { findUnique: jest.fn() } },
}))

import { POST } from '../../app/api/production/publish/route'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const mockSession = getServerSession as jest.Mock
const db = prisma as any

// productionId hợp lệ (uuid) để vượt qua zod, nhằm kiểm tra ranh giới vai trò
const VALID_BODY = { productionId: '00000000-0000-0000-0000-000000000001' }

function makeRequest(body: any) {
  return { json: async () => body } as any
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('POST /api/production/publish — ranh giới quyền publish', () => {
  it('DEPUTY_EIC bị chặn publish (403)', async () => {
    mockSession.mockResolvedValue({ uid: 'd-1', role: 'DEPUTY_EIC' })
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(403)
  })

  it('MANAGING_EDITOR bị chặn publish (403)', async () => {
    mockSession.mockResolvedValue({ uid: 'm-1', role: 'MANAGING_EDITOR' })
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(403)
  })

  it('SECTION_EDITOR bị chặn publish (403)', async () => {
    mockSession.mockResolvedValue({ uid: 's-1', role: 'SECTION_EDITOR' })
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(403)
  })

  it('chưa đăng nhập → 401', async () => {
    mockSession.mockResolvedValue(null)
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(401)
  })

  it('EIC vượt qua cổng vai trò (không phải 401/403)', async () => {
    mockSession.mockResolvedValue({ uid: 'e-1', role: 'EIC' })
    db.production.findUnique.mockResolvedValue(null) // không tìm thấy → 404, KHÔNG phải 403
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).not.toBe(403)
    expect(res.status).not.toBe(401)
    expect(db.production.findUnique).toHaveBeenCalled()
  })

  it('SYSADMIN vượt qua cổng vai trò', async () => {
    mockSession.mockResolvedValue({ uid: 'a-1', role: 'SYSADMIN' })
    db.production.findUnique.mockResolvedValue(null)
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).not.toBe(403)
    expect(res.status).not.toBe(401)
  })
})
