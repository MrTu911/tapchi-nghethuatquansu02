/**
 * Regression tests — GET /api/submissions (lọc danh sách bài nộp theo vai trò).
 *
 * Bối cảnh (phát hiện qua smoke `npm run smoke:roles`, 2026-06-27):
 *   Trước khi vá, endpoint chỉ giới hạn `createdBy` cho AUTHOR; mọi vai trò khác
 *   (kể cả READER, REVIEWER) nhận TOÀN BỘ bài nộp kèm danh tính tác giả — vừa rò
 *   thông tin mật (bài chưa xuất bản), vừa phá phản biện kín (blind review).
 *
 * Quy tắc đúng (SSOT lib/rbac.ts + nghiệp vụ NTQS):
 *   - AUTHOR            → chỉ bài của mình (createdBy)
 *   - REVIEWER          → chỉ bài mình được phân công phản biện (reviews.some.reviewerId)
 *   - SECTION_EDITOR    → chỉ bài được phân công biên tập (assignedEditorId)
 *   - LAYOUT_EDITOR     → chỉ bài đã chấp nhận/đang sản xuất/đã xuất bản
 *   - MANAGING/DEPUTY/EIC/SYSADMIN → toàn quyền (không giới hạn cơ sở)
 *   - READER/COMMANDER/SECURITY_AUDITOR → KHÔNG liệt kê bài nộp ở endpoint này (rỗng)
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
  prisma: { submission: { findMany: jest.fn(), count: jest.fn() } },
}))

import { GET } from '../../app/api/submissions/route'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const mockSession = getServerSession as jest.Mock
const db = prisma as any

const UID = 'user-self-1'

function makeGetRequest(query = '') {
  return {
    url: `http://localhost:3001/api/submissions${query ? `?${query}` : ''}`,
    nextUrl: { searchParams: new URLSearchParams(query) },
    headers: new Headers(),
  } as any
}

function whereOfLastFindMany(): any {
  const calls = db.submission.findMany.mock.calls
  return calls.length ? calls[calls.length - 1][0].where : undefined
}

beforeEach(() => {
  jest.clearAllMocks()
  db.submission.findMany.mockResolvedValue([])
  db.submission.count.mockResolvedValue(0)
})

describe('GET /api/submissions — phạm vi theo vai trò (chống rò danh sách bài nộp)', () => {
  it('AUTHOR chỉ thấy bài của mình (createdBy)', async () => {
    mockSession.mockResolvedValue({ uid: UID, role: 'AUTHOR', email: 'a@x' })
    await GET(makeGetRequest())
    expect(whereOfLastFindMany().createdBy).toBe(UID)
  })

  it('REVIEWER chỉ thấy bài mình được phân công phản biện', async () => {
    mockSession.mockResolvedValue({ uid: UID, role: 'REVIEWER', email: 'r@x' })
    await GET(makeGetRequest())
    const where = whereOfLastFindMany()
    expect(where.reviews).toEqual({ some: { reviewerId: UID } })
    expect(where.createdBy).toBeUndefined()
  })

  it('SECTION_EDITOR chỉ thấy bài được phân công biên tập (assignedEditorId)', async () => {
    mockSession.mockResolvedValue({ uid: UID, role: 'SECTION_EDITOR', email: 's@x' })
    await GET(makeGetRequest())
    expect(whereOfLastFindMany().assignedEditorId).toBe(UID)
  })

  it('LAYOUT_EDITOR chỉ thấy bài đã chấp nhận/đang sản xuất/đã xuất bản', async () => {
    mockSession.mockResolvedValue({ uid: UID, role: 'LAYOUT_EDITOR', email: 'l@x' })
    await GET(makeGetRequest())
    expect(whereOfLastFindMany().status).toEqual({ in: ['ACCEPTED', 'IN_PRODUCTION', 'PUBLISHED'] })
  })

  it('LAYOUT_EDITOR không thể dùng query status để vượt phạm vi (status=NEW bị bỏ qua)', async () => {
    mockSession.mockResolvedValue({ uid: UID, role: 'LAYOUT_EDITOR', email: 'l@x' })
    await GET(makeGetRequest('status=NEW'))
    expect(whereOfLastFindMany().status).toEqual({ in: ['ACCEPTED', 'IN_PRODUCTION', 'PUBLISHED'] })
  })

  it('MANAGING_EDITOR toàn quyền — không bị giới hạn createdBy/assignedEditorId/reviews', async () => {
    mockSession.mockResolvedValue({ uid: UID, role: 'MANAGING_EDITOR', email: 'm@x' })
    await GET(makeGetRequest('status=ACCEPTED'))
    const where = whereOfLastFindMany()
    expect(where.createdBy).toBeUndefined()
    expect(where.assignedEditorId).toBeUndefined()
    expect(where.reviews).toBeUndefined()
    expect(where.status).toBe('ACCEPTED') // query filter vẫn áp dụng cho vai trò full-access
  })

  it.each(['READER', 'COMMANDER', 'SECURITY_AUDITOR'])(
    '%s KHÔNG được liệt kê bài nộp ở endpoint này (trả rỗng, không truy vấn)',
    async (role) => {
      mockSession.mockResolvedValue({ uid: UID, role, email: 'x@x' })
      const res = await GET(makeGetRequest())
      const body = await res.json()
      expect(body.submissions).toEqual([])
      expect(db.submission.findMany).not.toHaveBeenCalled()
    },
  )
})
