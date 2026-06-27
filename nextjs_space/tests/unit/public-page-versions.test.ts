/**
 * Tests — Lịch sử phiên bản & xem trước trang public (CMS).
 *
 * Bảo vệ các hành vi then chốt vừa thêm:
 *   - Lưu tay đổi nội dung phải SINH một PublicPageVersion (snapshot trạng thái cũ).
 *   - Autosave (?snapshot=false) KHÔNG sinh phiên bản.
 *   - Đổi field không thuộc nội dung (order/isPublished) KHÔNG sinh phiên bản.
 *   - Restore phải snapshot bản hiện tại rồi ghi đè nội dung từ phiên bản chọn.
 *   - RBAC: non-admin bị chặn ở PATCH / restore / preview.
 *   - Preview (draftMode) chỉ admin mới bật được.
 */

jest.mock('@/lib/auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@/lib/audit-logger', () => ({ logAudit: jest.fn().mockResolvedValue(undefined) }))
jest.mock('next/headers', () => ({ draftMode: jest.fn() }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    publicPage: { findUnique: jest.fn(), update: jest.fn() },
    publicPageVersion: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

import {
  hasContentChange,
  snapshotPublicPage,
} from '../../lib/services/public-page-versions'
import { PATCH } from '../../app/api/public-pages/[id]/route'
import { POST as restore } from '../../app/api/public-pages/[id]/versions/[versionId]/restore/route'
import { GET as preview } from '../../app/api/public-pages/preview/route'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { draftMode } from 'next/headers'

const db = prisma as any
const mockSession = getServerSession as jest.Mock
const mockDraftMode = draftMode as jest.Mock

const basePage = {
  id: 'p1',
  slug: 'about',
  title: 'Cũ',
  titleEn: null,
  content: 'Nội dung cũ',
  contentEn: null,
  metaTitle: null,
  metaTitleEn: null,
  metaDesc: null,
  metaDescEn: null,
  ogImage: null,
  template: 'default',
  isPublished: false,
  publishedAt: null,
  order: 0,
}

function req(body: any = {}, url = 'http://localhost/api/public-pages/p1') {
  return { json: async () => body, headers: { get: () => 'test-ip' }, url } as any
}

beforeEach(() => {
  jest.clearAllMocks()
  // $transaction chạy callback với chính prisma mock làm tx.
  db.$transaction.mockImplementation(async (cb: any) => cb(db))
})

describe('hasContentChange', () => {
  it('phát hiện thay đổi field nội dung', () => {
    expect(hasContentChange(basePage as any, { title: 'Mới' })).toBe(true)
    expect(hasContentChange(basePage as any, { content: 'Khác' })).toBe(true)
  })

  it('không coi là thay đổi khi giá trị giống cũ', () => {
    expect(hasContentChange(basePage as any, { title: 'Cũ' })).toBe(false)
  })

  it('field không thuộc nội dung (order/isPublished) không tính là thay đổi nội dung', () => {
    expect(hasContentChange(basePage as any, { order: 5 })).toBe(false)
    expect(hasContentChange(basePage as any, { isPublished: true })).toBe(false)
  })
})

describe('snapshotPublicPage', () => {
  it('đánh số versionNo = max + 1', async () => {
    db.publicPageVersion.findFirst.mockResolvedValue({ versionNo: 3 })
    db.publicPageVersion.create.mockResolvedValue({})
    db.publicPageVersion.count.mockResolvedValue(4)

    await snapshotPublicPage(basePage as any, { actorId: 'u1', actorName: 'Admin' })

    expect(db.publicPageVersion.create).toHaveBeenCalledTimes(1)
    expect(db.publicPageVersion.create.mock.calls[0][0].data.versionNo).toBe(4)
    expect(db.publicPageVersion.create.mock.calls[0][0].data.title).toBe('Cũ')
  })

  it('bản đầu tiên → versionNo = 1', async () => {
    db.publicPageVersion.findFirst.mockResolvedValue(null)
    db.publicPageVersion.create.mockResolvedValue({})
    db.publicPageVersion.count.mockResolvedValue(1)

    await snapshotPublicPage(basePage as any, {})
    expect(db.publicPageVersion.create.mock.calls[0][0].data.versionNo).toBe(1)
  })

  it('prune khi vượt quá giới hạn 50 bản', async () => {
    db.publicPageVersion.findFirst.mockResolvedValue({ versionNo: 60 })
    db.publicPageVersion.create.mockResolvedValue({})
    db.publicPageVersion.count.mockResolvedValue(52)
    db.publicPageVersion.findMany.mockResolvedValue([{ id: 'old1' }, { id: 'old2' }])
    db.publicPageVersion.deleteMany.mockResolvedValue({ count: 2 })

    await snapshotPublicPage(basePage as any, {})

    expect(db.publicPageVersion.deleteMany).toHaveBeenCalledTimes(1)
    expect(db.publicPageVersion.deleteMany.mock.calls[0][0].where.id.in).toEqual([
      'old1',
      'old2',
    ])
  })
})

describe('PATCH /api/public-pages/[id] — snapshot & RBAC', () => {
  const ctx = { params: { id: 'p1' } }

  beforeEach(() => {
    db.publicPage.findUnique.mockResolvedValue(basePage)
    db.publicPage.update.mockResolvedValue({ ...basePage, title: 'Mới', content: 'Mới' })
    db.publicPageVersion.findFirst.mockResolvedValue(null)
    db.publicPageVersion.create.mockResolvedValue({})
    db.publicPageVersion.count.mockResolvedValue(1)
  })

  it('non-admin → 403, không cập nhật, không snapshot', async () => {
    mockSession.mockResolvedValue({ uid: 'u', role: 'AUTHOR' })
    const res = await PATCH(req({ title: 'Mới' }), ctx as any)
    expect(res.status).toBe(403)
    expect(db.publicPage.update).not.toHaveBeenCalled()
    expect(db.publicPageVersion.create).not.toHaveBeenCalled()
  })

  it('lưu tay đổi nội dung → 200 và sinh 1 phiên bản', async () => {
    mockSession.mockResolvedValue({ uid: 'u1', role: 'EIC', fullName: 'Admin' })
    const res = await PATCH(req({ title: 'Mới', content: 'Mới' }), ctx as any)
    expect(res.status).toBe(200)
    expect(db.publicPageVersion.create).toHaveBeenCalledTimes(1)
    expect(db.publicPage.update).toHaveBeenCalledTimes(1)
  })

  it('autosave (?snapshot=false) → không sinh phiên bản', async () => {
    mockSession.mockResolvedValue({ uid: 'u1', role: 'EIC', fullName: 'Admin' })
    const res = await PATCH(
      req({ title: 'Mới', content: 'Mới' }, 'http://localhost/api/public-pages/p1?snapshot=false'),
      ctx as any
    )
    expect(res.status).toBe(200)
    expect(db.publicPageVersion.create).not.toHaveBeenCalled()
    expect(db.publicPage.update).toHaveBeenCalledTimes(1)
  })

  it('chỉ đổi thứ tự (order) → không sinh phiên bản', async () => {
    mockSession.mockResolvedValue({ uid: 'u1', role: 'EIC', fullName: 'Admin' })
    const res = await PATCH(req({ order: 9 }), ctx as any)
    expect(res.status).toBe(200)
    expect(db.publicPageVersion.create).not.toHaveBeenCalled()
  })
})

describe('POST /restore — snapshot rồi ghi đè', () => {
  const ctx = { params: { id: 'p1', versionId: 'v1' } }
  const version = {
    id: 'v1',
    pageId: 'p1',
    versionNo: 2,
    title: 'Bản 2',
    titleEn: null,
    content: 'Nội dung bản 2',
    contentEn: null,
    metaTitle: null,
    metaTitleEn: null,
    metaDesc: null,
    metaDescEn: null,
    ogImage: null,
    template: 'default',
  }

  it('non-admin → 403', async () => {
    mockSession.mockResolvedValue({ uid: 'u', role: 'REVIEWER' })
    const res = await restore(req({}), ctx as any)
    expect(res.status).toBe(403)
    expect(db.publicPage.update).not.toHaveBeenCalled()
  })

  it('version thuộc trang khác → 404', async () => {
    mockSession.mockResolvedValue({ uid: 'u1', role: 'SYSADMIN', fullName: 'Admin' })
    db.publicPage.findUnique.mockResolvedValue(basePage)
    db.publicPageVersion.findUnique.mockResolvedValue({ ...version, pageId: 'khac' })
    const res = await restore(req({}), ctx as any)
    expect(res.status).toBe(404)
    expect(db.publicPage.update).not.toHaveBeenCalled()
  })

  it('khôi phục hợp lệ → snapshot bản hiện tại + ghi đè nội dung', async () => {
    mockSession.mockResolvedValue({ uid: 'u1', role: 'SYSADMIN', fullName: 'Admin' })
    db.publicPage.findUnique.mockResolvedValue(basePage)
    db.publicPageVersion.findUnique.mockResolvedValue(version)
    db.publicPageVersion.findFirst.mockResolvedValue({ versionNo: 5 })
    db.publicPageVersion.create.mockResolvedValue({})
    db.publicPageVersion.count.mockResolvedValue(6)
    db.publicPage.update.mockResolvedValue({ ...basePage, title: 'Bản 2' })

    const res = await restore(req({}), ctx as any)
    expect(res.status).toBe(200)
    // snapshot trạng thái hiện tại trước khi ghi đè
    expect(db.publicPageVersion.create).toHaveBeenCalledTimes(1)
    // ghi đè đúng nội dung phiên bản
    expect(db.publicPage.update.mock.calls[0][0].data.title).toBe('Bản 2')
    expect(db.publicPage.update.mock.calls[0][0].data.content).toBe('Nội dung bản 2')
  })
})

describe('GET /api/public-pages/preview — chỉ admin bật draftMode', () => {
  it('non-admin → 403, không bật draftMode', async () => {
    const enable = jest.fn()
    mockDraftMode.mockReturnValue({ enable, disable: jest.fn(), isEnabled: false })
    mockSession.mockResolvedValue({ uid: 'u', role: 'AUTHOR' })

    const res = await preview({ url: 'http://localhost/api/public-pages/preview?id=p1' } as any)
    expect(res.status).toBe(403)
    expect(enable).not.toHaveBeenCalled()
  })

  it('admin → bật draftMode và redirect tới /pages/<slug>', async () => {
    const enable = jest.fn()
    mockDraftMode.mockReturnValue({ enable, disable: jest.fn(), isEnabled: false })
    mockSession.mockResolvedValue({ uid: 'u1', role: 'EIC' })
    db.publicPage.findUnique.mockResolvedValue({ slug: 'about' })

    const res = await preview({ url: 'http://localhost/api/public-pages/preview?id=p1' } as any)
    expect(enable).toHaveBeenCalledTimes(1)
    expect([302, 307, 308]).toContain(res.status)
    expect(res.headers.get('location')).toContain('/pages/about')
  })
})
