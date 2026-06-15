/**
 * Permission tests — RBAC backend guard cho các route MUTATION của CMS (P0/P1).
 *
 * Mục tiêu (theo .claude/rules/testing.md mục "Permission / scope"): khẳng định
 * MỌI route ghi nội dung CMS đều CHẶN ở BACKEND khi người gọi không đủ quyền —
 * không chỉ ẩn nút ở UI. Đây là regression lock cho hành vi phân quyền hiện tại.
 *
 * Quy ước quyền quản trị nội dung CMS (xem lib/rbac.ts `can.admin`):
 *   SYSADMIN, EIC, DEPUTY_EIC, MANAGING_EDITOR  → được quản trị CMS
 *   READER, AUTHOR, REVIEWER, SECTION_EDITOR... → KHÔNG
 *
 * CHUẨN HÓA SAU SỬA (F1/F4/F5 — 2026-06-15): các route CMS admin dùng CHUNG
 * `can.admin` (lib/rbac.ts) làm SSOT phân quyền và status đồng nhất:
 *    • Chưa đăng nhập ⇒ 401   • Đã đăng nhập nhưng sai role ⇒ 403
 * Ngoại lệ: /api/media cho phép thêm AUTHOR/REVIEWER/SECTION_EDITOR (upload đính kèm),
 * nên dùng danh sách riêng — vẫn 401 (chưa đăng nhập) / 403 (READER).
 */

// Mock toàn bộ phụ thuộc có side-effect (DB, storage, cache, audit) — giữ guard/route thuần.
jest.mock('@/lib/auth', () => ({
  getServerSession: jest.fn(),
  requireAuth: jest.fn(),
}))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    navigationItem: { create: jest.fn() },
    publicPage: { create: jest.fn() },
    siteSetting: { findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
    category: { findFirst: jest.fn(), create: jest.fn() },
    featuredArticle: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
    homepageSection: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
    banner: { create: jest.fn(), aggregate: jest.fn() },
    media: { create: jest.fn() },
    article: { findUnique: jest.fn(), update: jest.fn() },
  },
}))
jest.mock('@/lib/audit-logger', () => ({
  logAudit: jest.fn().mockResolvedValue(undefined),
  // AuditEventType.X dùng như chuỗi → Proxy trả về chính tên thuộc tính.
  AuditEventType: new Proxy({}, { get: (_t, prop) => prop }),
}))
jest.mock('@/lib/cache', () => ({
  getCachedData: jest.fn((_k: string, fn: () => any) => fn()),
  invalidateCache: jest.fn(),
}))
jest.mock('@/lib/s3', () => ({
  saveFile: jest.fn().mockResolvedValue({ filePath: 'banner/x.png' }),
  getFileUrl: jest.fn(),
  uploadFileToS3: jest.fn().mockResolvedValue({ cloudStoragePath: 'media/x.png' }),
}))
jest.mock('@/lib/image-utils', () => ({
  getSignedImageUrl: jest.fn().mockResolvedValue('https://signed/x.png'),
}))
jest.mock('sharp', () => jest.fn(() => ({ metadata: jest.fn().mockResolvedValue({ width: 1, height: 1 }) })))

