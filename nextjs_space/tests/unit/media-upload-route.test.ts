/**
 * Integration test (F2) — POST /api/media phải XÁC THỰC MAGIC BYTES, không tin
 * file.type từ client. Đây là kiểm tra đầu-cuối qua handler thật (validator KHÔNG
 * mock) để chắc route đã nối đúng `validateMediaFile` của lib/file-security.ts.
 *
 * Ca then chốt: file thực thi (.exe) đổi tên thành .png và khai MIME image/png
 * → route phải từ chối 400 và KHÔNG ghi DB / KHÔNG đẩy lên storage.
 */

jest.mock('@/lib/auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@/lib/prisma', () => ({ prisma: { media: { create: jest.fn() } } }))
jest.mock('@/lib/s3', () => ({ uploadFileToS3: jest.fn().mockResolvedValue({ cloudStoragePath: 'media/x.png' }) }))
jest.mock('@/lib/audit-logger', () => ({
  logAudit: jest.fn().mockResolvedValue(undefined),
  AuditEventType: new Proxy({}, { get: (_t, prop) => prop }),
}))
jest.mock('sharp', () => jest.fn(() => ({ metadata: jest.fn().mockResolvedValue({ width: 10, height: 10 }) })))
// CỐ Ý KHÔNG mock @/lib/file-security — dùng validator thật.

import { POST as mediaPost } from '../../app/api/media/route'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadFileToS3 } from '@/lib/s3'

const mockSession = getServerSession as jest.Mock
const db = prisma as any
const mockUpload = uploadFileToS3 as jest.Mock

const PNG_BYTES = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0, 0, 0]
const EXE_BYTES = [0x4d, 0x5a, 0x90, 0x00, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] // "MZ" (PE)

function makeFile(bytes: number[], name: string, type: string): File {
  return new File([Buffer.from(bytes)], name, { type })
}

function mediaRequest(file: File, fields: Record<string, string> = {}) {
  const formData = {
    get: (key: string) => (key === 'file' ? file : fields[key] ?? null),
  }
  return {
    formData: async () => formData,
    headers: { get: () => 'test-ip' },
    url: 'http://localhost/api/media',
  } as any
}

beforeEach(() => {
  jest.clearAllMocks()
  db.media.create.mockResolvedValue({ id: 'm1', fileName: 'ok.png' })
  mockSession.mockResolvedValue({ uid: 'u-eic', role: 'EIC', email: 'eic@ntqs.vn' })
})

describe('POST /api/media — chặn giả mạo MIME (F2)', () => {
  it('EXE đổi tên .png khai image/png → 400, KHÔNG upload, KHÔNG ghi DB', async () => {
    const file = makeFile(EXE_BYTES, 'malware.png', 'image/png')
    const res = await mediaPost(mediaRequest(file))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/không khớp định dạng/i)
    expect(mockUpload).not.toHaveBeenCalled()
    expect(db.media.create).not.toHaveBeenCalled()
  })

  it('ảnh PNG hợp lệ (magic bytes đúng) → 201, có upload + ghi DB', async () => {
    const file = makeFile(PNG_BYTES, 'photo.png', 'image/png')
    const res = await mediaPost(mediaRequest(file))

    expect(res.status).toBe(201)
    expect(mockUpload).toHaveBeenCalledTimes(1)
    expect(db.media.create).toHaveBeenCalledTimes(1)
  })

  it('loại file không phải media (PDF) → 400, KHÔNG upload', async () => {
    const file = makeFile([0x25, 0x50, 0x44, 0x46], 'doc.pdf', 'application/pdf')
    const res = await mediaPost(mediaRequest(file))

    expect(res.status).toBe(400)
    expect(mockUpload).not.toHaveBeenCalled()
  })
})
