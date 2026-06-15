/**
 * Visibility tests — API podcast công khai CHỈ lộ tập đã xuất bản.
 *
 * Bảo vệ ranh giới hiển thị public (xem .claude/rules/security.md — không lộ dữ liệu
 * vượt quyền). Regression cho lỗ rò bản nháp/đã tắt:
 *   - GET /api/podcasts     : public phải ép isActive=true + publishedAt <= now,
 *                             không tin tham số adminView/isActive từ client.
 *   - GET /api/podcasts/[id]: tập chưa publish/đã tắt → 404 với khách,
 *                             chỉ quản trị mới xem trước được và KHÔNG tăng lượt nghe.
 */

jest.mock('@/lib/prisma', () => ({
  prisma: {
    podcast: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth', () => ({
  getServerSession: jest.fn(),
}))

import { GET as listPodcasts } from '../../app/api/podcasts/route'
import { GET as getPodcast } from '../../app/api/podcasts/[id]/route'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth'

const db = prisma as any
const mockSession = getServerSession as jest.Mock

function listReq(query = '') {
  return { url: `http://localhost/api/podcasts${query ? `?${query}` : ''}` } as any
}

const publishedPodcast = {
  id: 'p1',
  isActive: true,
  publishedAt: new Date(Date.now() - 60_000),
}

beforeEach(() => {
  jest.clearAllMocks()
  db.podcast.findMany.mockResolvedValue([])
  db.podcast.count.mockResolvedValue(0)
  db.podcast.update.mockResolvedValue({})
  mockSession.mockResolvedValue(null)
})

describe('GET /api/podcasts — danh sách công khai', () => {
  it('public mặc định: ép isActive=true và publishedAt <= hiện tại', async () => {
    await listPodcasts(listReq())

    const where = db.podcast.findMany.mock.calls[0][0].where
    expect(where.isActive).toBe(true)
    expect(where.publishedAt.lte).toBeInstanceOf(Date)
  })

  it('client không thể đặt isActive=false để soi tập đã tắt', async () => {
    await listPodcasts(listReq('isActive=false'))

    const where = db.podcast.findMany.mock.calls[0][0].where
    expect(where.isActive).toBe(true)
  })

  it('adminView=true nhưng KHÔNG có phiên đăng nhập → vẫn ép lọc public', async () => {
    await listPodcasts(listReq('adminView=true'))

    const where = db.podcast.findMany.mock.calls[0][0].where
    expect(where.isActive).toBe(true)
    expect(where.publishedAt.lte).toBeInstanceOf(Date)
  })

  it('adminView=true với quyền quản trị → không ép publishedAt, thấy cả bản nháp', async () => {
    mockSession.mockResolvedValue({ uid: 'admin', role: 'EIC' })

    await listPodcasts(listReq('adminView=true'))

    const where = db.podcast.findMany.mock.calls[0][0].where
    expect(where.publishedAt).toBeUndefined()
    expect(where.isActive).toBeUndefined()
  })
})

describe('GET /api/podcasts/[id] — chi tiết', () => {
  it('tập chưa publish + khách vãng lai → 404, không tăng lượt nghe', async () => {
    db.podcast.findUnique.mockResolvedValue({ id: 'p1', isActive: true, publishedAt: null })

    const res = await getPodcast({} as any, { params: { id: 'p1' } })

    expect(res.status).toBe(404)
    expect(db.podcast.update).not.toHaveBeenCalled()
  })

  it('tập đã tắt (isActive=false) → 404 với khách dù publishedAt trong quá khứ', async () => {
    db.podcast.findUnique.mockResolvedValue({
      id: 'p1',
      isActive: false,
      publishedAt: new Date(Date.now() - 60_000),
    })

    const res = await getPodcast({} as any, { params: { id: 'p1' } })

    expect(res.status).toBe(404)
    expect(db.podcast.update).not.toHaveBeenCalled()
  })

  it('quản trị xem trước bản chưa publish → 200, KHÔNG tăng lượt nghe', async () => {
    db.podcast.findUnique.mockResolvedValue({ id: 'p1', isActive: true, publishedAt: null })
    mockSession.mockResolvedValue({ uid: 'admin', role: 'SYSADMIN' })

    const res = await getPodcast({} as any, { params: { id: 'p1' } })

    expect(res.status).toBe(200)
    expect(db.podcast.update).not.toHaveBeenCalled()
  })

  it('tập đã publish → trả về và tăng lượt nghe', async () => {
    db.podcast.findUnique.mockResolvedValue(publishedPodcast)

    const res = await getPodcast({} as any, { params: { id: 'p1' } })

    expect(res.status).toBe(200)
    expect(db.podcast.update).toHaveBeenCalledTimes(1)
    expect(db.podcast.update.mock.calls[0][0].data.plays).toEqual({ increment: 1 })
  })
})
