/**
 * Video Chunked Upload Service
 *
 * Quản lý upload video theo từng phần (chunked/resumable) cho file dung lượng lớn,
 * KHÔNG giới hạn dung lượng (chỉ phụ thuộc dung lượng đĩa). Mỗi phần nhỏ được ghi
 * nối tiếp ra một file tạm trên đĩa nên không nạp toàn bộ file vào RAM, đồng thời
 * tránh giới hạn body-size của reverse proxy.
 *
 * Luồng: init -> (append nhiều lần) -> finalize. Hỗ trợ resume nhờ trả về số byte
 * đã nhận (getStatus); client tiếp tục từ offset đó.
 *
 * Lưu trữ tạm: public/uploads/temp/<uploadId>.part (+ .json metadata).
 * File hoàn tất chuyển sang: public/uploads/videos/uploads/<storedName>.
 */

import fs from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { getAbsolutePath, getFileUrl } from '@/lib/local-storage'

// Kích thước phần đề xuất cho client (8MB) — đủ nhỏ để tránh giới hạn proxy,
// đủ lớn để throughput tốt.
export const SUGGESTED_CHUNK_SIZE = 8 * 1024 * 1024

// Trần dung lượng tùy chọn (MB) qua env. 0 / không đặt = không giới hạn.
const VIDEO_MAX_MB = parseInt(process.env.MAX_VIDEO_UPLOAD_MB || '0', 10)
const VIDEO_SIZE_LIMIT = VIDEO_MAX_MB > 0 ? VIDEO_MAX_MB * 1024 * 1024 : 0

const TEMP_CATEGORY = 'temp'
const FINAL_CATEGORY_PATH = 'videos/uploads'

const UPLOAD_ID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface UploadMetadata {
  uploadId: string
  fileName: string
  mimeType: string
  totalSize: number
  userId: string
  createdAt: string
}

export class VideoUploadError extends Error {
  statusCode: number
  constructor(message: string, statusCode = 400) {
    super(message)
    this.name = 'VideoUploadError'
    this.statusCode = statusCode
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function assertValidUploadId(uploadId: string): void {
  if (!uploadId || !UPLOAD_ID_REGEX.test(uploadId)) {
    throw new VideoUploadError('uploadId không hợp lệ', 400)
  }
}

function isVideoMime(mimeType: string): boolean {
  return typeof mimeType === 'string' && mimeType.startsWith('video/')
}

function partPath(uploadId: string): string {
  return getAbsolutePath(path.join(TEMP_CATEGORY, `${uploadId}.part`))
}

function metaPath(uploadId: string): string {
  return getAbsolutePath(path.join(TEMP_CATEGORY, `${uploadId}.json`))
}

async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true })
}

async function readMetadata(uploadId: string): Promise<UploadMetadata> {
  try {
    const raw = await fs.readFile(metaPath(uploadId), 'utf-8')
    return JSON.parse(raw) as UploadMetadata
  } catch {
    throw new VideoUploadError('Phiên upload không tồn tại hoặc đã hết hạn', 404)
  }
}

function assertOwnership(meta: UploadMetadata, userId: string): void {
  if (meta.userId !== userId) {
    throw new VideoUploadError('Không có quyền với phiên upload này', 403)
  }
}

async function getPartSize(uploadId: string): Promise<number> {
  try {
    const stats = await fs.stat(partPath(uploadId))
    return stats.size
  } catch {
    return 0
  }
}

function generateStoredName(originalName: string): string {
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  const ext = path.extname(originalName) || '.mp4'
  const baseName = path
    .basename(originalName, path.extname(originalName))
    .replace(/[^a-zA-Z0-9]/g, '-')
    .substring(0, 50)
  return `${timestamp}-${randomStr}-${baseName}${ext}`
}

// ============================================================================
// CORE
// ============================================================================

/**
 * Khởi tạo một phiên upload. Tạo file tạm rỗng + metadata.
 */
export async function initUpload(input: {
  fileName: string
  mimeType: string
  totalSize: number
  userId: string
}): Promise<{ uploadId: string; chunkSize: number }> {
  const { fileName, mimeType, totalSize, userId } = input

  if (!fileName || typeof totalSize !== 'number' || totalSize <= 0) {
    throw new VideoUploadError('Thiếu thông tin file (fileName/totalSize)', 400)
  }
  if (!isVideoMime(mimeType)) {
    throw new VideoUploadError('Chỉ chấp nhận file video', 400)
  }
  if (VIDEO_SIZE_LIMIT > 0 && totalSize > VIDEO_SIZE_LIMIT) {
    throw new VideoUploadError(`File quá lớn. Giới hạn: ${VIDEO_MAX_MB}MB`, 400)
  }

  const uploadId = randomUUID()
  await ensureDir(getAbsolutePath(TEMP_CATEGORY))

  // Tạo file part rỗng
  await fs.writeFile(partPath(uploadId), Buffer.alloc(0))

  const meta: UploadMetadata = {
    uploadId,
    fileName,
    mimeType,
    totalSize,
    userId,
    createdAt: new Date().toISOString(),
  }
  await fs.writeFile(metaPath(uploadId), JSON.stringify(meta), 'utf-8')

  return { uploadId, chunkSize: SUGGESTED_CHUNK_SIZE }
}

