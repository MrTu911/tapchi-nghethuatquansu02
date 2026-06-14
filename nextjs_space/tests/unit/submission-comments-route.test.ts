/**
 * Regression tests — /api/submissions/[id]/comments (annotation biên tập nội bộ).
 *
 * Trước đây route trả MOCK cứng, không lưu DB. Nay lưu thật vào SubmissionComment
 * với RBAC: chỉ vai trò biên tập + phản biện viên ĐƯỢC GÁN xem/ghi; loại trừ tác giả.
 */

jest.mock('@prisma/client', () => ({}))
jest.mock('@/lib/auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@/lib/logger', () => ({ logger: { error: jest.fn(), info: jest.fn() } }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    submission: { findUnique: jest.fn() },
    submissionComment: { findMany: jest.fn(), create: jest.fn() },
  },
}))

import { GET, POST } from '../../app/api/submissions/[id]/comments/route'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const mockSession = getServerSession as jest.Mock
const db = prisma as any

const ctx = (id = 'sub-1') => ({ params: { id } })
const getReq = () => ({} as any)
const postReq = (body: any) => ({ json: async () => body } as any)

function submissionWith(reviewerIds: string[] = [], createdBy = 'author-1', assignedEditorId: string | null = null) {
  return { id: 'sub-1', createdBy, assignedEditorId, reviews: reviewerIds.map((reviewerId) => ({ reviewerId })) }
}

beforeEach(() => {
  jest.clearAllMocks()
  db.submissionComment.findMany.mockResolvedValue([])
  db.submissionComment.create.mockResolvedValue({
    id: 'c-1', pageNumber: 2, content: 'Sửa lại trích dẫn', resolved: false,
    createdAt: new Date('2026-06-14T00:00:00Z'), author: { fullName: 'BTV A' },
  })
})

describe('GET comments — RBAC', () => {
  it('biên tập viên (SECTION_EDITOR) phụ trách bài → 200, trả danh sách đã map', async () => {
    mockSession.mockResolvedValue({ uid: 'ed-1', role: 'SECTION_EDITOR' })
    db.submission.findUnique.mockResolvedValue(submissionWith([], 'author-1', 'ed-1'))
    db.submissionComment.findMany.mockResolvedValue([
      { id: 'c-1', pageNumber: 1, content: 'OK', resolved: false, createdAt: new Date('2026-06-14'), author: { fullName: 'BTV A' } },
    ])

    const res = await GET(getReq(), ctx())
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data[0]).toMatchObject({ id: 'c-1', author: 'BTV A', pageNumber: 1 })
    expect(typeof body.data[0].createdAt).toBe('string')
  })

  it('phản biện viên ĐƯỢC GÁN → 200', async () => {
    mockSession.mockResolvedValue({ uid: 'rev-1', role: 'REVIEWER' })
    db.submission.findUnique.mockResolvedValue(submissionWith(['rev-1']))
    const res = await GET(getReq(), ctx())
    expect(res.status).toBe(200)
  })

  it('phản biện viên KHÔNG được gán bài này → 403', async () => {
    mockSession.mockResolvedValue({ uid: 'rev-x', role: 'REVIEWER' })
    db.submission.findUnique.mockResolvedValue(submissionWith(['rev-1']))
    const res = await GET(getReq(), ctx())
    expect(res.status).toBe(403)
  })

  it('SCOPE: BTV chuyên mục KHÔNG phụ trách bài → 403', async () => {
    mockSession.mockResolvedValue({ uid: 'ed-OTHER', role: 'SECTION_EDITOR' })
    db.submission.findUnique.mockResolvedValue(submissionWith([], 'author-1', 'ed-1'))
    const res = await GET(getReq(), ctx())
    expect(res.status).toBe(403)
  })

  it('TÁC GIẢ của bài bị loại trừ → 403 (không lộ annotation nội bộ)', async () => {
    mockSession.mockResolvedValue({ uid: 'author-1', role: 'AUTHOR' })
    db.submission.findUnique.mockResolvedValue(submissionWith([], 'author-1'))
    const res = await GET(getReq(), ctx())
    expect(res.status).toBe(403)
  })

  it('chưa đăng nhập → 401', async () => {
    mockSession.mockResolvedValue(null)
    const res = await GET(getReq(), ctx())
    expect(res.status).toBe(401)
  })

  it('bài không tồn tại → 404', async () => {
    mockSession.mockResolvedValue({ uid: 'ed-1', role: 'EIC' })
    db.submission.findUnique.mockResolvedValue(null)
    const res = await GET(getReq(), ctx())
    expect(res.status).toBe(404)
  })
})

describe('POST comments', () => {
  it('biên tập viên thêm nhận xét hợp lệ → 200, lưu DB', async () => {
    mockSession.mockResolvedValue({ uid: 'ed-1', role: 'MANAGING_EDITOR' })
    db.submission.findUnique.mockResolvedValue(submissionWith([]))

    const res = await POST(postReq({ pageNumber: 2, content: 'Sửa lại trích dẫn' }), ctx())
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(db.submissionComment.create).toHaveBeenCalledTimes(1)
    expect(db.submissionComment.create.mock.calls[0][0].data).toMatchObject({
      submissionId: 'sub-1', authorId: 'ed-1', pageNumber: 2, content: 'Sửa lại trích dẫn',
    })
    expect(body.data.author).toBe('BTV A')
  })

  it('nội dung rỗng → 400, không tạo', async () => {
    mockSession.mockResolvedValue({ uid: 'ed-1', role: 'EIC' })
    const res = await POST(postReq({ pageNumber: 1, content: '   ' }), ctx())
    expect(res.status).toBe(400)
    expect(db.submissionComment.create).not.toHaveBeenCalled()
  })

  it('nội dung quá dài → 400', async () => {
    mockSession.mockResolvedValue({ uid: 'ed-1', role: 'EIC' })
    const res = await POST(postReq({ pageNumber: 1, content: 'x'.repeat(2001) }), ctx())
    expect(res.status).toBe(400)
  })

  it('tác giả không được thêm nhận xét nội bộ → 403', async () => {
    mockSession.mockResolvedValue({ uid: 'author-1', role: 'AUTHOR' })
    db.submission.findUnique.mockResolvedValue(submissionWith([], 'author-1'))
    const res = await POST(postReq({ pageNumber: 1, content: 'thử' }), ctx())
    expect(res.status).toBe(403)
    expect(db.submissionComment.create).not.toHaveBeenCalled()
  })

  it('chưa đăng nhập → 401', async () => {
    mockSession.mockResolvedValue(null)
    const res = await POST(postReq({ pageNumber: 1, content: 'x' }), ctx())
    expect(res.status).toBe(401)
  })
})
