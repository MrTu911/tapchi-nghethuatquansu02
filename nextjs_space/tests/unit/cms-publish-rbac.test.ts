/**
 * Permission tests — quyền XUẤT BẢN và DUYỆT bài (CMS publish pipeline).
 *
 * Bảo vệ ranh giới then chốt của nghiệp vụ NTQS (xem lib/rbac.ts `can.publish`):
 *   - XUẤT BẢN số tạp chí (/api/issues/publish): CHỈ EIC, SYSADMIN.
 *     Phó Tổng biên tập (DEPUTY_EIC) KHÔNG được phép xuất bản — chỉ EIC ký cuối.
 *   - DUYỆT bài (/api/articles/[id]/approve): SYSADMIN, EIC, DEPUTY_EIC, MANAGING_EDITOR.
 *     DEPUTY_EIC ĐƯỢC duyệt (biên tập), tương phản rõ với việc không được xuất bản.
 *
 * Đây là regression lock cho leadership_flow_revamp (DEPUTY_EIC publish vẫn EIC-only).
 */

jest.mock('@/lib/auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    issue: { findUnique: jest.fn(), update: jest.fn() },
    article: { updateMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    submission: { updateMany: jest.fn() },
    user: { findUnique: jest.fn() },
    notification: { create: jest.fn() },
    auditLog: { create: jest.fn() },
  },
}))
jest.mock('@/lib/audit-logger', () => ({
  logAudit: jest.fn().mockResolvedValue(undefined),
  AuditEventType: new Proxy({}, { get: (_t, prop) => prop }),
}))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))
jest.mock('@prisma/client', () => ({
  ApprovalStatus: { APPROVED: 'APPROVED', REJECTED: 'REJECTED', REVISION_REQUIRED: 'REVISION_REQUIRED' },
}))

import { POST as publishIssue } from '../../app/api/issues/publish/route'
import { POST as approveArticle } from '../../app/api/articles/[id]/approve/route'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const mockSession = getServerSession as jest.Mock
const db = prisma as any

function jsonReq(body: any = {}) {
  return { json: async () => body, headers: { get: () => 'test-ip' }, url: 'http://localhost/api' } as any
}
const artCtx = { params: Promise.resolve({ id: 'art-1' }) }

const session = (role: string) => ({ uid: `u-${role}`, role, email: `${role}@ntqs.vn` })

beforeEach(() => {
  jest.clearAllMocks()
  db.issue.update.mockResolvedValue({ publishDate: new Date() })
  db.article.updateMany.mockResolvedValue({ count: 1 })
  db.submission.updateMany.mockResolvedValue({ count: 1 })
  db.article.update.mockResolvedValue({ id: 'art-1', approvalStatus: 'APPROVED' })
  db.notification.create.mockResolvedValue({})
  db.auditLog.create.mockResolvedValue({})
})

