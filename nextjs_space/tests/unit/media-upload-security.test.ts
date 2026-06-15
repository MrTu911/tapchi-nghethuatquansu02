/**
 * Security tests — validate file upload (lib/file-security.ts).
 *
 * Theo .claude/rules/security.md (File upload): validate loại file, kích thước,
 * KHÔNG tin tên file từ client, chống file thực thi / double-extension / nội dung
 * độc hại, và xác thực magic bytes (fail-closed). file-security.ts là validator
 * CHÍNH tắc dùng chung cho mọi luồng upload.
 *
 * CẬP NHẬT (F2 đã sửa): /api/media nay gọi `validateMediaFile` từ file-security.ts —
 * xác thực magic bytes cho ảnh + video, KHÔNG còn tin file.type từ client.
 */

import {
  validateFile,
  verifyFileSignature,
  isExecutable,
  scanTextContent,
  generateSecureFilename,
  createFileHash,
  validateMediaFile,
  verifyMediaSignature,
} from '@/lib/file-security'

const PDF = 'application/pdf'

describe('validateFile — kích thước & loại file', () => {
  it('chấp nhận file hợp lệ và sinh secureFilename ngẫu nhiên', () => {
    const res = validateFile('report.pdf', 1024, PDF)
    expect(res.valid).toBe(true)
    expect(res.sanitizedFilename).toBe('report.pdf')
    expect(res.secureFilename).toMatch(/^\d+-[a-f0-9]{16}\.pdf$/)
  })

  it('từ chối file vượt quá kích thước tối đa', () => {
    const res = validateFile('big.pdf', 60 * 1024 * 1024, PDF, 50 * 1024 * 1024)
    expect(res.valid).toBe(false)
    expect(res.error).toMatch(/quá lớn/i)
  })

  it('từ chối file rỗng (0 byte)', () => {
    expect(validateFile('empty.pdf', 0, PDF).valid).toBe(false)
  })

  it('từ chối MIME type không nằm trong whitelist', () => {
    const res = validateFile('virus.exe', 1024, 'application/x-msdownload')
    expect(res.valid).toBe(false)
    expect(res.error).toMatch(/không được hỗ trợ/i)
  })

  it('từ chối double-extension (vd: invoice.pdf.exe)', () => {
    const res = validateFile('invoice.pdf.exe', 1024, PDF)
    expect(res.valid).toBe(false)
    expect(res.error).toMatch(/phần mở rộng/i)
  })

  it('KHÔNG tin tên file client: vô hiệu hóa path traversal', () => {
    const res = validateFile('../../etc/passwd.pdf', 1024, PDF)
    // sanitize loại bỏ dấu "/" và ".." → tên file an toàn, không chứa đường dẫn
    expect(res.sanitizedFilename).not.toContain('/')
    expect(res.sanitizedFilename).not.toContain('..')
  })
})

describe('verifyFileSignature — magic bytes (fail-closed)', () => {
  it('đúng magic bytes PDF → hợp lệ', () => {
    const pdf = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]) // %PDF-
    expect(verifyFileSignature(pdf, PDF)).toBe(true)
  })

  it('sai magic bytes cho PDF → từ chối', () => {
    const fake = Buffer.from([0x00, 0x01, 0x02, 0x03])
    expect(verifyFileSignature(fake, PDF)).toBe(false)
  })

  it('MIME không có trong bảng chữ ký → từ chối (fail-closed)', () => {
    const any = Buffer.from([0x25, 0x50, 0x44, 0x46])
    expect(verifyFileSignature(any, 'application/x-unknown')).toBe(false)
  })

  it('text/plain (không có magic bytes đặc trưng) → bỏ qua kiểm tra', () => {
    expect(verifyFileSignature(Buffer.from('hello'), 'text/plain')).toBe(true)
  })
})

describe('isExecutable — chặn file thực thi', () => {
  it.each(['malware.exe', 'script.sh', 'run.bat', 'evil.js'])('chặn %s', (name) => {
    expect(isExecutable(name)).toBe(true)
  })

  it.each(['photo.png', 'paper.pdf', 'data.xlsx'])('cho phép %s', (name) => {
    expect(isExecutable(name)).toBe(false)
  })
})

describe('scanTextContent — quét nội dung độc hại', () => {
  it('phát hiện thẻ <script>', () => {
    const r = scanTextContent('<script>alert(1)</script>')
    expect(r.safe).toBe(false)
    expect(r.threats.length).toBeGreaterThan(0)
  })

  it('phát hiện giao thức javascript:', () => {
    expect(scanTextContent('click <a href="javascript:evil()">').safe).toBe(false)
  })

  it('văn bản sạch → an toàn', () => {
    expect(scanTextContent('Nghệ thuật chiến dịch trong tác chiến hiện đại.').safe).toBe(true)
  })
})

describe('hashing & secure filename', () => {
  it('createFileHash xác định (cùng buffer → cùng hash sha256)', () => {
    const buf = Buffer.from('NTQS')
    const h1 = createFileHash(buf)
    const h2 = createFileHash(Buffer.from('NTQS'))
    expect(h1).toBe(h2)
    expect(h1).toMatch(/^[a-f0-9]{64}$/)
  })

  it('generateSecureFilename luôn khác nhau giữa các lần gọi', () => {
    expect(generateSecureFilename('pdf')).not.toBe(generateSecureFilename('pdf'))
  })
})

