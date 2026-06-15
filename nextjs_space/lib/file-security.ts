
/**
 * ✅ FILE UPLOAD SECURITY
 * Comprehensive security for file uploads
 */

import crypto from 'crypto'
import path from 'path'
import { sanitizeFilename } from './validation'

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
] as const

// File extension mapping
const MIME_TO_EXT: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'text/plain': 'txt',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp'
}

// Magic bytes for file type verification
const FILE_SIGNATURES: Record<string, number[][]> = {
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header (WebP)
  'application/zip': [[0x50, 0x4B, 0x03, 0x04], [0x50, 0x4B, 0x05, 0x06]],
  // DOCX và XLSX là ZIP file — cùng magic bytes PK\x03\x04
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    [0x50, 0x4B, 0x03, 0x04],
    [0x50, 0x4B, 0x05, 0x06],
  ],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
    [0x50, 0x4B, 0x03, 0x04],
    [0x50, 0x4B, 0x05, 0x06],
  ],
  // DOC và XLS là OLE Compound File — magic bytes D0 CF 11 E0
  'application/msword': [[0xD0, 0xCF, 0x11, 0xE0]],
  'application/vnd.ms-excel': [[0xD0, 0xCF, 0x11, 0xE0]],
  // Plain text: không có magic bytes đặc trưng — bỏ qua signature check
  // (xử lý bằng content scan)
  'text/plain': [],
}

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean
  error?: string
  sanitizedFilename?: string
  secureFilename?: string
}

/**
 * Validate file upload
 */
export function validateFile(
  filename: string,
  size: number,
  mimeType: string,
  maxSize: number = 50 * 1024 * 1024 // 50MB default
): FileValidationResult {
  // Check file size
  if (size > maxSize) {
    return {
      valid: false,
      error: `File quá lớn. Kích thước tối đa: ${Math.round(maxSize / 1024 / 1024)}MB`
    }
  }
  
  if (size === 0) {
    return {
      valid: false,
      error: 'File trống không được phép'
    }
  }
  
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(mimeType as any)) {
    return {
      valid: false,
      error: 'Loại file không được hỗ trợ'
    }
  }
  
  // Sanitize filename
  const sanitized = sanitizeFilename(filename)
  if (!sanitized) {
    return {
      valid: false,
      error: 'Tên file không hợp lệ'
    }
  }
  
  // Check for double extensions (e.g., file.pdf.exe)
  const parts = sanitized.split('.')
  if (parts.length > 2) {
    return {
      valid: false,
      error: 'Tên file chứa nhiều phần mở rộng không được phép'
    }
  }
  
  // Generate secure filename
  const ext = MIME_TO_EXT[mimeType] || path.extname(sanitized).slice(1)
  const secureFilename = generateSecureFilename(ext)
  
  return {
    valid: true,
    sanitizedFilename: sanitized,
    secureFilename
  }
}

/**
 * Verify file magic bytes.
 * - Nếu MIME type không có trong FILE_SIGNATURES → từ chối (fail-closed).
 * - Nếu signatures = [] (như text/plain) → bỏ qua kiểm tra magic bytes.
 */
export function verifyFileSignature(
  buffer: Buffer,
  mimeType: string
): boolean {
  const signatures = FILE_SIGNATURES[mimeType]

  if (signatures === undefined) {
    // MIME type không được định nghĩa → từ chối (fail-closed security)
    console.warn(`[FILE-SECURITY] MIME type không có trong whitelist: ${mimeType}`)
    return false
  }

  if (signatures.length === 0) {
    // Không có magic bytes đặc trưng (vd: text/plain) → bỏ qua kiểm tra
    return true
  }

  return signatures.some(signature => {
    if (buffer.length < signature.length) return false
    return signature.every((byte, index) => buffer[index] === byte)
  })
}

/**
 * Generate secure filename
 */
export function generateSecureFilename(extension: string): string {
  const timestamp = Date.now()
  const random = crypto.randomBytes(8).toString('hex')
  return `${timestamp}-${random}.${extension}`
}

/**
 * Check if file is executable
 */