/**
 * Nối một phần dữ liệu vào file tạm. Phải nối tuần tự đúng offset.
 * - offset === kích thước hiện tại  -> append.
 * - offset < kích thước hiện tại    -> phần đã nhận trước đó (idempotent), bỏ qua.
 * - offset > kích thước hiện tại    -> sai thứ tự -> lỗi (client cần gọi getStatus để resume).
 */
export async function appendChunk(input: {
  uploadId: string
  offset: number
  data: Buffer
  userId: string
}): Promise<{ received: number; totalSize: number }> {
  const { uploadId, offset, data, userId } = input
  assertValidUploadId(uploadId)

  const meta = await readMetadata(uploadId)
  assertOwnership(meta, userId)

  const currentSize = await getPartSize(uploadId)

  // Phần này đã được nhận trọn vẹn trước đó -> idempotent
  if (offset + data.length <= currentSize) {
    return { received: currentSize, totalSize: meta.totalSize }
  }
  if (offset !== currentSize) {
    throw new VideoUploadError(
      `Sai thứ tự phần dữ liệu. Mong đợi offset=${currentSize}, nhận=${offset}`,
      409
    )
  }
  if (meta.totalSize && currentSize + data.length > meta.totalSize) {
    throw new VideoUploadError('Dữ liệu vượt quá kích thước đã khai báo', 400)
  }

  await fs.appendFile(partPath(uploadId), data)
  const received = currentSize + data.length
  return { received, totalSize: meta.totalSize }
}

/**
 * Lấy trạng thái phiên upload để resume.
 */
export async function getUploadStatus(input: {
  uploadId: string
  userId: string
}): Promise<{ received: number; totalSize: number }> {
  const { uploadId, userId } = input
  assertValidUploadId(uploadId)
  const meta = await readMetadata(uploadId)
  assertOwnership(meta, userId)
  const received = await getPartSize(uploadId)
  return { received, totalSize: meta.totalSize }
}

/**
 * Hoàn tất: kiểm tra đủ byte, chuyển file tạm sang thư mục video chính thức.
 * Trả về metadata để route tạo bản ghi Video.
 */
export async function finalizeUpload(input: {
  uploadId: string
  userId: string
}): Promise<{
  publicUrl: string
  relativePath: string
  fileName: string
  mimeType: string
  fileSize: number
}> {
  const { uploadId, userId } = input
  assertValidUploadId(uploadId)

  const meta = await readMetadata(uploadId)
  assertOwnership(meta, userId)

  const currentSize = await getPartSize(uploadId)
  if (meta.totalSize && currentSize !== meta.totalSize) {
    throw new VideoUploadError(
      `Upload chưa hoàn tất (${currentSize}/${meta.totalSize} byte)`,
      409
    )
  }

  const storedName = generateStoredName(meta.fileName)
  const relativePath = path.join(FINAL_CATEGORY_PATH, storedName)
  const targetDir = getAbsolutePath(FINAL_CATEGORY_PATH)
  await ensureDir(targetDir)

  await fs.rename(partPath(uploadId), getAbsolutePath(relativePath))

  // Dọn metadata; phần .part đã được rename nên không còn
  await fs.unlink(metaPath(uploadId)).catch(() => undefined)

  return {
    publicUrl: getFileUrl(relativePath, true), // -> /uploads/videos/uploads/<storedName>
    relativePath,
    fileName: meta.fileName,
    mimeType: meta.mimeType,
    fileSize: currentSize,
  }
}

/**
 * Hủy phiên upload: xóa file tạm + metadata.
 */
export async function abortUpload(input: {
  uploadId: string
  userId: string
}): Promise<void> {
  const { uploadId, userId } = input
  assertValidUploadId(uploadId)
  const meta = await readMetadata(uploadId)
  assertOwnership(meta, userId)
  await fs.unlink(partPath(uploadId)).catch(() => undefined)
  await fs.unlink(metaPath(uploadId)).catch(() => undefined)
}
