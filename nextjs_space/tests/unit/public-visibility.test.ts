/**
 * Visibility tests — trang công khai CHỈ lộ nội dung đã xuất bản.
 *
 * Bảo vệ ranh giới hiển thị public (xem .claude/rules/security.md — không lộ dữ liệu
 * vượt quyền): API công khai phải lọc đúng, không để lọt bản nháp / chưa duyệt.
 *   - /api/public/articles: chỉ submission.status = PUBLISHED và đã có Article.
 *   - /api/issues/latest:   chỉ Issue.status = PUBLISHED và publishDate <= hiện tại.
 *
 * Kiểm tra ở mức `where` truyền vào Prisma — nếu ai đó nới lỏng filter, test sẽ đỏ.
 */

jest.mock('@/lib/prisma', () => ({
  prisma: {
    submission: { findMany: jest.fn(), count: jest.fn() },
    issue: { findFirst: jest.fn() },
  },
}))

import { GET as getPublicArticles } from '../../app/api/public/articles/route'
import { GET as getLatestIssue } from '../../app/api/issues/latest/route'
import { prisma } from '@/lib/prisma'

const db = prisma as any

function reqWithQuery(query = '') {
  return { nextUrl: { searchParams: new URLSearchParams(query) } } as any
}

beforeEach(() => {
  jest.clearAllMocks()
  db.submission.findMany.mockResolvedValue([])
  db.submission.count.mockResolvedValue(0)
  db.issue.findFirst.mockResolvedValue(null)
})

describe('GET /api/public/articles — chỉ bài đã xuất bản', () => {
  it('luôn lọc status=PUBLISHED và phải có Article kèm theo', async () => {
    await getPublicArticles(reqWithQuery())

    expect(db.submission.findMany).toHaveBeenCalledTimes(1)
    const where = db.submission.findMany.mock.calls[0][0].where
    expect(where.status).toBe('PUBLISHED')
    expect(where.article).toEqual({ isNot: null })

    // count phải dùng CÙNG where để phân trang không lệch với danh sách
    expect(db.submission.count.mock.calls[0][0].where.status).toBe('PUBLISHED')
  })

  it('không bao giờ trả bản nháp (status filter không thể bị rỗng)', async () => {
    await getPublicArticles(reqWithQuery('page=1'))
    const where = db.submission.findMany.mock.calls[0][0].where
    expect(where.status).toBe('PUBLISHED')
    expect(where.status).not.toBeUndefined()
  })

  it('lọc theo chuyên mục giữ nguyên ràng buộc PUBLISHED', async () => {
    await getPublicArticles(reqWithQuery('category=CHIEN_LUOC'))
    const where = db.submission.findMany.mock.calls[0][0].where
    expect(where.status).toBe('PUBLISHED')
    expect(where.category).toEqual({ code: 'CHIEN_LUOC' })
  })

  it('featured=true chỉ lấy bài được gắn nổi bật', async () => {
    await getPublicArticles(reqWithQuery('featured=true'))
    const where = db.submission.findMany.mock.calls[0][0].where
    expect(where.status).toBe('PUBLISHED')
    expect(where.article).toEqual({ isFeatured: true })
  })
})

describe('GET /api/issues/latest — chỉ số đã xuất bản', () => {
  it('lọc status=PUBLISHED và publishDate <= hiện tại', async () => {
    await getLatestIssue(reqWithQuery())

    expect(db.issue.findFirst).toHaveBeenCalledTimes(1)
    const where = db.issue.findFirst.mock.calls[0][0].where
    expect(where.status).toBe('PUBLISHED')
    expect(where.publishDate.lte).toBeInstanceOf(Date)
  })
})