// ── F2: validator media (ảnh + video) dùng cho /api/media ──────────────────
const JPEG_HEADER = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0, 0, 0])
const GIF_HEADER = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
const WEBP_HEADER = Buffer.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0, 0, 0, 0])
const MP4_HEADER = Buffer.from([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0, 0, 0, 0])
const OGG_HEADER = Buffer.from([0x4f, 0x67, 0x67, 0x53, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
const EXE_HEADER = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]) // "MZ" (PE)

describe('verifyMediaSignature — magic bytes ảnh/video (fail-closed)', () => {
  it('khớp đúng chữ ký ảnh JPEG/PNG/GIF/WEBP', () => {
    expect(verifyMediaSignature(JPEG_HEADER, 'image/jpeg')).toBe(true)
    expect(verifyMediaSignature(PNG_HEADER, 'image/png')).toBe(true)
    expect(verifyMediaSignature(GIF_HEADER, 'image/gif')).toBe(true)
    expect(verifyMediaSignature(WEBP_HEADER, 'image/webp')).toBe(true)
  })

  it('khớp chữ ký video MP4 (ftyp tại offset 4) và OGG', () => {
    expect(verifyMediaSignature(MP4_HEADER, 'video/mp4')).toBe(true)
    expect(verifyMediaSignature(OGG_HEADER, 'video/ogg')).toBe(true)
  })

  it('WEBP thiếu chữ ký "WEBP" tại offset 8 → từ chối', () => {
    const riffOnly = Buffer.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    expect(verifyMediaSignature(riffOnly, 'image/webp')).toBe(false)
  })

  it('nội dung không khớp loại khai báo → từ chối (vd: EXE khai là PNG)', () => {
    expect(verifyMediaSignature(EXE_HEADER, 'image/png')).toBe(false)
  })

  it('MIME ngoài bảng → từ chối (fail-closed)', () => {
    expect(verifyMediaSignature(JPEG_HEADER, 'application/x-msdownload')).toBe(false)
  })
})

describe('validateMediaFile — validate đầy đủ cho upload media', () => {
  it('chấp nhận ảnh PNG hợp lệ', () => {
    const r = validateMediaFile('photo.png', 1024, 'image/png', PNG_HEADER)
    expect(r.valid).toBe(true)
    expect(r.kind).toBe('image')
  })

  it('chấp nhận video MP4 hợp lệ', () => {
    const r = validateMediaFile('clip.mp4', 5 * 1024 * 1024, 'video/mp4', MP4_HEADER)
    expect(r.valid).toBe(true)
    expect(r.kind).toBe('video')
  })

  it('chuẩn hóa image/jpg → image/jpeg và chấp nhận', () => {
    const r = validateMediaFile('photo.jpg', 1024, 'image/jpg', JPEG_HEADER)
    expect(r.valid).toBe(true)
    expect(r.normalizedMime).toBe('image/jpeg')
  })

  it('CHẶN tấn công giả mạo MIME: file EXE đổi tên .png khai là image/png', () => {
    const r = validateMediaFile('malware.png', 1024, 'image/png', EXE_HEADER)
    expect(r.valid).toBe(false)
    expect(r.error).toMatch(/không khớp định dạng/i)
  })

  it('từ chối loại file không phải media (vd: application/pdf)', () => {
    const r = validateMediaFile('doc.pdf', 1024, 'application/pdf', Buffer.from([0x25, 0x50, 0x44, 0x46]))
    expect(r.valid).toBe(false)
    expect(r.error).toMatch(/không được hỗ trợ/i)
  })

  it('từ chối ảnh > 10MB', () => {
    const r = validateMediaFile('big.png', 11 * 1024 * 1024, 'image/png', PNG_HEADER)
    expect(r.valid).toBe(false)
    expect(r.error).toMatch(/quá lớn/i)
  })

  it('từ chối video > 100MB', () => {
    const r = validateMediaFile('big.mp4', 101 * 1024 * 1024, 'video/mp4', MP4_HEADER)
    expect(r.valid).toBe(false)
    expect(r.error).toMatch(/quá lớn/i)
  })

  it('từ chối file rỗng', () => {
    expect(validateMediaFile('empty.png', 0, 'image/png', PNG_HEADER).valid).toBe(false)
  })

  it('từ chối file thực thi (đuôi .exe)', () => {
    const r = validateMediaFile('evil.exe', 1024, 'image/png', PNG_HEADER)
    expect(r.valid).toBe(false)
    expect(r.error).toMatch(/thực thi/i)
  })

  it('từ chối double-extension (vd: photo.png.gif)', () => {
    const r = validateMediaFile('photo.png.gif', 1024, 'image/png', PNG_HEADER)
    expect(r.valid).toBe(false)
    expect(r.error).toMatch(/phần mở rộng/i)
  })

  it('allowVideo=false (banner/news): từ chối video dù chữ ký hợp lệ', () => {
    const r = validateMediaFile('clip.mp4', 1024, 'video/mp4', MP4_HEADER, { allowVideo: false })
    expect(r.valid).toBe(false)
    expect(r.error).toMatch(/chỉ chấp nhận ảnh/i)
  })
})
