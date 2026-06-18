/**
 * storage-path.ts
 *
 * Quy đổi đường dẫn file đã lưu trong DB về absolute path để đọc bytes.
 *
 * DB lưu file dưới 2 dạng:
 *   1. URL công khai bắt đầu bằng '/' — ví dụ '/uploads/...' hoặc '/data/issues/...'
 *      → file nằm dưới thư mục `public/`.
 *   2. Đường dẫn tương đối từ UPLOAD_ROOT — ví dụ 'documents/issues/...' (kết quả saveFile)
 *      → quy đổi bằng getAbsolutePath (UPLOAD_ROOT có thể khác `public/uploads` qua env).
 *
 * Tách riêng ở đây để corpus build, tách PDF, sinh EPUB... dùng chung một quy tắc.
 */

import path from 'path'
import { getAbsolutePath } from '@/lib/local-storage'

const PUBLIC_DIR = path.join(process.cwd(), 'public')

export function resolveStoredFileToAbsolute(stored: string): string {
  if (stored.startsWith('/')) {
    return path.join(PUBLIC_DIR, stored.replace(/^\/+/, ''))
  }
  return getAbsolutePath(stored)
}