export function isExecutable(filename: string): boolean {
  const executableExtensions = [
    'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js',
    'app', 'deb', 'rpm', 'pkg', 'dmg', 'sh', 'run'
  ]
  
  const ext = path.extname(filename).slice(1).toLowerCase()
  return executableExtensions.includes(ext)
}

/**
 * Scan for malicious content in text files
 */
export function scanTextContent(content: string): { safe: boolean; threats: string[] } {
  const threats: string[] = []
  
  // Check for script tags
  if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(content)) {
    threats.push('Script tag detected')
  }
  
  // Check for iframe tags
  if (/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi.test(content)) {
    threats.push('Iframe tag detected')
  }
  
  // Check for javascript: protocol
  if (/javascript:/gi.test(content)) {
    threats.push('JavaScript protocol detected')
  }
  
  // Check for data: URLs with HTML
  if (/data:text\/html/gi.test(content)) {
    threats.push('Data URL with HTML detected')
  }
  
  return {
    safe: threats.length === 0,
    threats
  }
}

/**
 * Generate file metadata for database
 */
export interface FileMetadata {
  originalFilename: string
  sanitizedFilename: string
  secureFilename: string
  size: number
  mimeType: string
  hash: string
  uploadedAt: Date
}

/**
 * Create file hash (for deduplication and integrity checking)
 */
export function createFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

/**
 * Complete file validation with all checks
 */
export async function validateUploadedFile(
  file: File
): Promise<FileValidationResult> {
  // Basic validation
  const basicValidation = validateFile(file.name, file.size, file.type)
  if (!basicValidation.valid) {
    return basicValidation
  }
  
  // Check if executable
  if (isExecutable(file.name)) {
    return {
      valid: false,
      error: 'File thực thi không được phép upload'
    }
  }
  
  // Read file buffer for signature verification
  const buffer = Buffer.from(await file.arrayBuffer())
  
  // Verify magic bytes
  if (!verifyFileSignature(buffer, file.type)) {
    return {
      valid: false,
      error: 'File không đúng định dạng đã khai báo'
    }
  }
  
  // For text files, scan content
  if (file.type === 'text/plain') {
    const content = buffer.toString('utf8')
    const scanResult = scanTextContent(content)
    if (!scanResult.safe) {
      return {
        valid: false,
        error: `Phát hiện nội dung nguy hiểm: ${scanResult.threats.join(', ')}`
      }
    }
  }

  return basicValidation
}

// ============================================================================
// MEDIA UPLOAD (ảnh + video) — dùng cho luồng upload media công khai (/api/media)
// ----------------------------------------------------------------------------
// Luồng media KHÁC luồng tài liệu ở trên: cho phép thêm video, nên có whitelist
// và bảng magic-byte RIÊNG. Vẫn áp dụng các nguyên tắc bảo mật cốt lõi:
// không tin file.type từ client → XÁC THỰC bằng magic bytes (fail-closed),
// chặn file thực thi / double-extension / path traversal / file rỗng / quá cỡ.
// ============================================================================

export const ALLOWED_MEDIA_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const

export const ALLOWED_MEDIA_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
] as const

// 10MB cho ảnh, 100MB cho video
export const MEDIA_MAX_IMAGE_SIZE = 10 * 1024 * 1024
export const MEDIA_MAX_VIDEO_SIZE = 100 * 1024 * 1024

/** Một đoạn chữ ký: các byte phải khớp tại vị trí `offset`. */
interface SignatureSegment {
  offset: number
  bytes: number[]
}

// Mỗi MIME → danh sách "phương án" (OR); mỗi phương án là danh sách segment (AND).
// Cho phép kiểm tại nhiều offset (vd: WEBP = RIFF tại 0 VÀ "WEBP" tại 8;
// MP4/MOV = "ftyp" tại offset 4).
const MEDIA_SIGNATURES: Record<string, SignatureSegment[][]> = {
  'image/jpeg': [[{ offset: 0, bytes: [0xff, 0xd8, 0xff] }]],
  'image/png': [[{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }]],
  'image/gif': [[{ offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] }]], // GIF8(7a|9a)
  'image/webp': [[
    { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF
    { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] }, // WEBP
  ]],
  'video/mp4': [[{ offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }]], // ....ftyp (ISO BMFF)
  'video/quicktime': [[{ offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }]], // ftyp (.mov)
  'video/webm': [[{ offset: 0, bytes: [0x1a, 0x45, 0xdf, 0xa3] }]], // EBML
  'video/ogg': [[{ offset: 0, bytes: [0x4f, 0x67, 0x67, 0x53] }]], // OggS
}

