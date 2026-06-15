/**
 * Unit test cho luồng upload video theo từng phần (chunked/resumable).
 *
 * Chạy thật trên một UPLOAD_ROOT tạm (không mock fs) để chứng minh:
 * - các phần được nối đúng offset và ghép lại thành file đầy đủ,
 * - chặn phần sai thứ tự,
 * - idempotent khi gửi lại phần đã nhận,
 * - enforce ownership,
 * - từ chối mime không phải video,
 * - finalize thất bại khi chưa đủ byte.
 *
 * UPLOAD_ROOT phải được set TRƯỚC khi import service (local-storage đọc env lúc load),
 * nên dùng dynamic import trong beforeAll.
 */

import os from 'os'
import path from 'path'
import fs from 'fs/promises'

describe('video chunked upload service', () => {
  let tmpRoot: string
  let svc: typeof import('@/lib/services/video-upload-service')

  beforeAll(async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'ntqs-vid-'))
    process.env.UPLOAD_ROOT = tmpRoot
    delete process.env.MAX_VIDEO_UPLOAD_MB // không giới hạn dung lượng
    svc = await import('@/lib/services/video-upload-service')
  })

  afterAll(async () => {
    await fs.rm(tmpRoot, { recursive: true, force: true })
  })

  it('init → append tuần tự → finalize ghép đúng nội dung file', async () => {
    const userId = 'user-1'
    const content = Buffer.from('hello-world-this-is-a-fake-video-payload-0123456789')

    const { uploadId } = await svc.initUpload({
      fileName: 'clip.mp4', mimeType: 'video/mp4', totalSize: content.length, userId,
    })
    expect(uploadId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)

    let offset = 0
    const step = 7
    while (offset < content.length) {
      const end = Math.min(offset + step, content.length)
      const res = await svc.appendChunk({ uploadId, offset, data: content.subarray(offset, end), userId })
      offset = res.received
    }

    const final = await svc.finalizeUpload({ uploadId, userId })
    expect(final.publicUrl).toMatch(/^\/uploads\/videos\/uploads\//)
    expect(final.fileSize).toBe(content.length)

    const onDisk = await fs.readFile(path.join(tmpRoot, final.relativePath))
    expect(onDisk.equals(content)).toBe(true)
  })

  it('chặn phần sai thứ tự (offset không khớp)', async () => {
    const userId = 'u'
    const { uploadId } = await svc.initUpload({ fileName: 'a.mp4', mimeType: 'video/mp4', totalSize: 20, userId })
    await svc.appendChunk({ uploadId, offset: 0, data: Buffer.alloc(5, 1), userId })
    await expect(
      svc.appendChunk({ uploadId, offset: 10, data: Buffer.alloc(5, 1), userId })
    ).rejects.toThrow()
  })

  it('idempotent khi gửi lại phần đã nhận', async () => {
    const userId = 'u'
    const content = Buffer.from('abcdefghij')
    const { uploadId } = await svc.initUpload({ fileName: 'b.mp4', mimeType: 'video/mp4', totalSize: 10, userId })
    await svc.appendChunk({ uploadId, offset: 0, data: content.subarray(0, 5), userId })
    const dup = await svc.appendChunk({ uploadId, offset: 0, data: content.subarray(0, 5), userId })
    expect(dup.received).toBe(5)
  })

  it('enforce ownership — user khác không truy cập được phiên', async () => {
    const { uploadId } = await svc.initUpload({ fileName: 'c.mp4', mimeType: 'video/mp4', totalSize: 10, userId: 'owner' })
    await expect(svc.getUploadStatus({ uploadId, userId: 'intruder' })).rejects.toThrow()
  })

  it('từ chối mime không phải video', async () => {
    await expect(
      svc.initUpload({ fileName: 'x.txt', mimeType: 'text/plain', totalSize: 10, userId: 'u' })
    ).rejects.toThrow()
  })

  it('finalize thất bại khi chưa đủ byte', async () => {
    const userId = 'u'
    const { uploadId } = await svc.initUpload({ fileName: 'd.mp4', mimeType: 'video/mp4', totalSize: 100, userId })
    await svc.appendChunk({ uploadId, offset: 0, data: Buffer.alloc(10, 2), userId })
    await expect(svc.finalizeUpload({ uploadId, userId })).rejects.toThrow()
  })
})
