/**
 * Regression tests — GET /api/reviews (lọc danh sách phản biện theo vai trò).
 *
 * Bối cảnh (phát hiện 2026-06-27, cùng họ lỗi với GET /api/submissions):
 *   Trước khi vá, where chỉ ràng buộc khi role===REVIEWER; mọi vai trò khác (READER, AUTHOR,
 *   LAYOUT_EDITOR, COMMANDER, SECURITY_AUDITOR) nhận TOÀN BỘ review — kèm nhận xét + danh tính
 *   phản biện của mọi bài → phá phản biện kín (blind review) và rò dữ liệu chéo.
 *
 * Quy tắc đúng:
 *   - READER/AUTHOR/LAYOUT_EDITOR/COMMANDER/SECURITY_AUDITOR → KHÔNG liệt kê (trả [], không truy vấn)
 *   - REVIEWER → LUÔN chỉ thấy review của chính mình (kể cả khi truyền submissionId)
 *   - SECTION_EDITOR/MANAGING/DEPUTY/EIC/SYSADMIN → được lọc theo submissionId / reviewerId
 */

jest.mock('@/lib/api-guards', () => ({ requireAuth: jest.fn() }))
jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))
jest.mock('@/lib/prisma', () => ({
  prisma: { review: { findMany: jest.fn() }, submission: { findUnique: jest.fn() }, user: { findUnique: jest.fn() } },
}))

import { GET } from '../../app/api/reviews/route'
import { requireAuth } from '@/lib/api-guards'
import { prisma } from '@/lib/prisma'

const mockRequireAuth = requireAuth as jest.Mock
const db = prisma as any

function makeGetRequest(query = '') {
  return {
    url: `http://localhost:3001/api/reviews${query ? `?${query}` : ''}`,
    nextUrl: { searchParams: new URLSearchParams(query) },
    headers: new Headers(),
  } as any
}

function whereOfLastFindMany(): any {
  const calls = db.review.findMany.mock.calls
  return calls.length ? calls[calls.length - 1][0].where : undefined
}

beforeEach(() => {
  jest.clearAllMocks()
  db.review.findMany.mockResolvedValue([])
})

describe('GET /api/reviews — phạm vi theo vai trò (chống rò phản biện kín)', () => {
  it.each(['READER', 'AUTHOR', 'LAYOUT_EDITOR', 'COMMANDER', 'SECURITY_AUDITOR'])(
    '%s KHÔNG được liệt kê phản biện (trả [], không truy vấn)',
    async (role) => {
      mockRequireAuth.mockResolvedValue({ user: { id: 'u1', role, email: 'x@x' } })
      const res = await GET(makeGetRequest())
      const body = await res.json()
      expect(body).toEqual([])
      expect(db.review.findMany).not.toHaveBeenCalled()
    },
  )

  it('REVIEWER chỉ thấy review của mình (không truyền tham số)', async () => {
    mockRequireAuth.mockResolvedValue({ user: { id: 'rev-1', role: 'REVIEWER', email: 'r@x' } })
    await GET(makeGetRequest())
    expect(whereOfLastFindMany().reviewerId).toBe('rev-1')
  })

  it('REVIEWER vẫn bị khóa về chính mình kể cả khi lọc theo submissionId (giữ blind review)', async () => {
    mockRequireAuth.mockResolvedValue({ user: { id: 'rev-1', role: 'REVIEWER', email: 'r@x' } })
    await GET(makeGetRequest('submissionId=sub-9'))
    const where = whereOfLastFindMany()
    expect(where.reviewerId).toBe('rev-1')
    expect(where.submissionId).toBe('sub-9')
  })

  it('SECTION_EDITOR được lọc theo submissionId (không bị ép reviewerId của mình)', async () => {
    mockRequireAuth.mockResolvedValue({ user: { id: 'ed-1', role: 'SECTION_EDITOR', email: 'e@x' } })
    await GET(makeGetRequest('submissionId=sub-9'))
    const where = whereOfLastFindMany()
    expect(where.submissionId).toBe('sub-9')
    expect(where.reviewerId).toBeUndefined()
  })

  it('EIC được lọc theo reviewerId bất kỳ', async () => {
    mockRequireAuth.mockResolvedValue({ user: { id: 'eic-1', role: 'EIC', email: 'eic@x' } })
    await GET(makeGetRequest('reviewerId=other-reviewer'))
    expect(whereOfLastFindMany().reviewerId).toBe('other-reviewer')
  })
})