describe('POST /api/issues/publish — chỉ EIC/SYSADMIN được xuất bản', () => {
  function readyIssue(overrides: Record<string, any> = {}) {
    return {
      id: 'iss-1',
      status: 'DRAFT',
      title: 'Số 1',
      number: 1,
      publishDate: null,
      volume: { volumeNo: 1 },
      articles: [{ id: 'a1', submissionId: 's1', submission: {} }],
      ...overrides,
    }
  }

  it('chưa đăng nhập → 401, không cập nhật số', async () => {
    mockSession.mockResolvedValue(null)
    const res = await publishIssue(jsonReq({ issueId: 'iss-1' }))
    expect(res.status).toBe(401)
    expect(db.issue.update).not.toHaveBeenCalled()
  })

  it.each(['AUTHOR', 'REVIEWER', 'SECTION_EDITOR', 'MANAGING_EDITOR', 'DEPUTY_EIC'])(
    '%s KHÔNG được xuất bản → 403, không cập nhật số',
    async (role) => {
      mockSession.mockResolvedValue(session(role))
      const res = await publishIssue(jsonReq({ issueId: 'iss-1' }))
      expect(res.status).toBe(403)
      expect(db.issue.update).not.toHaveBeenCalled()
    }
  )

  it('EIC xuất bản số hợp lệ → 200, set PUBLISHED + lan sang articles/submissions', async () => {
    mockSession.mockResolvedValue(session('EIC'))
    db.issue.findUnique
      .mockResolvedValueOnce(readyIssue()) // lần 1: kiểm tra + lấy articles
      .mockResolvedValueOnce({ id: 'iss-1', volume: { volumeNo: 1 }, _count: { articles: 1 } }) // lần 2: trả về

    const res = await publishIssue(jsonReq({ issueId: 'iss-1' }))
    expect(res.status).toBe(200)
    expect(db.issue.update).toHaveBeenCalledTimes(1)
    expect(db.issue.update.mock.calls[0][0].data.status).toBe('PUBLISHED')
    expect(db.article.updateMany).toHaveBeenCalledTimes(1)
    expect(db.submission.updateMany).toHaveBeenCalledTimes(1)
  })

  it('EIC nhưng số chưa có bài → 400, không xuất bản', async () => {
    mockSession.mockResolvedValue(session('EIC'))
    db.issue.findUnique.mockResolvedValueOnce(readyIssue({ articles: [] }))
    const res = await publishIssue(jsonReq({ issueId: 'iss-1' }))
    expect(res.status).toBe(400)
    expect(db.issue.update).not.toHaveBeenCalled()
  })

  it('EIC nhưng số đã PUBLISHED → 400, không xuất bản lại', async () => {
    mockSession.mockResolvedValue(session('EIC'))
    db.issue.findUnique.mockResolvedValueOnce(readyIssue({ status: 'PUBLISHED' }))
    const res = await publishIssue(jsonReq({ issueId: 'iss-1' }))
    expect(res.status).toBe(400)
    expect(db.issue.update).not.toHaveBeenCalled()
  })
})

describe('POST /api/articles/[id]/approve — DEPUTY_EIC ĐƯỢC duyệt (khác với publish)', () => {
  const existingArticle = {
    id: 'art-1',
    submissionId: 's1',
    submission: { title: 'Bài', code: 'NTQS-001', createdBy: 'author-1' },
  }

  it('chưa đăng nhập → 401, không duyệt', async () => {
    mockSession.mockResolvedValue(null)
    const res = await approveArticle(jsonReq({ decision: 'APPROVED' }), artCtx as any)
    expect(res.status).toBe(401)
    expect(db.article.update).not.toHaveBeenCalled()
    expect(db.user.findUnique).not.toHaveBeenCalled()
  })

  it.each(['READER', 'AUTHOR'])('%s không có quyền duyệt → 403', async (role) => {
    mockSession.mockResolvedValue(session(role))
    db.user.findUnique.mockResolvedValue({ role })
    const res = await approveArticle(jsonReq({ decision: 'APPROVED' }), artCtx as any)
    expect(res.status).toBe(403)
    expect(db.article.update).not.toHaveBeenCalled()
  })

  it('DEPUTY_EIC DUYỆT bài hợp lệ → 200, cập nhật approvalStatus', async () => {
    mockSession.mockResolvedValue(session('DEPUTY_EIC'))
    db.user.findUnique.mockResolvedValue({ role: 'DEPUTY_EIC' })
    db.article.findUnique.mockResolvedValue(existingArticle)

    const res = await approveArticle(jsonReq({ decision: 'APPROVED', note: 'ok' }), artCtx as any)
    expect(res.status).toBe(200)
    expect(db.article.update).toHaveBeenCalledTimes(1)
    expect(db.article.update.mock.calls[0][0].data.approvalStatus).toBe('APPROVED')
  })

  it('EIC duyệt với quyết định không hợp lệ → 400', async () => {
    mockSession.mockResolvedValue(session('EIC'))
    db.user.findUnique.mockResolvedValue({ role: 'EIC' })
    const res = await approveArticle(jsonReq({ decision: 'NOT_A_DECISION' }), artCtx as any)
    expect(res.status).toBe(400)
    expect(db.article.update).not.toHaveBeenCalled()
  })

  it('EIC duyệt bài không tồn tại → 404', async () => {
    mockSession.mockResolvedValue(session('EIC'))
    db.user.findUnique.mockResolvedValue({ role: 'EIC' })
    db.article.findUnique.mockResolvedValue(null)
    const res = await approveArticle(jsonReq({ decision: 'APPROVED' }), artCtx as any)
    expect(res.status).toBe(404)
    expect(db.article.update).not.toHaveBeenCalled()
  })
})
