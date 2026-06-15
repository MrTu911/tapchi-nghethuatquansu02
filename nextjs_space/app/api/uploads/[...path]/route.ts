/**
 * Public Upload File Server (local filesystem)
 *
 * Phục vụ file trong public/uploads ĐỌC TỪ ĐĨA LÚC REQUEST — vì `next start`
 * KHÔNG serve các file được thêm vào public/ sau khi server khởi động (file upload
 * runtime sẽ 404 cho tới khi restart). Route này được rewrite từ `/uploads/:path*`
 * (xem next.config.js) nên mọi URL `/uploads/...` cũ vẫn hoạt động.
 *
 * Hỗ trợ HTTP Range (206) để tua/seek video lớn và stream không nạp toàn bộ vào RAM.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createReadStream } from 'fs'
import { Readable } from 'stream'
import path from 'path'
import { getAbsolutePath, fileExists, getFileStats } from '@/lib/local-storage'

export const dynamic = 'force-dynamic'

const MIME_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg',
  '.ogv': 'video/ogg',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.mkv': 'video/x-matroska',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.wav': 'audio/wav',
  '.aac': 'audio/aac',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

function getContentType(filePath: string): string {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream'
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const relativePath = params.path.map((seg) => decodeURIComponent(seg)).join('/')

    // Chống path traversal
    if (relativePath.includes('..') || relativePath.includes('\0')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }

    if (!(await fileExists(relativePath))) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const absolutePath = getAbsolutePath(relativePath)
    const stats = await getFileStats(relativePath)
    const fileSize = stats.size
    const contentType = getContentType(relativePath)
    const rangeHeader = request.headers.get('range')

    // Yêu cầu Range (tua video) -> trả 206 Partial Content
    if (rangeHeader) {
      const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader)
      let start = match && match[1] ? parseInt(match[1], 10) : 0
      let end = match && match[2] ? parseInt(match[2], 10) : fileSize - 1
      if (isNaN(start) || start < 0) start = 0
      if (isNaN(end) || end >= fileSize) end = fileSize - 1

      if (start > end) {
        return new NextResponse(null, {
          status: 416,
          headers: { 'Content-Range': `bytes */${fileSize}` },
        })
      }

      const nodeStream = createReadStream(absolutePath, { start, end })
      const webStream = Readable.toWeb(nodeStream) as ReadableStream
      return new NextResponse(webStream, {
        status: 206,
        headers: {
          'Content-Type': contentType,
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(end - start + 1),
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }

    // Không Range -> stream toàn bộ
    const nodeStream = createReadStream(absolutePath)
    const webStream = Readable.toWeb(nodeStream) as ReadableStream
    return new NextResponse(webStream, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(fileSize),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Error serving upload file:', error)
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 })
  }
}