/**
 * Xác thực magic bytes cho media (ảnh/video) — fail-closed.
 * - MIME không có trong bảng → từ chối.
 * - Khớp nếu ÍT NHẤT một phương án có TẤT CẢ segment khớp.
 */
export function verifyMediaSignature(buffer: Buffer, mimeType: string): boolean {
  const alternatives = MEDIA_SIGNATURES[mimeType]
  if (!alternatives) return false // fail-closed

  return alternatives.some((segments) =>
    segments.every((seg) => {
      if (buffer.length < seg.offset + seg.bytes.length) return false
      return seg.bytes.every((byte, i) => buffer[seg.offset + i] === byte)
    })
  )
}

export interface MediaValidationResult {
  valid: boolean
  error?: string
  kind?: 'image' | 'video'
  normalizedMime?: string
}

/**
 * Validate file upload media (ảnh/video).
 *
 * Chỉ cần `headerBytes` = một ít byte đầu file (≥ 16 byte) để kiểm chữ ký — KHÔNG
 * cần đọc toàn bộ file vào RAM trước khi xác thực (tránh nuốt file lớn độc hại).
 *
 * @param filename    tên file gốc từ client (KHÔNG tin tưởng)
 * @param size        kích thước byte (lấy từ metadata, không cần đọc nội dung)
 * @param mimeType    MIME do client khai báo (sẽ được kiểm lại bằng magic bytes)
 * @param headerBytes vài byte đầu của file để xác thực chữ ký
 */
export function validateMediaFile(
  filename: string,
  size: number,
  mimeType: string,
  headerBytes: Buffer,
  opts: { allowVideo?: boolean } = {}
): MediaValidationResult {
  const { allowVideo = true } = opts

  // Chuẩn hóa biến thể MIME phổ biến từ client
  const mime = mimeType === 'image/jpg' ? 'image/jpeg' : mimeType

  const isImage = (ALLOWED_MEDIA_IMAGE_TYPES as readonly string[]).includes(mime)
  const isVideo = allowVideo && (ALLOWED_MEDIA_VIDEO_TYPES as readonly string[]).includes(mime)

  if (!isImage && !isVideo) {
    return {
      valid: false,
      error: allowVideo
        ? 'Loại file không được hỗ trợ (chỉ ảnh JPEG/PNG/GIF/WEBP hoặc video MP4/WEBM/OGG/MOV)'
        : 'Chỉ chấp nhận ảnh JPEG/PNG/GIF/WEBP',
    }
  }

  if (size === 0) {
    return { valid: false, error: 'File trống không được phép' }
  }

  const maxSize = isVideo ? MEDIA_MAX_VIDEO_SIZE : MEDIA_MAX_IMAGE_SIZE
  if (size > maxSize) {
    return { valid: false, error: `File quá lớn. Tối đa cho ${isVideo ? 'video' : 'ảnh'}: ${Math.round(maxSize / 1024 / 1024)}MB` }
  }

  // KHÔNG tin tên file client: chặn file thực thi, double-extension, path traversal
  if (isExecutable(filename)) {
    return { valid: false, error: 'File thực thi không được phép upload' }
  }
  const sanitized = sanitizeFilename(filename)
  if (!sanitized) {
    return { valid: false, error: 'Tên file không hợp lệ' }
  }
  if (sanitized.split('.').length > 2) {
    return { valid: false, error: 'Tên file chứa nhiều phần mở rộng không được phép' }
  }

  // Xác thực thực chất: nội dung file phải khớp loại đã khai báo
  if (!verifyMediaSignature(headerBytes, mime)) {
    return { valid: false, error: 'Nội dung file không khớp định dạng đã khai báo' }
  }

  return { valid: true, kind: isVideo ? 'video' : 'image', normalizedMime: mime }
}