import { getServerSession, requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

import { POST as navigationPost } from '../../app/api/navigation/route'
import { POST as publicPagesPost } from '../../app/api/public-pages/route'
import { PATCH as siteSettingPatch } from '../../app/api/site-settings/[key]/route'
import { POST as categoriesPost } from '../../app/api/categories/route'
import { POST as featuredPost } from '../../app/api/featured-articles/route'
import { POST as homepagePost } from '../../app/api/homepage-sections/route'
import { POST as slidersPost } from '../../app/api/cms/sliders/route'
import { POST as bannersPost } from '../../app/api/banners/route'
import { POST as mediaPost } from '../../app/api/media/route'

const mockSession = getServerSession as jest.Mock
const mockRequireAuth = requireAuth as jest.Mock
const db = prisma as any

const READER = { uid: 'u-reader', role: 'READER', email: 'reader@ntqs.vn' }
const AUTHOR = { uid: 'u-author', role: 'AUTHOR', email: 'author@ntqs.vn' }
const EIC = { uid: 'u-eic', role: 'EIC', email: 'eic@ntqs.vn' }

function jsonReq(body: any = {}) {
  return {
    json: async () => body,
    url: 'http://localhost/api/test',
    headers: { get: () => 'test-ip' },
  } as any
}

/** Giả lập FormData tối thiểu (get/forEach) — file mặc định null để dừng trước bước lưu trữ. */
function formReq(fields: Record<string, any> = {}, file: any = null) {
  const formData = {
    get: (key: string) => (key === 'image' || key === 'file' ? file : fields[key] ?? null),
    forEach: (cb: (v: any, k: string) => void) =>
      Object.entries(fields).forEach(([k, v]) => cb(v, k)),
  }
  return {
    formData: async () => formData,
    url: 'http://localhost/api/test',
    headers: { get: () => 'test-ip' },
  } as any
}

const keyCtx = { params: Promise.resolve({ key: 'site_name' }) }

type AuthKind = 'session' | 'requireAuth'

interface RouteSpec {
  name: string
  auth: AuthKind
  /** Gọi handler với phiên đăng nhập (hoặc null = chưa đăng nhập). */
  call: () => Promise<Response>
  /** Mutation bắt buộc KHÔNG được chạy khi bị từ chối. */
  write: () => jest.Mock
  /** Status kỳ vọng khi chưa đăng nhập (null = không kiểm tra ca này). */
  noSessionStatus: number | null
  /** Status kỳ vọng khi sai vai trò (READER). */
  wrongRoleStatus: number
}

const specs: RouteSpec[] = [
  {
    name: 'POST /api/navigation',
    auth: 'session',
    call: () => navigationPost(jsonReq({ label: 'X', url: '/x' })),
    write: () => db.navigationItem.create,
    noSessionStatus: 401,
    wrongRoleStatus: 403,
  },
  {
    name: 'POST /api/public-pages',
    auth: 'session',
    call: () => publicPagesPost(jsonReq({ slug: 's', title: 't', content: 'c' })),
    write: () => db.publicPage.create,
    noSessionStatus: 401,
    wrongRoleStatus: 403,
  },
  {
    name: 'PATCH /api/site-settings/[key]',
    auth: 'session',
    call: () => siteSettingPatch(jsonReq({ value: 'v' }), keyCtx as any),
    write: () => db.siteSetting.update,
    noSessionStatus: 401,
    wrongRoleStatus: 403,
  },
  {
    name: 'POST /api/categories',
    auth: 'session',
    call: () => categoriesPost(jsonReq({ code: 'C', name: 'N', slug: 's' })),
    write: () => db.category.create,
    noSessionStatus: 401,
    wrongRoleStatus: 403,
  },
  {
    name: 'POST /api/featured-articles',
    auth: 'session',
    call: () => featuredPost(jsonReq({ articleId: 'a1' })),
    write: () => db.featuredArticle.create,
    noSessionStatus: 401,
    wrongRoleStatus: 403,
  },
  {
    name: 'POST /api/homepage-sections',
    auth: 'session',
    call: () => homepagePost(jsonReq({ key: 'hero', type: 'hero' })),
    write: () => db.homepageSection.create,
    noSessionStatus: 401,
    wrongRoleStatus: 403,
  },
  {
    name: 'POST /api/cms/sliders',
    auth: 'session',
    call: () => slidersPost(jsonReq({ imageUrl: '/x.png' })),
    write: () => db.banner.create,
    noSessionStatus: 401,
    wrongRoleStatus: 403, // F1/F5 đã sửa: dùng can.admin, sai role ⇒ 403
  },
  {
    name: 'POST /api/media',
    auth: 'session',
    call: () => mediaPost(formReq()),
    write: () => db.media.create,
    noSessionStatus: 401,
    wrongRoleStatus: 403,
  },
  {
    name: 'POST /api/banners',
    auth: 'session', // F1 đã sửa: chuyển từ requireAuth sang getServerSession + can.admin
    call: () => bannersPost(formReq()),
    write: () => db.banner.create,
    noSessionStatus: 401,
    wrongRoleStatus: 403,
  },
]

beforeEach(() => {
  jest.clearAllMocks()
  // Mặc định "lành" cho các truy vấn đọc — để vai trò hợp lệ đi qua guard rồi dừng ở validate.
  db.siteSetting.findUnique.mockResolvedValue(null)
  db.category.findFirst.mockResolvedValue(null)
  db.featuredArticle.findUnique.mockResolvedValue(null)
  db.featuredArticle.findFirst.mockResolvedValue(null)
  db.homepageSection.findUnique.mockResolvedValue(null)
  db.homepageSection.findFirst.mockResolvedValue(null)
  db.article.findUnique.mockResolvedValue(null)
  db.banner.aggregate.mockResolvedValue({ _max: { position: 0 } })
  // Mutation mặc định trả về một object để path hợp lệ không vỡ vì giá trị undefined.
  db.navigationItem.create.mockResolvedValue({ id: 'n1' })
  db.publicPage.create.mockResolvedValue({ id: 'p1' })
  db.category.create.mockResolvedValue({ id: 'c1' })
  db.homepageSection.create.mockResolvedValue({ id: 'h1' })
  db.banner.create.mockResolvedValue({ id: 'b1', position: 1 })
})

function applyAuth(spec: RouteSpec, session: any) {
  if (spec.auth === 'requireAuth') {
    if (session) mockRequireAuth.mockResolvedValue(session)
    else mockRequireAuth.mockRejectedValue(new Error('not authenticated'))
  } else {
    mockSession.mockResolvedValue(session)
  }
}

describe('CMS RBAC — route mutation phải chặn người không đủ quyền ở backend', () => {
  for (const spec of specs) {
    describe(spec.name, () => {
      it('vai trò không hợp lệ (READER) bị chặn và KHÔNG ghi dữ liệu', async () => {
        applyAuth(spec, READER)
        const res = await spec.call()
        expect(res.status).toBe(spec.wrongRoleStatus)
        expect(spec.write()).not.toHaveBeenCalled()
      })

      it('AUTHOR cũng bị chặn (CMS không dành cho tác giả)', async () => {
        // /api/media cho phép AUTHOR upload (đính kèm bài) — bỏ qua ca này cho media.
        if (spec.name === 'POST /api/media') return
        applyAuth(spec, AUTHOR)
        const res = await spec.call()
        expect(res.status).toBe(spec.wrongRoleStatus)
        expect(spec.write()).not.toHaveBeenCalled()
      })

      if (spec.noSessionStatus !== null) {
        it('chưa đăng nhập bị chặn và KHÔNG ghi dữ liệu', async () => {
          applyAuth(spec, null)
          const res = await spec.call()
          expect(res.status).toBe(spec.noSessionStatus)
          expect(spec.write()).not.toHaveBeenCalled()
        })
      }

      it('vai trò hợp lệ (EIC) đi qua được guard (status ≠ 401/403)', async () => {
        applyAuth(spec, EIC)
        const res = await spec.call()
        expect([401, 403]).not.toContain(res.status)
      })
    })
  }
})
